import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Navbar.css';
import {Button} from "@/components/ui/button"
import {useGoogleLogin} from "@/hooks/useGoogleLogin"
import { useAuthStore } from "@/store/useAuthStore";
import Icon from "@/components/atoms/Icon";
import { Button as CustomButton } from "@/components/atoms/Button";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [landingActiveIndex, setLandingActiveIndex] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isLandingPage = location.pathname === '/';
  const isFirstSection = isLandingPage && landingActiveIndex === 0;
  const handleGoogleLogin = useGoogleLogin();
  
  // 로그인 상태 관리
  const { accessToken, clearAuth } = useAuthStore();
  const isLoggedIn = !!accessToken;

  // Landing 페이지의 섹션 변경을 감지
  useEffect(() => {
    const handleLandingSectionChange = (event) => {
      setLandingActiveIndex(event.detail.activeIndex);
    };

    // 초기값 설정
    const savedIndex = localStorage.getItem('landingActiveIndex');
    if (savedIndex !== null) {
      setLandingActiveIndex(parseInt(savedIndex));
    }

    // 이벤트 리스너 등록
    window.addEventListener('landingSectionChange', handleLandingSectionChange);

    return () => {
      window.removeEventListener('landingSectionChange', handleLandingSectionChange);
    };
  }, []);

  // 로그아웃 처리
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    clearAuth();
    // localStorage에서도 토큰 정보 제거
    localStorage.removeItem('landingActiveIndex');
    console.log('로그아웃 완료');
    // 랜딩 페이지로 이동
    navigate('/');
    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };
  
  return (
    <div className={`Header ${isFirstSection ? 'landing-page' : ''}`}>
      <div className="left">
        <Link to="/">
          <div className={`home ${isFirstSection ? 'landing-text' : ''}`}>OnBoard</div>
        </Link>
      </div>
      <div className="center" />
      <div className="right">
        <Link to="/test">
          <Button className={`temp ${isFirstSection ? 'landing-text' : ''}`} variant="link">TEST</Button>          
        </Link>
        <Button 
          className={`temp ${isFirstSection ? 'landing-text' : ''}`} 
          variant="link"
          onClick={() => {
            if (isLoggedIn) {
              navigate('/list');
            } else {
              // 랜딩 페이지에서 로그인 모달을 띄우기 위해 이벤트 발생
              window.dispatchEvent(new CustomEvent('showLoginModal', {
                detail: { redirectTo: '/list' }
              }));
            }
          }}
        >
          Plan
        </Button>
        <Button 
          className={`temp ${isFirstSection ? 'landing-text' : ''}`} 
          variant="link"
          onClick={() => {
            if (isLoggedIn) {
              navigate('/mypage');
            } else {
              // 랜딩 페이지에서 로그인 모달을 띄우기 위해 이벤트 발생
              window.dispatchEvent(new CustomEvent('showLoginModal', {
                detail: { redirectTo: '/mypage' }
              }));
            }
          }}
        >
          Mypage
        </Button>
        {isLoggedIn ? (
          <Button 
            className={`temp ${isFirstSection ? 'landing-text' : ''}`} 
            variant="link" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        ) : (
          <Button 
            className={`temp ${isFirstSection ? 'landing-text' : ''}`} 
            variant="link" 
            onClick={handleGoogleLogin}
          >
            Login
          </Button>
        )}
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <div className="logout-modal__backdrop">
          <div className="logout-modal">
            <div className="logout-modal__header">
              <div className="logout-modal__icon">
                <Icon type="sign-out" />
              </div>
              {/* <h2 className="logout-modal__title">정말 로그아웃하시겠습니까?</h2> */}
            </div>
            
            <div className="logout-modal__content">
              <p className="logout-modal__message">
                정말 로그아웃하시겠습니까?
              </p>
            </div>

            <div className="logout-modal__footer">
              <CustomButton 
                background="white"
                textColor="black"
                border="gray"
                onClick={handleLogoutCancel}
              >
                취소
              </CustomButton>
              <CustomButton 
                background="red"
                textColor="white"
                onClick={handleLogoutConfirm}
              >
                로그아웃
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
