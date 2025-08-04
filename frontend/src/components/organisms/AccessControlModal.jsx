import React from 'react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '../../hooks/useGoogleLogin';

const AccessControlModal = ({ 
  isOpen, 
  type, // 'login' | 'permission'
  onRequestPermission,
  onClose 
}) => {
  const navigate = useNavigate();
  const handleGoogleLogin = useGoogleLogin();

  if (!isOpen) return null;

  const handleLogin = () => {
    handleGoogleLogin();
    onClose(); // 모달 닫기
  };

  const handleRequestPermission = () => {
    if (onRequestPermission) {
      onRequestPermission();
    }
  };

  if (type === 'login') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              로그인이 필요합니다
            </h2>
            <Button 
              onClick={handleLogin}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
            >
              로그인하러 가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'permission') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              접근 권한이 없습니다.
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              호스트에게 접근 권한을 요청해야 합니다.
            </p>
            <Button 
              onClick={handleRequestPermission}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
            >
              권한 요청하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AccessControlModal; 