import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Navbar.css';
import {Button} from "@/components/ui/button"
import {useGoogleLogin} from "@/hooks/useGoogleLogin"
import { useAuthStore } from "@/store/useAuthStore";
import Icon from "@/components/atoms/Icon";
import { Button as CustomButton } from "@/components/atoms/Button";
import { AlarmBell } from "../atoms/AlarmBell";
import * as Popover from "@radix-ui/react-popover";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [landingActiveIndex, setLandingActiveIndex] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isLandingPage = location.pathname === '/';
  const isFirstSection = isLandingPage && landingActiveIndex === 0;
  const handleGoogleLogin = useGoogleLogin();
  
  const [open, setOpen] = useState(false);

  // 로그인 상태 관리
  const { accessToken, clearAuth } = useAuthStore();
  const isLoggedIn = !!accessToken;

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10); // 10px 이상 스크롤하면 배경 변경
    };

    window.addEventListener('scroll', handleScroll);
    
    // 초기 스크롤 위치 확인
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    // 토스트 표시
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { message: '로그아웃 되었습니다!', type: 'success', duration: 2000 },
      })
    );
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // 네비게이션 바 클래스 결정
  const getNavbarClass = () => {
    if (isLandingPage && isFirstSection && !isScrolled) {
      return 'Header landing-page';
    } else if (isScrolled) {
      return 'Header scrolled';
    } else {
      return 'Header';
    }
  };

  // 텍스트 클래스 결정
  const getTextClass = () => {
    if (isLandingPage && isFirstSection && !isScrolled) {
      return 'landing-text';
    } else if (isScrolled) {
      return 'scrolled-text';
    } else {
      return '';
    }
  };
  
  return (
    <div className={getNavbarClass()}>
      <div className="left">
        <Link to="/">
          <div className={`home ${getTextClass()}`}>OnBoard</div>
        </Link>
      </div>
      <div className="center" />
      <div className="right">

        {/* <Link to="/test">
          <Button className={`temp ${isFirstSection ? 'landing-text' : ''}`} variant="link">TEST</Button>          
        </Link> */} 

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="relative"
              // AlarmBell 자체가 버튼/interactive 컴포넌트면 asChild로 AlarmBell을 직접 감싸도 OK
            >
              <AlarmBell count={5} color={isFirstSection ? '#ffffff' : '#000000'} />
            </button>
          </Popover.Trigger>

          {/* 필요하면 Portal로 분리 */}
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="center"
              sideOffset={8}
              className="z-[9999] w-[250px] bg-white shadow-xl rounded-xl p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
              onPointerDownCapture={(e) => e.stopPropagation()}
            >
              {/* 여기에 알림 목록 등 내용 */}
              <Popover.Arrow className="fill-white" /> Temp
              {/* <div className="fill-white" /> Temp */}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <Button 
          className={`temp ${getTextClass()}`} 
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
          className={`temp ${getTextClass()}`} 
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
            className={`temp ${getTextClass()}`} 
            variant="link" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        ) : (
          <Button 
            className={`temp ${getTextClass()}`} 
            variant="link" 
            onClick={handleGoogleLogin}
          >
            Login
          </Button>
        )}
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && createPortal(
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default Navbar;
