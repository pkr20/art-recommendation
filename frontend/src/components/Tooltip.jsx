import React from 'react';
import './App.css';

export default function Tooltip({ children, text }) {
  return (
    <span className="tooltip-container">
      {children}
      <span className="tooltip-text">{text}</span>
    </span>
  );
} 