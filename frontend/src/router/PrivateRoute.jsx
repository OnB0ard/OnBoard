import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGoogleLogin } from '@/hooks/useGoogleLogin';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import './PrivateRoute.css';

const PrivateRoute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const login = useGoogleLogin();
  const navigate = useNavigate();
  const isLoginTriggered = useRef(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // StrictMode에서의 이중 호출을 방지하기 위해 ref를 사용합니다.
    // accessToken이 없고, 아직 로그인 함수를 호출하지 않았다면 실행합니다.
    if (!accessToken && !isLoginTriggered.current) {
      isLoginTriggered.current = true; // 로그인 함수를 호출했음을 표시
      setShowLoginModal(true);
    }
  }, [accessToken]);

  const handleLoginConfirm = () => {
    setShowLoginModal(false);
    login();
  };

  const handleLoginCancel = () => {
    setShowLoginModal(false);
    navigate('/'); // 랜딩 페이지로 이동
  };

  // accessToken이 있으면 자식 라우트를 렌더링하고,
  // 없으면 로그인 절차가 진행되는 동안 로딩 화면을 보여줍니다.
  return (
    <>
      {accessToken ? <Outlet /> : null}
      {showLoginModal && (
        <div className="login-alert-modal__backdrop">
          <div className="login-alert-modal">
            <div className="login-alert-modal__header">
              <div className="login-alert-modal__icon">
                <Icon type="magnifying-glass" />
              </div>
              <h2 className="login-alert-modal__title">로그인이 필요합니다</h2>
            </div>
            
            <div className="login-alert-modal__content">
              <p className="login-alert-modal__message">
                로그인 후 더 많은 기능을 이용할 수 있습니다.
              </p>
            </div>

            <div className="login-alert-modal__footer">
              <Button 
                background="white"
                textColor="black"
                border="gray"
                onClick={handleLoginCancel}
              >
                취소
              </Button>
              <Button 
                background="sky"
                textColor="black"
                onClick={handleLoginConfirm}
              >
                로그인하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrivateRoute;
