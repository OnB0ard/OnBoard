// 아직 디자인 안함

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingOverlay = ({ isVisible, message = "로딩 중..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl">
        <LoadingSpinner size="large" color="primary" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay; 