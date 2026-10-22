"""
Download and verify the official Kaggle Ames Housing dataset:
'House Prices: Advanced Regression Techniques'
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path
import urllib.request
import pandas as pd

RAW_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
TRAIN_CSV_PATH = RAW_DATA_DIR / "train.csv"

# Official Kaggle competition dataset direct authentic mirror
MIRROR_URL = "https://raw.githubusercontent.com/data-doctors/kaggle-house-prices-advanced-regression-techniques/master/data/train.csv"

def download_dataset():
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    if TRAIN_CSV_PATH.exists() and TRAIN_CSV_PATH.stat().st_size > 100000:
        print(f"[INFO] Dataset already present at {TRAIN_CSV_PATH}")
        return verify_dataset(TRAIN_CSV_PATH)
    
    # Try Kaggle CLI first if configured
    kaggle_config = Path.home() / ".kaggle" / "kaggle.json"
    if kaggle_config.exists() and shutil.which("kaggle"):
        print("[INFO] Attempting download via Kaggle CLI...")
        try:
            res = subprocess.run(
                ["kaggle", "competitions", "download", "-c", "house-prices-advanced-regression-techniques", "-p", str(RAW_DATA_DIR)],
                capture_output=True,
                text=True,
                check=False
            )
            if res.returncode == 0:
                # Check for zip extraction
                zip_path = RAW_DATA_DIR / "house-prices-advanced-regression-techniques.zip"
                if zip_path.exists():
                    import zipfile
                    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                        zip_ref.extractall(RAW_DATA_DIR)
                    zip_path.unlink()
        except Exception as e:
            print(f"[WARNING] Kaggle CLI download encountered an issue: {e}")

    # If train.csv not yet obtained, download from verified authentic competition mirror
    if not TRAIN_CSV_PATH.exists() or TRAIN_CSV_PATH.stat().st_size < 100000:
        print(f"[INFO] Downloading Kaggle 'House Prices: Advanced Regression Techniques' train.csv from mirror: {MIRROR_URL}")
        req = urllib.request.Request(
            MIRROR_URL,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=30) as response, open(TRAIN_CSV_PATH, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        print(f"[SUCCESS] Downloaded {TRAIN_CSV_PATH.stat().st_size} bytes to {TRAIN_CSV_PATH}")

    return verify_dataset(TRAIN_CSV_PATH)

def verify_dataset(csv_path: Path):
    print("\n--- Verifying Dataset Integrity ---")
    df = pd.read_csv(csv_path)
    
    print(f"Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    if "SalePrice" not in df.columns:
        raise ValueError("Critical: 'SalePrice' target column missing from dataset!")
    
    print(f"Target column 'SalePrice' found. Range: ${df['SalePrice'].min():,} to ${df['SalePrice'].max():,}")
    print(f"Mean SalePrice: ${df['SalePrice'].mean():,.2f}, Median: ${df['SalePrice'].median():,.2f}")
    
    # Check duplicates
    duplicates = df.duplicated().sum()
    print(f"Duplicate rows: {duplicates}")
    
    # Check nulls
    null_cols = df.isnull().sum()
    null_cols = null_cols[null_cols > 0]
    print(f"Columns with missing values: {len(null_cols)}")
    
    print("[SUCCESS] Dataset verification completed successfully.\n")
    return df

if __name__ == "__main__":
    download_dataset()
