import React from 'react';
import './Loader.css';

export default function Loader() {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <div className="loader-text">Finding the best art for you...</div>
    </div>
  );
} 