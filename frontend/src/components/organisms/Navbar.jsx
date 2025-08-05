import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Navbar.css';
import {Button} from "@/components/ui/button"
import {useGoogleLogin} from "@/hooks/useGoogleLogin"
import { useAuthStore } from "@/store/useAuthStore";

const Navbar = () => {
  const location = useLocation();
  const [landingActiveIndex, setLandingActiveIndex] = useState(0);
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
    clearAuth();
    // localStorage에서도 토큰 정보 제거
    localStorage.removeItem('landingActiveIndex');
    console.log('로그아웃 완료');
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
        <Link to="/list">
          <Button className={`temp ${isFirstSection ? 'landing-text' : ''}`} variant="link">Plan</Button>
        </Link>
        <Link to="/mypage">
          <Button className={`temp ${isFirstSection ? 'landing-text' : ''}`} variant="link">Mypage</Button>
        </Link>
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
    </div>
  );
};

export default Navbar;
