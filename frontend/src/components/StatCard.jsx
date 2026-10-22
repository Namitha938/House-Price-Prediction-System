import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, iconColor = '#3b82f6' }) {
  return (
    <div className="card stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon" style={{ color: iconColor, backgroundColor: `${iconColor}1a` }}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}

