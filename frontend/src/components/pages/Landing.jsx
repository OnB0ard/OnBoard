import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FullpageContainer,
  FullpageSection,
} from "@shinyongjun/react-fullpage";
import "@shinyongjun/react-fullpage/css";
import "./Landing.css";
import "../../router/PrivateRoute.css";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoogleLogin } from "@/hooks/useGoogleLogin";
import Icon from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";

// 타자기 효과 컴포넌트
function TypewriterText({ text, speed = 100 }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  return (
    <span>
      {displayText}
    </span>
  );
}

function Landing() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const handleGoogleLogin = useGoogleLogin();

  // activeIndex를 전역 상태로 설정 (Navbar에서 접근 가능하도록)
  useEffect(() => {
    // localStorage를 사용하여 현재 섹션 인덱스를 저장
    localStorage.setItem('landingActiveIndex', activeIndex.toString());
    
    // 커스텀 이벤트를 발생시켜 Navbar에 알림
    window.dispatchEvent(new CustomEvent('landingSectionChange', { 
      detail: { activeIndex } 
    }));
  }, [activeIndex]);

  // 네비게이션에서 로그인 모달 요청 이벤트 감지
  useEffect(() => {
    const handleShowLoginModal = (event) => {
      setShowLoginModal(true);
      // 이벤트에서 리다이렉트할 페이지 정보를 받음
      if (event.detail && event.detail.redirectTo) {
        setRedirectTo(event.detail.redirectTo);
      }
    };

    window.addEventListener('showLoginModal', handleShowLoginModal);

    return () => {
      window.removeEventListener('showLoginModal', handleShowLoginModal);
    };
  }, []);

  const handleStartClick = () => {
    if (accessToken) {
      navigate('/list');
    } else {
      setShowLoginModal(true);
      setRedirectTo('/list');
    }
  };

  const handleLoginConfirm = () => {
    setShowLoginModal(false);
    handleGoogleLogin();
  };

  // 로그인 성공 후 이동할 페이지 추적
  const [redirectTo, setRedirectTo] = useState(null);
  
  useEffect(() => {
    if (accessToken && showLoginModal === false && redirectTo) {
      // 모달이 닫혀있고 토큰이 있고, 리다이렉트할 페이지가 있으면 이동
      navigate(redirectTo);
      setRedirectTo(null);
    }
  }, [accessToken, showLoginModal, redirectTo, navigate]);

  const handleLoginCancel = () => {
    setShowLoginModal(false);
  };

  const features = [
    {
      title: "함께 떠날 친구를 초대해보세요",
      desc: "링크 하나로 쉽게 초대하고 실시간으로 함께 계획할 수 있어요.",
      media: "/videos/invite.mp4", // 또는 /gifs/invite.gif
    },
    {
      title: "실시간 화이트보드로 계획을 자유롭게 그려보세요",
      desc: "아이디어를 마음껏 그리고, 메모하고, 지울 수 있어요.",
      media: "/videos/whiteboard.mp4",
    },
    {
      title: "마음에 드는 장소, 가고싶은 곳을 북마크에 담아두세요",
      desc: "여행 중 가고 싶은 곳을 저장하고 함께 볼 수 있어요.",
      media: "/videos/bookmark.mp4",
    },
    {
      title: "지도를 보며 손쉽게 일정을 추가할 수 있어요",
      desc: "드래그 앤 드롭으로 일정을 완성할 수 있어요.",
      media: "/videos/map.mp4",
    },
  ];

  return (
    <>
      <FullpageContainer
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      >
        {/* Hero Section */}
        <FullpageSection>
          <div className="hero-section">
            <video autoPlay loop muted playsInline className="hero-bg">
              <source src="/videos/airplane.mp4" type="video/mp4" />
            </video>
            <div className="hero-overlay"></div>

            <div className="hero-content">
              <h1 className="hero-title">
                <TypewriterText text="함께 떠날 여행의 첫 걸음," />
              </h1>
              <motion.h1
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
                className="brand"
              >
                OnBoard
              </motion.h1>
              <motion.button
                className="start-btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartClick}
              >
                시작하기
              </motion.button>
            </div>
          </div>
        </FullpageSection>

        {/* 기능별 시연 섹션 */}
        {features.map((f, idx) => (
          <FullpageSection key={idx}>
            <div className="feature-showcase">
              <motion.div
                className="feature-text"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2>{f.title}</h2>
                <p>{f.desc}</p>
              </motion.div>
              <motion.div
                className="feature-media"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {f.media.endsWith(".mp4") ? (
                  <video autoPlay loop muted playsInline>
                    <source src={f.media} type="video/mp4" />
                  </video>
                ) : (
                  <img src={f.media} alt={f.title} />
                )}
              </motion.div>
            </div>
          </FullpageSection>
        ))}

        {/* CTA */}
        <FullpageSection>
          <div className="cta-section">
            <h2>지금 바로 여행을 시작하세요</h2>
            <button className="start-btn" onClick={handleStartClick}>시작하기</button>
          </div>
        </FullpageSection>
      </FullpageContainer>

      {/* Dot Navigation */}
      <div className="dot-controller">
        {Array.from({ length: features.length + 2 }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={activeIndex === i ? "dot active" : "dot"}
            onClick={() => setActiveIndex(i)}
            aria-label={`Go to section ${i + 1}`}
          />
        ))}
      </div>

      {/* 로그인 모달 */}
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
}

export default Landing;
