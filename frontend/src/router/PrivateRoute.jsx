import { Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGoogleLogin } from '@/hooks/useGoogleLogin';

const PrivateRoute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
    const login = useGoogleLogin();
  const isLoginTriggered = useRef(false);

  useEffect(() => {
    // StrictMode에서의 이중 호출을 방지하기 위해 ref를 사용합니다.
    // accessToken이 없고, 아직 로그인 함수를 호출하지 않았다면 실행합니다.
    if (!accessToken && !isLoginTriggered.current) {
      isLoginTriggered.current = true; // 로그인 함수를 호출했음을 표시
      alert('로그인이 필요한 페이지입니다. 확인을 누르면 로그인 화면으로 이동합니다.');
      login();
    }
  }, [accessToken, login]);

    // accessToken이 있으면 자식 라우트를 렌더링하고,
  // 없으면 로그인 절차가 진행되는 동안 로딩 화면을 보여줍니다.
  return accessToken ? <Outlet /> : null;
};

export default PrivateRoute;
