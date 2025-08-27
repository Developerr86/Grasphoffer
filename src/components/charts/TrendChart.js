import React from 'react';
import './Charts.css';

/**
 * Simple trend line chart component
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data points with { date, score, topic }
 * @param {string} props.title - Chart title
 * @param {string} props.color - Line color
 */
const TrendChart = ({ data = [], title = "Performance Trend", color = "#667eea" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h4 className="chart-title">{title}</h4>
        <div className="chart-empty">
          <span>📈</span>
          <p>No data available yet</p>
        </div>
      </div>
    );
  }

  // Prepare data for visualization
  const maxScore = Math.max(...data.map(d => d.score), 100);
  const minScore = Math.min(...data.map(d => d.score), 0);
  const scoreRange = maxScore - minScore || 1;

  // Create SVG path
  const width = 300;
  const height = 120;
  const padding = 20;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + ((maxScore - point.score) / scoreRange) * chartHeight;
    return { x, y, ...point };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Calculate trend direction
  const firstScore = data[data.length - 1]?.score || 0;
  const lastScore = data[0]?.score || 0;
  const trendDirection = lastScore > firstScore ? 'up' : lastScore < firstScore ? 'down' : 'stable';
  const trendPercentage = firstScore > 0 ? Math.round(((lastScore - firstScore) / firstScore) * 100) : 0;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4 className="chart-title">{title}</h4>
        <div className={`trend-indicator trend-${trendDirection}`}>
          <span className="trend-icon">
            {trendDirection === 'up' ? '📈' : trendDirection === 'down' ? '📉' : '➡️'}
          </span>
          <span className="trend-text">
            {trendDirection === 'up' ? '+' : trendDirection === 'down' ? '' : ''}{trendPercentage}%
          </span>
        </div>
      </div>
      
      <div className="chart-content">
        <svg width={width} height={height} className="trend-svg">
          {/* Grid lines */}
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={color} stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          {/* Background grid */}
          {[0, 25, 50, 75, 100].map(score => {
            const y = padding + ((maxScore - score) / scoreRange) * chartHeight;
            return (
              <line
                key={score}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Area under curve */}
          <path
            d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`}
            fill={`url(#gradient-${color.replace('#', '')})`}
          />
          
          {/* Trend line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="2"
              className="chart-point"
            />
          ))}
        </svg>
        
        {/* Latest score display */}
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">Latest</span>
            <span className="stat-value">{lastScore}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average</span>
            <span className="stat-value">
              {Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length)}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Best</span>
            <span className="stat-value">{Math.max(...data.map(d => d.score))}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
