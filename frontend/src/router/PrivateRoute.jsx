import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const PrivateRoute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) {
      navigate('/');
    }
  }, [accessToken, navigate]);

  return accessToken ? <Outlet /> : null;
};

export default PrivateRoute;
