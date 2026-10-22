import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="alert alert-error">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertCircle size={20} />
        <span>{message || 'An error occurred.'}</span>
      </div>
      {onRetry && (
        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={onRetry}>
          <RotateCcw size={14} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}

