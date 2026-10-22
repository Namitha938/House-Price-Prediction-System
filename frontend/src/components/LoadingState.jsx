import React from 'react';

export default function LoadingState({ message = 'Loading valuation data...' }) {
  return (
    <div className="state-container">
      <div className="spinner"></div>
      <p className="state-title">{message}</p>
    </div>
  );
}

