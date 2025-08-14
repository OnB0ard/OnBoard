import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '../../hooks/useGoogleLogin';
import Icon from '../atoms/Icon';
import { Button } from '../atoms/Button';
import './AccessControlModal.css';

const AccessControlModal = ({ 
  isOpen, 
  type, // 'login' | 'permission' | 'pending'
  message,
  onRequestPermission,
  onClose,
  planId
}) => {
  const navigate = useNavigate();
  const handleGoogleLogin = useGoogleLogin();

  if (!isOpen) return null;

  const handleLogin = () => {
    handleGoogleLogin();  
    onClose(); // 모달 닫기
  };

  const handleCancel = () => {
    if (type === 'login') {
      navigate('/'); // 랜딩페이지로 이동
    } else {
      navigate('/list'); // 플랜 리스트 페이지로 이동
    }
    onClose();
  };

  const handleRequestPermission = () => {
    if (onRequestPermission) {
      onRequestPermission();
    }
  };

  // 권한 요청 후 대기 중 모달
  if (type === 'pending') {
    return (
      <div className="access-control-modal__backdrop">
        <div className="access-control-modal">
          <div className="access-control-modal__header">
            <div className="access-control-modal__icon">
              <Icon type="magnifying-glass" />
            </div>
            <h2 className="access-control-modal__title">승인 대기 중</h2>
          </div>
          
          <div className="access-control-modal__content">
            <p className="access-control-modal__message">
              {message || '권한 요청중.. 방장의 승인을 기다리고 있습니다.'}
            </p>
          </div>

          <div className="access-control-modal__footer">
            <Button 
              background="white"
              textColor="black"
              border="gray"
              onClick={handleCancel}
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'login') {
    return (
      <div className="access-control-modal__backdrop">
        <div className="access-control-modal">
          <div className="access-control-modal__header">
            <div className="access-control-modal__icon">
              <Icon type="magnifying-glass" />
            </div>
            <h2 className="access-control-modal__title">로그인이 필요합니다</h2>
          </div>
          
          <div className="access-control-modal__content">
            <p className="access-control-modal__message">
              로그인 후 더 많은 기능을 이용할 수 있습니다.
            </p>
          </div>

                     <div className="access-control-modal__footer">
             <Button 
               background="white"
               textColor="black"
               border="gray"
               onClick={handleCancel}
             >
               취소
             </Button>
             <Button 
               background="sky"
               textColor="black"
               onClick={handleLogin}
             >
               로그인하기
             </Button>
           </div>
        </div>
      </div>
    );
  }

    if (type === 'permission') {
    return (
      <div className="access-control-modal__backdrop">
        <div className="access-control-modal">
          <div className="access-control-modal__header">
            <div className="access-control-modal__icon">
              <Icon type="magnifying-glass" />
            </div>
            <h2 className="access-control-modal__title">접근 권한이 필요합니다</h2>
          </div>
          
          <div className="access-control-modal__content">
            <p className="access-control-modal__message">
              {message || '호스트에게 접근 권한을 요청해야 합니다.'}
            </p>
          </div>

          <div className="access-control-modal__footer">
            <Button 
              background="white"
              textColor="black"
              border="gray"
              onClick={handleCancel}
            >
              확인
            </Button>
            {onRequestPermission && (
              <Button 
                background="sky"
                textColor="black"
                onClick={handleRequestPermission}
              >
                권한 요청하기
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AccessControlModal; 