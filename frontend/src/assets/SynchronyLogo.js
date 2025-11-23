import React from 'react';

const SynchronyLogo = ({ className, width = "180", height = "40" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Synchrony wordmark */}
      <text
        x="10"
        y="28"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="white"
        letterSpacing="0.5"
      >
        SYNCHRONY
      </text>
      {/* Accent line */}
      <rect x="10" y="32" width="160" height="3" fill="#FFC500" />
    </svg>
  );
};

export default SynchronyLogo;
