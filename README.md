# 🏡 ProphetVal: House Price Prediction System — Full-Stack ML Application

A production-grade, end-to-end Machine Learning web application for residential property valuation built with **React**, **Vite**, **Recharts**, **FastAPI**, **Scikit-learn**, and **MongoDB**.

Trained on the genuine **Kaggle Ames Housing Competition Dataset** (*House Prices: Advanced Regression Techniques*), this system compares multiple regression algorithms, selects the best-performing pipeline without data leakage, and serves real-time valuations through a typed REST API with persistent MongoDB audit history.

---

## 🌟 Key Features

- **Genuine Kaggle Dataset Integration**: Automated acquisition and integrity validation of the official Kaggle Ames Housing dataset (1,460 properties, 81 original features).
- **Leak-Free ML Pipeline**: Scikit-learn `Pipeline` and `ColumnTransformer` with median imputation, one-hot encoding, and standard scaling fitted strictly on training splits.
- **Candidate Model Benchmarking**: Honest comparison across baseline `DummyRegressor`, `Ridge Regression`, `Random Forest`, and `Gradient Boosting Regressor` on identical validation splits.
- **Production FastAPI Backend**: RESTful architecture with Pydantic validation schemas, comprehensive error handling, CORS headers, and lifecycle preloading.
- **Persistent MongoDB Database**: Document-based valuation audit trail with indexed queries, aggregations, paginated history, and record deletion.
- **Interactive Analytics Dashboard**: Responsive **Recharts** visualizations displaying valuation distributions, quality-to-price correlations, and neighborhood averages.
- **Architectural Input Form**: 18 housing parameters grouped into logical property dimensions with instant presets and client/server validation.
- **100% Automated Test Suite**: Pytest test suite covering ML data transformations, pipeline inference, MongoDB persistence, and all API endpoints.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Modern CSS, Lucide Icons |
| **Charts & Analytics** | Recharts (ResponsiveContainer, BarChart, Tooltip) |
| **Backend Framework** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **Machine Learning** | Scikit-learn, Pandas, NumPy, Joblib |
| **Database** | MongoDB (v8.x/v7.x) via `pymongo` and `motor` |
| **Testing** | Pytest, HTTPX, Vite build verification |

---

## 📊 Genuine ML Model Evaluation Results

Models were evaluated on a reproducible 80/20 train-validation split (1,168 train samples / 292 validation samples, seed 42):

| Candidate Model | Validation MAE | Validation RMSE | Validation R² | Status |
|---|---|---|---|---|
| **DummyRegressor (Median Baseline)** | \$59,568.25 | \$88,667.17 | -0.0250 | Baseline |
| **Ridge Regression** | \$21,339.41 | \$35,126.32 | 0.8391 | Candidate |
| **Random Forest Regressor** | \$18,044.96 | \$28,041.69 | 0.8975 | Candidate |
| **Gradient Boosting Regressor** | **\$16,710.31** | **\$25,405.01** | **0.9159** | 🏆 **Selected Best Model** |

The **Gradient Boosting Regressor** was selected based on achieving the lowest validation RMSE (\$25,405.01) and an explanatory variance of **91.59% (R² = 0.9159)**.

---

## 📁 Project Architecture & Structure

```
house-price-prediction/
├── README.md                          # Full documentation
├── .gitignore                         # Git exclusion rules
├── backend/
│   ├── .env                           # Environment configuration
│   ├── .env.example                   # Environment configuration template
│   ├── requirements.txt               # Backend Python dependencies
│   ├── app/
│   │   ├── main.py                    # FastAPI entrypoint & middleware
│   │   ├── config.py                  # Pydantic Settings
│   │   ├── database.py                # MongoDB connection & index setup
│   │   ├── ml/
│   │   │   ├── data_preprocessing.py  # ColumnTransformer & feature definitions
│   │   │   ├── train_model.py         # Multi-model benchmarking & artifact training
│   │   │   └── predict.py             # Inference engine & schema validation
│   │   ├── models/
│   │   │   └── prediction.py          # Domain data models
│   │   ├── schemas/
│   │   │   └── prediction.py          # Pydantic validation schemas & responses
│   │   ├── services/
│   │   │   └── prediction_service.py  # Business logic & MongoDB aggregations
│   │   └── routes/
│   │       ├── health.py              # Health check & model metadata endpoints
│   │       ├── predictions.py         # Prediction & history CRUD endpoints
│   │       └── dashboard.py           # Dashboard stats & chart data endpoints
│   ├── data/
│   │   ├── raw/
│   │   │   └── train.csv              # Kaggle Ames Housing raw dataset
│   │   └── processed/
│   │       └── data_summary.json      # Exploratory dataset summary
│   ├── models/
│   │   ├── house_price_pipeline.joblib# Serialized trained scikit-learn pipeline
│   │   └── model_metadata.json        # Evaluation metrics & model parameters
│   ├── scripts/
│   │   └── download_data.py           # Kaggle dataset downloader & verifier
│   └── tests/
│       ├── conftest.py                # Pytest fixtures & isolated test DB setup
│       ├── test_ml.py                 # ML preprocessing & inference tests
│       ├── test_database.py           # MongoDB CRUD & aggregation tests
│       └── test_api.py                # FastAPI endpoint integration tests
└── frontend/
    ├── package.json                   # Frontend dependencies
    ├── vite.config.js                 # Vite build & server configuration
    ├── index.html                     # HTML5 entry with Plus Jakarta font
    ├── .env                           # Frontend environment variables
    ├── .env.example                   # Frontend environment template
    └── src/
        ├── main.jsx                   # React root mount
        ├── App.jsx                    # Root app layout & health heartbeat
        ├── index.css                  # Modern dark-mode responsive design system
        ├── components/
        │   ├── Navbar.jsx             # Top navigation & API live status badge
        │   ├── StatCard.jsx           # Summary metric cards
        │   ├── PriceChart.jsx         # Recharts distribution & correlation charts
        │   ├── LoadingState.jsx       # Loading indicators
        │   └── ErrorMessage.jsx       # User-facing error alerts & retries
        ├── pages/
        │   ├── Dashboard.jsx          # Real estate analytics overview
        │   ├── Predict.jsx            # Interactive valuation form & presets
        │   └── History.jsx            # MongoDB valuation audit table & details modal
        └── services/
            └── api.js                 # Frontend API client
```

---

## ⚡ Prerequisites

1. **Python**: 3.11+
2. **Node.js**: v18+ or v20+ (includes npm)
3. **MongoDB**: MongoDB Server 7.x or 8.x installed and running locally on port 27017 (or MongoDB Atlas URI)

Verify your environment in PowerShell:
```powershell
python --version
node --version
npm --version
Get-Service -Name *mongo*
```

---

## 🚀 Quickstart & Setup (Windows PowerShell)

Open a PowerShell terminal in the project directory:

```powershell
cd C:\Users\Namitha\house-price-prediction
```

### 1. Backend Setup & Virtual Environment

```powershell
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt
```

### 2. Dataset Acquisition & Verification

Download and verify the genuine Kaggle Ames Housing dataset:
```powershell
python scripts\download_data.py
```
*Dataset source: [Kaggle Competition: House Prices - Advanced Regression Techniques](https://www.kaggle.com/competitions/house-prices-advanced-regression-techniques/data)*

### 3. Model Training & Pipeline Serialization

Train all candidate models, evaluate cross-validation performance, and persist the top pipeline:
```powershell
python app\ml\train_model.py
```
This writes:
- `backend/models/house_price_pipeline.joblib`
- `backend/models/model_metadata.json`
- `backend/data/processed/data_summary.json`

### 4. Run Backend Tests

Execute the comprehensive Pytest suite:
```powershell
$env:PYTHONPATH="."
pytest -v
```

### 5. Start the FastAPI Server

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 6. Frontend Setup & Launch

Open a **separate** PowerShell terminal in the `frontend` folder:

```powershell
cd C:\Users\Namitha\house-price-prediction\frontend

# Install dependencies (React, Recharts, Lucide, Vite)
npm install

# Test production build
npm run build

# Start Vite development server
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 📡 API Reference

### Health & Model
- `GET /api/health`: Health status and model availability.
- `GET /api/model/metrics`: Model evaluation metrics, training timestamp, and candidate comparison.

### Predictions & History
- `POST /api/predict`: Evaluate property parameters, save to MongoDB, and return predicted price.
- `GET /api/predictions?page=1&page_size=10`: Paginated list of past predictions (newest first).
- `GET /api/predictions/{id}`: Detailed view of a single historical valuation.
- `DELETE /api/predictions/{id}`: Delete an entry from MongoDB.

### Analytics & Charts
- `GET /api/dashboard/stats`: Aggregated summary statistics (total, average, min, max, top neighborhood).
- `GET /api/dashboard/chart-data`: Pre-aggregated data formatted for Recharts charts.

### Example Prediction Request

```powershell
$body = @{
    OverallQual = 8
    GrLivArea = 2100.0
    TotalBsmtSF = 1100.0
    "1stFlrSF" = 1100.0
    FullBath = 2
    HalfBath = 1
    BedroomAbvGr = 3
    TotRmsAbvGrd = 8
    Fireplaces = 1
    GarageCars = 2
    GarageArea = 600.0
    YearBuilt = 2012
    YearRemodAdd = 2015
    LotArea = 9800.0
    Neighborhood = "CollgCr"
    BldgType = "1Fam"
    HouseStyle = "2Story"
    CentralAir = "Y"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/predict" -Method Post -Body $body -ContentType "application/json"
```

---

## 🔒 Configuration & Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PROJECT_NAME` | `"House Price Prediction API"` | Title of the API |
| `MONGODB_URI` | `"mongodb://localhost:27017"` | MongoDB connection URI |
| `MONGODB_DB_NAME` | `"house_price_db"` | Target MongoDB database name |
| `API_V1_PREFIX` | `"/api"` | API URL prefix |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `"http://localhost:8000/api"` | Base URL of FastAPI server |

---

## 🧪 Testing Summary

- **Backend Pytest**: 16 unit and integration tests passing:
  - Dataset schema integrity and target column presence
  - Preprocessor transformations on numerical and categorical features
  - Pipeline inference correctness and price range bounds
  - Pydantic validation rules and error responses
  - MongoDB CRUD persistence, pagination, and deletion
  - Dashboard analytics calculations for both empty and populated states
- **Frontend Vite Build**: Production bundling verified cleanly (`dist/` generated with zero errors).

---

## ⚖️ Limitations & Responsible Use

1. **Geographic Scope**: The underlying Kaggle model is trained specifically on Ames, Iowa residential properties between 2006 and 2010. Price levels reflect that specific regional market.
2. **Valuation Estimates**: Predictions are statistical estimates generated by machine learning algorithms and do not constitute formal real estate appraisals.

