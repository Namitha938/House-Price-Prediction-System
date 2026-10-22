"""
SQLAlchemy ORM model for storing prediction history.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, Text
from app.database import Base

class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    predicted_price = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False, default="1.0.0")

    # Key indexed / searchable feature columns
    overall_qual = Column(Integer, nullable=False)
    gr_liv_area = Column(Float, nullable=False)
    total_bsmt_sf = Column(Float, nullable=False)
    first_flr_sf = Column(Float, nullable=False)
    full_bath = Column(Integer, nullable=False)
    half_bath = Column(Integer, nullable=False)
    bedroom_abv_gr = Column(Integer, nullable=False)
    tot_rms_abv_grd = Column(Integer, nullable=False)
    fireplaces = Column(Integer, nullable=False)
    garage_cars = Column(Integer, nullable=False)
    garage_area = Column(Float, nullable=False)
    year_built = Column(Integer, nullable=False)
    year_remod_add = Column(Integer, nullable=False)
    lot_area = Column(Float, nullable=False)
    neighborhood = Column(String(50), nullable=False)
    bldg_type = Column(String(50), nullable=False)
    house_style = Column(String(50), nullable=False)
    central_air = Column(String(5), nullable=False)

    # Full payload for auditability
    input_features_json = Column(Text, nullable=False)
