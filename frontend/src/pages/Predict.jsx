import React, { useState } from 'react';
import {
  Sparkles,
  Home,
  Sliders,
  MapPin,
  CheckCircle,
  RotateCcw,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

const NEIGHBORHOODS = [
  'CollgCr', 'Veenker', 'Crawfor', 'NoRidge', 'Mitchel', 'Somerst',
  'NWAmes', 'OldTown', 'BrkSide', 'Sawyer', 'NridgHt', 'NAmes',
  'SawyerW', 'IDOTRR', 'MeadowV', 'Edwards', 'Timber', 'Gilbert',
  'StoneBr', 'ClearCr', 'NPkVill', 'Blmngtn', 'BrDale', 'SWISU', 'Blueste'
];

const BLDG_TYPES = [
  { value: '1Fam', label: 'Single-family Detached (1Fam)' },
  { value: '2fmCon', label: 'Two-family Conversion (2fmCon)' },
  { value: 'Duplex', label: 'Duplex (Duplex)' },
  { value: 'TwnhsE', label: 'Townhouse End Unit (TwnhsE)' },
  { value: 'Twnhs', label: 'Townhouse Inside Unit (Twnhs)' }
];

const HOUSE_STYLES = [
  { value: '1Story', label: 'One story' },
  { value: '2Story', label: 'Two story' },
  { value: '1.5Fin', label: 'One and one-half story (Finished 2nd)' },
  { value: '1.5Unf', label: 'One and one-half story (Unfinished 2nd)' },
  { value: 'SFoyer', label: 'Split Foyer' },
  { value: 'SLvl', label: 'Split Level' },
  { value: '2.5Unf', label: 'Two and one-half story (Unfinished)' },
  { value: '2.5Fin', label: 'Two and one-half story (Finished)' }
];

const PRESETS = {
  suburban: {
    OverallQual: 7,
    GrLivArea: 1710,
    TotalBsmtSF: 856,
    '1stFlrSF': 856,
    FullBath: 2,
    HalfBath: 1,
    BedroomAbvGr: 3,
    TotRmsAbvGrd: 8,
    Fireplaces: 1,
    GarageCars: 2,
    GarageArea: 548,
    YearBuilt: 2003,
    YearRemodAdd: 2003,
    LotArea: 8450,
    Neighborhood: 'CollgCr',
    BldgType: '1Fam',
    HouseStyle: '2Story',
    CentralAir: 'Y',
  },
  luxury: {
    OverallQual: 9,
    GrLivArea: 2950,
    TotalBsmtSF: 1850,
    '1stFlrSF': 1650,
    FullBath: 3,
    HalfBath: 1,
    BedroomAbvGr: 4,
    TotRmsAbvGrd: 10,
    Fireplaces: 2,
    GarageCars: 3,
    GarageArea: 820,
    YearBuilt: 2018,
    YearRemodAdd: 2020,
    LotArea: 14200,
    Neighborhood: 'NridgHt',
    BldgType: '1Fam',
    HouseStyle: '2Story',
    CentralAir: 'Y',
  },
  starter: {
    OverallQual: 5,
    GrLivArea: 1100,
    TotalBsmtSF: 750,
    '1stFlrSF': 1100,
    FullBath: 1,
    HalfBath: 0,
    BedroomAbvGr: 2,
    TotRmsAbvGrd: 5,
    Fireplaces: 0,
    GarageCars: 1,
    GarageArea: 320,
    YearBuilt: 1970,
    YearRemodAdd: 1985,
    LotArea: 6500,
    Neighborhood: 'NAmes',
    BldgType: '1Fam',
    HouseStyle: '1Story',
    CentralAir: 'Y',
  }
};

export default function Predict({ setActiveTab }) {
  const [formData, setFormData] = useState(PRESETS.suburban);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const applyPreset = (presetKey) => {
    setFormData(PRESETS[presetKey]);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic client checks
    if (formData.YearRemodAdd < formData.YearBuilt) {
      setError(`Remodel year (${formData.YearRemodAdd}) cannot be earlier than construction year (${formData.YearBuilt}).`);
      setLoading(false);
      return;
    }

    try {
      const response = await api.predict(formData);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Valuation failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="predict-page">
      <div className="page-header">
        <h1 className="page-title">House Price Valuation Engine</h1>
        <p className="page-subtitle">
          Configure architectural and structural features to generate an instant ML-predicted valuation.
        </p>
      </div>

      {/* Preset Pills */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Quick Presets:</span>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
          onClick={() => applyPreset('suburban')}
        >
          🏡 Typical College Creek (Suburban)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
          onClick={() => applyPreset('luxury')}
        >
          🏰 Northridge Heights (Luxury)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
          onClick={() => applyPreset('starter')}
        >
          🏠 North Ames (Starter 1-Story)
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Valuation Result Hero Banner */}
      {result && (
        <div className="prediction-result-banner">
          <div className="result-tag">Predicted Market Valuation</div>
          <div className="result-price">
            ${Math.round(result.predicted_price).toLocaleString()}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Generated by {result.model_version ? `Pipeline v${result.model_version}` : 'Machine Learning Pipeline'} and persisted to MongoDB (ID: {result.id})
          </p>

          <div className="result-details-grid">
            <div className="result-detail-chip">
              <span className="detail-chip-label">Neighborhood</span>
              <span className="detail-chip-value">{formData.Neighborhood}</span>
            </div>
            <div className="result-detail-chip">
              <span className="detail-chip-label">Living Area</span>
              <span className="detail-chip-value">{formData.GrLivArea.toLocaleString()} sqft</span>
            </div>
            <div className="result-detail-chip">
              <span className="detail-chip-label">Quality Score</span>
              <span className="detail-chip-value">{formData.OverallQual} / 10</span>
            </div>
            <div className="result-detail-chip">
              <span className="detail-chip-label">Beds / Baths</span>
              <span className="detail-chip-value">{formData.BedroomAbvGr} bd / {formData.FullBath} ba</span>
            </div>
            <div className="result-detail-chip">
              <span className="detail-chip-label">Garage</span>
              <span className="detail-chip-value">{formData.GarageCars} cars</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab('history')}>
              View in History
            </button>
            <button className="btn btn-primary" onClick={() => setResult(null)}>
              Adjust & Recalculate
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Section 1: Dimensions & Land */}
          <div className="form-section">
            <div className="section-title">
              <Home size={18} color="#3b82f6" />
              <span>Living Space & Area</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Above Ground Living Area</span>
                <span className="form-hint">sq ft</span>
              </label>
              <input
                type="number"
                name="GrLivArea"
                value={formData.GrLivArea}
                onChange={handleChange}
                min="300"
                max="6000"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>First Floor Area</span>
                <span className="form-hint">sq ft</span>
              </label>
              <input
                type="number"
                name="1stFlrSF"
                value={formData['1stFlrSF']}
                onChange={handleChange}
                min="300"
                max="5000"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Total Basement Area</span>
                <span className="form-hint">sq ft</span>
              </label>
              <input
                type="number"
                name="TotalBsmtSF"
                value={formData.TotalBsmtSF}
                onChange={handleChange}
                min="0"
                max="5000"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Lot Area</span>
                <span className="form-hint">sq ft</span>
              </label>
              <input
                type="number"
                name="LotArea"
                value={formData.LotArea}
                onChange={handleChange}
                min="1000"
                max="100000"
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Section 2: Quality & Construction */}
          <div className="form-section">
            <div className="section-title">
              <Sliders size={18} color="#10b981" />
              <span>Quality & Construction</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Overall Material Quality</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  Rating: {formData.OverallQual} / 10
                </span>
              </label>
              <input
                type="range"
                name="OverallQual"
                value={formData.OverallQual}
                onChange={handleChange}
                min="1"
                max="10"
                className="form-range"
              />
              <div className="range-display">
                <span>1 (Poor)</span>
                <span>5 (Average)</span>
                <span>10 (Very Excellent)</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Year Built</span>
              </label>
              <input
                type="number"
                name="YearBuilt"
                value={formData.YearBuilt}
                onChange={handleChange}
                min="1870"
                max="2025"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Year Remodeled / Add</span>
              </label>
              <input
                type="number"
                name="YearRemodAdd"
                value={formData.YearRemodAdd}
                onChange={handleChange}
                min="1950"
                max="2025"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Central Air Conditioning</span>
              </label>
              <select
                name="CentralAir"
                value={formData.CentralAir}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Y">Yes (Central A/C Installed)</option>
                <option value="N">No (No Central A/C)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Rooms & Parking */}
          <div className="form-section">
            <div className="section-title">
              <Home size={18} color="#f59e0b" />
              <span>Rooms & Parking</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Bedrooms</label>
                <input
                  type="number"
                  name="BedroomAbvGr"
                  value={formData.BedroomAbvGr}
                  onChange={handleChange}
                  min="0"
                  max="8"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Rooms</label>
                <input
                  type="number"
                  name="TotRmsAbvGrd"
                  value={formData.TotRmsAbvGrd}
                  onChange={handleChange}
                  min="2"
                  max="15"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Full Baths</label>
                <input
                  type="number"
                  name="FullBath"
                  value={formData.FullBath}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Half Baths</label>
                <input
                  type="number"
                  name="HalfBath"
                  value={formData.HalfBath}
                  onChange={handleChange}
                  min="0"
                  max="3"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Garage Cars</label>
                <input
                  type="number"
                  name="GarageCars"
                  value={formData.GarageCars}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Garage SqFt</label>
                <input
                  type="number"
                  name="GarageArea"
                  value={formData.GarageArea}
                  onChange={handleChange}
                  min="0"
                  max="1500"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fireplaces</label>
              <input
                type="number"
                name="Fireplaces"
                value={formData.Fireplaces}
                onChange={handleChange}
                min="0"
                max="4"
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Section 4: Location & Architecture */}
          <div className="form-section">
            <div className="section-title">
              <MapPin size={18} color="#8b5cf6" />
              <span>Location & Type</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Neighborhood</span>
              </label>
              <select
                name="Neighborhood"
                value={formData.Neighborhood}
                onChange={handleChange}
                className="form-select"
              >
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Building Type</span>
              </label>
              <select
                name="BldgType"
                value={formData.BldgType}
                onChange={handleChange}
                className="form-select"
              >
                {BLDG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>House Style</span>
              </label>
              <select
                name="HouseStyle"
                value={formData.HouseStyle}
                onChange={handleChange}
                className="form-select"
              >
                {HOUSE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0 }}></div>
                    <span>Evaluating with ML Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate Price Valuation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

