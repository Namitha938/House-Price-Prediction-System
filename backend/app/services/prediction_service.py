"""
MongoDB-backed Prediction Service handling ML inference, document persistence, and analytics.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from pymongo.collection import Collection

from app.database import get_predictions_collection
from app.schemas.prediction import (
    HouseFeaturesInput,
    PredictionResponse,
    PredictionHistoryRecord,
    PaginatedPredictions,
    DashboardStats,
    ChartData
)
from app.ml.predict import get_predictor

class PredictionService:
    def __init__(self):
        self.predictor = get_predictor()

    @property
    def collection(self) -> Collection:
        return get_predictions_collection()

    def create_prediction(self, input_data: HouseFeaturesInput) -> PredictionResponse:
        model_features = input_data.to_model_features()
        
        # Run inference using preloaded pipeline
        predictions = self.predictor.predict(model_features)
        predicted_price = predictions[0]

        now = datetime.now(timezone.utc)
        doc = {
            "created_at": now,
            "predicted_price": predicted_price,
            "model_version": "1.0.0",
            "overall_qual": input_data.OverallQual,
            "gr_liv_area": input_data.GrLivArea,
            "total_bsmt_sf": input_data.TotalBsmtSF,
            "first_flr_sf": input_data.first_flr_sf,
            "full_bath": input_data.FullBath,
            "half_bath": input_data.HalfBath,
            "bedroom_abv_gr": input_data.BedroomAbvGr,
            "tot_rms_abv_grd": input_data.TotRmsAbvGrd,
            "fireplaces": input_data.Fireplaces,
            "garage_cars": input_data.GarageCars,
            "garage_area": input_data.GarageArea,
            "year_built": input_data.YearBuilt,
            "year_remod_add": input_data.YearRemodAdd,
            "lot_area": input_data.LotArea,
            "neighborhood": input_data.Neighborhood,
            "bldg_type": input_data.BldgType,
            "house_style": input_data.HouseStyle,
            "central_air": input_data.CentralAir,
            "input_features": input_data.model_dump(by_alias=True)
        }
        
        res = self.collection.insert_one(doc)
        doc_id = str(res.inserted_id)

        return PredictionResponse(
            id=doc_id,
            predicted_price=predicted_price,
            model_version="1.0.0",
            created_at=now.isoformat(),
            input_features=input_data.model_dump(by_alias=True)
        )

    def get_predictions(self, page: int = 1, page_size: int = 10) -> PaginatedPredictions:
        total = self.collection.count_documents({})
        total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
        
        skip = (page - 1) * page_size
        cursor = self.collection.find().sort("created_at", -1).skip(skip).limit(page_size)

        items = []
        for doc in cursor:
            items.append(
                PredictionHistoryRecord(
                    id=str(doc["_id"]),
                    predicted_price=doc["predicted_price"],
                    model_version=doc.get("model_version", "1.0.0"),
                    created_at=doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"]),
                    overall_qual=doc["overall_qual"],
                    gr_liv_area=doc["gr_liv_area"],
                    total_bsmt_sf=doc["total_bsmt_sf"],
                    bedroom_abv_gr=doc["bedroom_abv_gr"],
                    full_bath=doc["full_bath"],
                    garage_cars=doc["garage_cars"],
                    year_built=doc["year_built"],
                    neighborhood=doc["neighborhood"],
                    bldg_type=doc["bldg_type"],
                    house_style=doc["house_style"],
                    input_features=doc.get("input_features", {})
                )
            )

        return PaginatedPredictions(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    def get_prediction_by_id(self, prediction_id: str) -> Optional[PredictionHistoryRecord]:
        try:
            query = {"_id": ObjectId(prediction_id)}
        except Exception:
            return None

        doc = self.collection.find_one(query)
        if not doc:
            return None

        return PredictionHistoryRecord(
            id=str(doc["_id"]),
            predicted_price=doc["predicted_price"],
            model_version=doc.get("model_version", "1.0.0"),
            created_at=doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"]),
            overall_qual=doc["overall_qual"],
            gr_liv_area=doc["gr_liv_area"],
            total_bsmt_sf=doc["total_bsmt_sf"],
            bedroom_abv_gr=doc["bedroom_abv_gr"],
            full_bath=doc["full_bath"],
            garage_cars=doc["garage_cars"],
            year_built=doc["year_built"],
            neighborhood=doc["neighborhood"],
            bldg_type=doc["bldg_type"],
            house_style=doc["house_style"],
            input_features=doc.get("input_features", {})
        )

    def delete_prediction(self, prediction_id: str) -> bool:
        try:
            query = {"_id": ObjectId(prediction_id)}
        except Exception:
            return False

        res = self.collection.delete_one(query)
        return res.deleted_count > 0

    def get_dashboard_stats(self) -> DashboardStats:
        total = self.collection.count_documents({})
        if total == 0:
            return DashboardStats(
                total_predictions=0,
                avg_price=0.0,
                min_price=0.0,
                max_price=0.0,
                latest_prediction=None,
                common_neighborhood=None
            )

        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "avg_price": {"$avg": "$predicted_price"},
                    "min_price": {"$min": "$predicted_price"},
                    "max_price": {"$max": "$predicted_price"},
                }
            }
        ]
        agg_result = list(self.collection.aggregate(pipeline))
        avg_price = agg_result[0]["avg_price"] if agg_result else 0.0
        min_price = agg_result[0]["min_price"] if agg_result else 0.0
        max_price = agg_result[0]["max_price"] if agg_result else 0.0

        latest_doc = self.collection.find().sort("created_at", -1).limit(1)
        latest_time = None
        for d in latest_doc:
            latest_time = d["created_at"].isoformat() if isinstance(d["created_at"], datetime) else str(d["created_at"])

        # Most common neighborhood
        neigh_pipeline = [
            {"$group": {"_id": "$neighborhood", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        neigh_res = list(self.collection.aggregate(neigh_pipeline))
        common_neighborhood = neigh_res[0]["_id"] if neigh_res else None

        return DashboardStats(
            total_predictions=total,
            avg_price=round(float(avg_price), 2),
            min_price=round(float(min_price), 2),
            max_price=round(float(max_price), 2),
            latest_prediction=latest_time,
            common_neighborhood=common_neighborhood
        )

    def get_chart_data(self) -> ChartData:
        docs = list(self.collection.find())
        if not docs:
            return ChartData(
                price_distribution=[],
                quality_vs_price=[],
                neighborhood_distribution=[],
                recent_activity=[]
            )

        # Price Distribution Bins
        bins = [
            {"range": "< $150k", "count": 0},
            {"range": "$150k - $200k", "count": 0},
            {"range": "$200k - $250k", "count": 0},
            {"range": "$250k - $300k", "count": 0},
            {"range": "> $300k", "count": 0},
        ]
        for d in docs:
            p = d["predicted_price"]
            if p < 150000:
                bins[0]["count"] += 1
            elif p < 200000:
                bins[1]["count"] += 1
            elif p < 250000:
                bins[2]["count"] += 1
            elif p < 300000:
                bins[3]["count"] += 1
            else:
                bins[4]["count"] += 1

        # Quality vs Price
        qual_map = {}
        for d in docs:
            q = d["overall_qual"]
            qual_map.setdefault(q, []).append(d["predicted_price"])

        quality_vs_price = [
            {
                "quality": f"Qual {q}",
                "avgPrice": round(sum(prices) / len(prices), 2),
                "count": len(prices)
            }
            for q, prices in sorted(qual_map.items())
        ]

        # Neighborhood breakdown
        neigh_map = {}
        for d in docs:
            n = d["neighborhood"]
            neigh_map.setdefault(n, []).append(d["predicted_price"])

        neighborhood_distribution = [
            {
                "neighborhood": n,
                "avgPrice": round(sum(prices) / len(prices), 2),
                "count": len(prices)
            }
            for n, prices in sorted(neigh_map.items(), key=lambda x: len(x[1]), reverse=True)[:8]
        ]

        # Recent activity (newest 10)
        recent_docs = sorted(docs, key=lambda x: x["created_at"], reverse=True)[:10]
        recent_activity = [
            {
                "id": str(d["_id"]),
                "date": d["created_at"].strftime("%b %d, %H:%M") if isinstance(d["created_at"], datetime) else str(d["created_at"])[:16],
                "price": round(d["predicted_price"], 2),
                "neighborhood": d["neighborhood"],
                "livingArea": d["gr_liv_area"],
            }
            for d in reversed(recent_docs)
        ]

        return ChartData(
            price_distribution=bins,
            quality_vs_price=quality_vs_price,
            neighborhood_distribution=neighborhood_distribution,
            recent_activity=recent_activity
        )

prediction_service = PredictionService()
