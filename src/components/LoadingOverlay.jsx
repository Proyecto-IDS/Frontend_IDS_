import React from 'react';
import PropTypes from 'prop-types';
import './LoadingOverlay.css';

const LoadingOverlay = ({ isVisible, title, description, icon = '🔄' }) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-overlay-backdrop">
        <div className="loading-overlay-content">
          <div className="loading-spinner">
            <span className="loading-icon">{icon}</span>
          </div>
          <h3 className="loading-title">{title}</h3>
          <p className="loading-description">{description}</p>
        </div>
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.node
};

export default LoadingOverlay;