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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNotificationStore } from "@/store/useNotificationStore";

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

  // 알림 store
  const { items, load, markAsRead, unreadCount, loading } = useNotificationStore();

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

   // Navbar가 처음 마운트될 때 로그인되어 있으면 알림 로드
  useEffect(() => {
    if (isLoggedIn) load();
  }, [isLoggedIn, load]);

  // 라우트 바뀔 때마다 로드 (staleTime 내면 자동 스킵)
  useEffect(() => {
    if (isLoggedIn) load();
    // pathname + search 기준으로 변화 감지
  }, [isLoggedIn, location.pathname, location.search, load]);

  // Popover 열릴 때마다 새로고침(실시간 느낌)
  useEffect(() => {
    if (open && isLoggedIn) load();
  }, [open, isLoggedIn, load]);

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
  
  const unread = unreadCount(); // 뱃지 숫자

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

        {/* 로그인 한 경우에만 알림 아이콘 표시 */}
        {isLoggedIn && (
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
              <button type="button" className="relative">
                <AlarmBell count={unread} color={isFirstSection ? '#ffffff' : '#000000'} />
              </button>
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Content
                side="bottom"
                align="center"
                sideOffset={8}
                className="z-[9999] w-[320px] bg-white shadow-xl rounded-xl p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownCapture={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b font-semibold">알림</div>

                {/* ▼ 리스트 영역: 4행(224px) 이하이면 내용만큼, 초과면 스크롤 */}
                <div className="w-full p-2"> 
                  <div className="overflow-auto max-h-[208px] rounded-lg">
                    {loading && (
                      <div className="p-4 text-sm text-gray-500">불러오는 중…</div>
                    )}

                    {/* {!loading && items.length === 0 && (
                      <div className="p-4 text-sm text-gray-500">새 알림이 없습니다.</div>
                    )}

                    {!loading && items.map((n) => {
                      const { notificationId, message, userImgUrl, isRead } = n;
                      // console.log(items);
                      return (
                        <button
                          key={notificationId}
                          type="button"
                          onClick={async () => {
                            if (!isRead) await markAsRead(notificationId);
                            setOpen(false);
                            navigate('/list');
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                            isRead ? "opacity-70" : "bg-white"
                          } min-h-14`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={userImgUrl || ""} alt="user" />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className={`text-sm ${isRead ? "" : "font-semibold"}`}>
                              {message}
                            </div>
                          </div>

                          {!isRead && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </button>
                      );
                    })} */}

                      {/*읽은 알림 삭제.ver*/}
                      {!loading && (() => {
                        const unreadItems = items.filter((n) => !n.isRead);

                        if (unreadItems.length === 0) {
                          return (
                            <div className="p-4 text-sm text-gray-500">새 알림이 없습니다.</div>
                          );
                        }

                        return unreadItems.map((n) => {
                          const { notificationId, message, userImgUrl } = n;
                          return (
                            <button
                              key={notificationId}
                              type="button"
                              onClick={async () => {
                                // 읽기 처리 후 목록에서 사라지게 됨(스토어가 업데이트되면 즉시 필터 반영)
                                await markAsRead(notificationId);
                                setOpen(false);
                                navigate('/list');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 bg-white min-h-14"
                            >
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={userImgUrl || ""} alt="user" />
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>

                              <div className="flex-1">
                                <div className="text-sm font-semibold">{message}</div>
                              </div>

                              {/* 읽지 않은 것만 렌더링하므로 파란 점은 옵션 */}
                              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                            </button>
                          );
                        });
                      })()}
                  </div>
                </div>

                <Popover.Arrow className="fill-white" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}


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
