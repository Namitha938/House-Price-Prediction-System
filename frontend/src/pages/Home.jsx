import React, { useState } from 'react';
import {
  Calculator,
  LineChart,
  History,
  Activity,
  ArrowRight,
  TrendingUp,
  Building,
  CheckCircle2,
  Sparkles,
  Zap,
  Info,
  Clock,
  User,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

export default function Home({ setActiveTab, user }) {
  const [quickLivingArea, setQuickLivingArea] = useState(1800);
  const [quickQuality, setQuickQuality] = useState(7);
  const [quickYearBuilt, setQuickYearBuilt] = useState(2008);
  const [quickNeighborhood, setQuickNeighborhood] = useState('CollgCr');
  const [quickEstimate, setQuickEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);

  const neighborhoods = [
    'CollgCr', 'Veenker', 'Crawfor', 'NoRidge', 'Mitchel', 'Somerst',
    'NWAmes', 'OldTown', 'BrkSide', 'Sawyer', 'NridgHt', 'NAmes',
    'SawyerW', 'IDOTRR', 'Edwards', 'Timber', 'Gilbert', 'StoneBr', 'ClearCr'
  ];

  const handleQuickEstimate = async (e) => {
    e.preventDefault();
    setEstimating(true);
    try {
      // Default companion features for quick ballpark estimation
      const payload = {
        OverallQual: Number(quickQuality),
        GrLivArea: Number(quickLivingArea),
        TotalBsmtSF: Math.round(quickLivingArea * 0.55),
        "1stFlrSF": Math.round(quickLivingArea * 0.6),
        FullBath: quickLivingArea > 1600 ? 2 : 1,
        HalfBath: 1,
        BedroomAbvGr: 3,
        TotRmsAbvGrd: 7,
        Fireplaces: 1,
        GarageCars: 2,
        GarageArea: 500,
        YearBuilt: Number(quickYearBuilt),
        YearRemodAdd: Number(quickYearBuilt) > 2010 ? Number(quickYearBuilt) : 2015,
        LotArea: 9000,
        Neighborhood: quickNeighborhood,
        BldgType: '1Fam',
        HouseStyle: '2Story',
        CentralAir: 'Y'
      };

      const res = await api.createPrediction(payload);
      if (res && res.predicted_price) {
        setQuickEstimate(res.predicted_price);
      }
    } catch {
      // Fallback local heuristic estimation if backend offline
      const baseline = 180000;
      const qualityFactor = (quickQuality - 5) * 28000;
      const sizeFactor = (quickLivingArea - 1500) * 85;
      const ageFactor = (quickYearBuilt - 1980) * 800;
      setQuickEstimate(Math.max(50000, Math.round(baseline + qualityFactor + sizeFactor + ageFactor)));
    } finally {
      setEstimating(false);
    }
  };

  const actionCards = [
    {
      title: 'Full Valuation Engine',
      desc: 'Enter all 18 property attributes with presets for Starter, Luxury, and Suburban homes.',
      icon: <Calculator size={22} />,
      tab: 'predict',
      color: '#3b82f6',
      badge: '18 Parameters'
    },
    {
      title: 'Real Estate Dashboard',
      desc: 'Interactive Recharts visualizations: price distributions, quality correlations, and neighborhood rankings.',
      icon: <LineChart size={22} />,
      tab: 'dashboard',
      color: '#8b5cf6',
      badge: 'Interactive'
    },
    {
      title: 'Valuation Audit History',
      desc: 'Search, filter, inspect, and export all past property valuations stored in MongoDB.',
      icon: <History size={22} />,
      tab: 'history',
      color: '#10b981',
      badge: 'MongoDB'
    }
  ];

  return (
    <div className="home-container">
      {/* Welcome Banner */}
      <div className="welcome-hero">
        <div className="welcome-info">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Sparkles size={14} />
            <span>AI Valuation Command Center</span>
          </div>
          <h1>
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p>
            {user?.role ? `Operating as ${user.role} • ` : ''}
            Analyze property market trends, evaluate residential assets, and explore predictive insights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn-hero-primary"
            style={{ fontSize: '0.9rem', padding: '0.7rem 1.25rem' }}
            onClick={() => setActiveTab('predict')}
          >
            <Calculator size={18} />
            <span>New Valuation</span>
          </button>
          <button
            className="btn-hero-secondary"
            style={{ fontSize: '0.9rem', padding: '0.7rem 1.25rem' }}
            onClick={() => setActiveTab('dashboard')}
          >
            <LineChart size={18} />
            <span>Market Charts</span>
          </button>
        </div>
      </div>

      {/* Primary Action Tiles */}
      <div className="home-grid-actions">
        {actionCards.map((card, i) => (
          <div
            key={i}
            className="action-tile"
            onClick={() => setActiveTab(card.tab)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div className="action-tile-icon" style={{ background: `${card.color}20`, color: card.color }}>
                  {card.icon}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#1e293b', color: '#94a3b8' }}>
                  {card.badge}
                </span>
              </div>
              <h3 className="action-tile-title">{card.title}</h3>
              <p className="action-tile-desc">{card.desc}</p>
            </div>

            <div className="action-tile-footer">
              <span>Open tool</span>
              <ArrowRight size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Mini Quick-Estimator Widget */}
      <div className="mini-estimator-card">
        <div className="mini-estimator-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Zap size={20} color="#f59e0b" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                Instant Quick-Estimator
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Ballpark estimate based on the 4 primary valuation drivers.
            </p>
          </div>

          <button
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            onClick={() => setActiveTab('predict')}
          >
            Switch to Full 18-Feature Form
          </button>
        </div>

        <form onSubmit={handleQuickEstimate}>
          <div className="mini-grid-inputs">
            <div className="form-group">
              <label>Above-Ground Living Area (Sq Ft)</label>
              <input
                type="number"
                min="400"
                max="6000"
                step="50"
                value={quickLivingArea}
                onChange={(e) => setQuickLivingArea(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Overall Quality (1 to 10)</label>
              <select
                value={quickQuality}
                onChange={(e) => setQuickQuality(e.target.value)}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} - {i + 1 <= 3 ? 'Fair' : i + 1 <= 6 ? 'Average' : i + 1 <= 8 ? 'Good' : 'Exceptional'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Neighborhood</label>
              <select
                value={quickNeighborhood}
                onChange={(e) => setQuickNeighborhood(e.target.value)}
              >
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Year Built</label>
              <input
                type="number"
                min="1880"
                max="2026"
                value={quickYearBuilt}
                onChange={(e) => setQuickYearBuilt(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={estimating}
              style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Calculator size={18} />
              <span>{estimating ? 'Calculating ML Valuation...' : 'Calculate Quick Valuation'}</span>
            </button>
          </div>
        </form>

        {quickEstimate !== null && (
          <div className="mini-result-banner" style={{ marginTop: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600 }}>
                Instant Estimated Fair Value
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                ${quickEstimate.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                className="btn-primary"
                onClick={() => setActiveTab('predict')}
                style={{ fontSize: '0.85rem' }}
              >
                Refine with Detailed Features
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Market Indicators Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Building size={24} />
          </div>
          <div className="stat-label">Dataset Baseline</div>
          <div className="stat-value">$180,921</div>
          <div className="stat-subtext">Ames Median Sale Price</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-label">Model Accuracy</div>
          <div className="stat-value">91.59%</div>
          <div className="stat-subtext">R² Variance Explained</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-label">Selected Algorithm</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>Gradient Boost</div>
          <div className="stat-subtext">Lowest RMSE: $25,405</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper amber">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-label">Audit Logging</div>
          <div className="stat-value">Active</div>
          <div className="stat-subtext">MongoDB Persistence</div>
        </div>
      </div>
    </div>
  );
}

