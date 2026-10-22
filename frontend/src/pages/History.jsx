import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import api from '../services/api';

export default function History({ setActiveTab }) {
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPredictions(targetPage, pageSize);
      setPredictions(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch predictions history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page, pageSize]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prediction record from MongoDB?')) {
      return;
    }
    setDeletingId(id);
    try {
      await api.deletePrediction(id);
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord(null);
      }
      fetchHistory(page);
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (val) =>
    `$${Math.round(val || 0).toLocaleString()}`;

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="history-page">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Valuation Audit & Prediction History</h1>
          <p className="page-subtitle">
            Historical records persisted to MongoDB. Review past valuations or delete obsolete records.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchHistory(page)} disabled={loading}>
          <RotateCcw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => fetchHistory(page)} />}

      {loading && <LoadingState message="Fetching valuation records from MongoDB..." />}

      {!loading && predictions.length === 0 && (
        <div className="card">
          <div className="state-container">
            <Database size={40} className="state-icon" />
            <h3 className="state-title">No Prediction Records Found</h3>
            <p style={{ maxWidth: '450px', marginBottom: '1.25rem' }}>
              No valuations have been saved to the MongoDB collection yet. Use the prediction form to calculate your first house price.
            </p>
            <button className="btn btn-primary" onClick={() => setActiveTab('predict')}>
              Start Prediction
            </button>
          </div>
        </div>
      )}

      {!loading && predictions.length > 0 && (
        <div className="card" style={{ padding: '1rem' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Valuation</th>
                  <th>Quality</th>
                  <th>Living Area</th>
                  <th>Bed / Bath</th>
                  <th>Year Built</th>
                  <th>Neighborhood</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {formatDate(p.created_at)}
                    </td>
                    <td className="price-cell">
                      {formatCurrency(p.predicted_price)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.overall_qual}</span> / 10
                    </td>
                    <td>{p.gr_liv_area?.toLocaleString()} sqft</td>
                    <td>
                      {p.bedroom_abv_gr} bd / {p.full_bath} ba
                    </td>
                    <td>{p.year_built}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: '#1f293d',
                        fontSize: '0.8rem'
                      }}>
                        {p.neighborhood}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          title="View Details"
                          onClick={() => setSelectedRecord(p)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          title="Delete Record"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing {predictions.length} of {total} records (Page {page} of {totalPages})
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem' }}
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                {page} / {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem' }}
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #24344d', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Valuation Details</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Record ID: {selectedRecord.id}</span>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setSelectedRecord(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#0d1526', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#3b82f6', fontWeight: 700 }}>
                Estimated Price
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff' }}>
                {formatCurrency(selectedRecord.predicted_price)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Pipeline v{selectedRecord.model_version} • Evaluated on {formatDate(selectedRecord.created_at)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ background: '#1c2942', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Neighborhood</span>
                <strong>{selectedRecord.neighborhood}</strong>
              </div>
              <div style={{ background: '#1c2942', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Living Area</span>
                <strong>{selectedRecord.gr_liv_area?.toLocaleString()} sqft</strong>
              </div>
              <div style={{ background: '#1c2942', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Quality Score</span>
                <strong>{selectedRecord.overall_qual} / 10</strong>
              </div>
              <div style={{ background: '#1c2942', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Basement SF</span>
                <strong>{selectedRecord.total_bsmt_sf?.toLocaleString()} sqft</strong>
              </div>
              <div style={{ background: '#1c2942', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Bedrooms / Baths</span>
                <strong>{selectedRecord.bedroom_abv_gr} bd / {selectedRecord.full_bath} ba</strong>
              </div>
              <div style={{ background: '#1c2942', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Garage</span>
                <strong>{selectedRecord.garage_cars} cars</strong>
              </div>
              <div style={{ background: '#1c2942', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Dwelling Type</span>
                <strong>{selectedRecord.bldg_type}</strong>
              </div>
              <div style={{ background: '#1c2942', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>House Style</span>
                <strong>{selectedRecord.house_style}</strong>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

