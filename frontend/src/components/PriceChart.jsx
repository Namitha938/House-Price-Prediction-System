import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

function getChartTheme(theme) {
  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');
  return {
    isLight,
    gridStroke: isLight ? '#e2e8f0' : '#24344d',
    tickColor: isLight ? '#64748b' : '#94a3b8',
    tooltipStyle: {
      backgroundColor: isLight ? '#ffffff' : '#162032',
      borderColor: isLight ? '#e2e8f0' : '#24344d',
      borderRadius: '8px',
      color: isLight ? '#0f172a' : '#ffffff',
      boxShadow: isLight ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    }
  };
}

export function DistributionChart({ data, theme }) {
  if (!data || data.length === 0) {
    return (
      <div className="state-container" style={{ padding: '2rem 1rem' }}>
        <p className="state-title" style={{ fontSize: '1rem' }}>No prediction distribution yet</p>
        <span style={{ fontSize: '0.85rem' }}>Make predictions to see historical price brackets.</span>
      </div>
    );
  }

  const { gridStroke, tickColor, tooltipStyle } = getChartTheme(theme);
  const formatTooltip = (value) => [`${value} Properties`, 'Frequency'];

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="range"
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QualityPriceChart({ data, theme }) {
  if (!data || data.length === 0) {
    return (
      <div className="state-container" style={{ padding: '2rem 1rem' }}>
        <p className="state-title" style={{ fontSize: '1rem' }}>No quality correlation yet</p>
        <span style={{ fontSize: '0.85rem' }}>Generate valuations across varying quality tiers.</span>
      </div>
    );
  }

  const { gridStroke, tickColor, tooltipStyle } = getChartTheme(theme);
  const formatCurrency = (val) => `$${Number(val).toLocaleString()}`;

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="quality"
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
            tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(value), 'Avg Valuation']}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="avgPrice" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NeighborhoodChart({ data, theme }) {
  if (!data || data.length === 0) {
    return (
      <div className="state-container" style={{ padding: '2rem 1rem' }}>
        <p className="state-title" style={{ fontSize: '1rem' }}>No neighborhood data yet</p>
      </div>
    );
  }

  const { gridStroke, tickColor, tooltipStyle } = getChartTheme(theme);
  const formatCurrency = (val) => `$${Number(val).toLocaleString()}`;

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
          <XAxis
            type="number"
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
            tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
          />
          <YAxis
            type="category"
            dataKey="neighborhood"
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(value), 'Avg Valuation']}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="avgPrice" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeatureImportanceChart({ data, theme }) {
  const defaultFeatures = [
    { feature: 'Overall Material Quality', importance: 34, description: 'Overall finish & structural grade (1-10)' },
    { feature: 'Above-Ground Living Area', importance: 26, description: 'Square footage of living area' },
    { feature: 'Total Basement SF', importance: 14, description: 'Usable basement square footage' },
    { feature: 'Garage Size & Capacity', importance: 12, description: 'Car spaces and total garage area' },
    { feature: 'Construction & Remodel Year', importance: 8, description: 'Effective building age' },
    { feature: 'Neighborhood Location', importance: 6, description: 'Ames district valuation factor' }
  ];

  const chartData = data && data.length > 0 ? data : defaultFeatures;
  const { gridStroke, tickColor, tooltipStyle } = getChartTheme(theme);

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
          <XAxis
            type="number"
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="feature"
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 11 }}
            tickLine={false}
            width={130}
          />
          <Tooltip
            formatter={(value) => [`${value}% Predictive Weight`, 'Importance']}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="importance" fill="#3b82f6" radius={[0, 6, 6, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-imp-${index}`}
                fill={['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][index % 6]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
