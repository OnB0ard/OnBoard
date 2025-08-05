import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGoogleLogin } from '@/hooks/useGoogleLogin';
import AccessControlModal from '@/components/organisms/AccessControlModal';

const PlanAccessRoute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const login = useGoogleLogin();
  const [isModalOpen, setIsModalOpen] = useState(!accessToken);

  useEffect(() => {
    if (!accessToken) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [accessToken]);

  const handleLogin = () => {
    login();
    setIsModalOpen(false);
  };

  if (accessToken) {
    return <Outlet />;
  }

  return (
    <AccessControlModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)} // 모달을 닫기만 하는 동작
      onConfirm={handleLogin} // 확인 버튼 클릭 시 로그인 진행
      type="login"
      message="플랜을 보려면 로그인이 필요합니다."
    />
  );
};

export default PlanAccessRoute;
