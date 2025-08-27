import React from 'react';
import './Charts.css';

/**
 * Circular progress ring component
 * @param {Object} props - Component props
 * @param {number} props.percentage - Progress percentage (0-100)
 * @param {string} props.color - Ring color
 * @param {number} props.size - Ring size in pixels
 * @param {string} props.label - Center label
 * @param {string} props.sublabel - Center sublabel
 */
const ProgressRing = ({ 
  percentage = 0, 
  color = "#667eea", 
  size = 120, 
  label = "", 
  sublabel = "",
  strokeWidth = 8
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="progress-ring-circle"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      
      <div className="progress-ring-content">
        <div className="progress-ring-percentage">{Math.round(percentage)}%</div>
        {label && <div className="progress-ring-label">{label}</div>}
        {sublabel && <div className="progress-ring-sublabel">{sublabel}</div>}
      </div>
    </div>
  );
};

export default ProgressRing;
