import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import {Button} from "@/components/ui/button"
import {useGoogleLogin} from "@/hooks/useGoogleLogin"
import { useAuthStore } from '@/store/useAuthStore';

const Navbar = () => {

    const handleGoogleLogin = useGoogleLogin();
  const { accessToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    alert('로그아웃 되었습니다.');
    navigate('/');
  };

  return (
    <div className="Header">
      <div className="left">
        <Link to="/">
          <div className="home" >OnBoard</div>
        </Link>
      </div>
      <div className="center" />
      <div className="right">
        <Link to="/Test">
          <Button className="temp" variant="link">TEST</Button>          
        </Link>
        <Link to="/list">
          <Button className="temp" variant="link">Plan</Button>
        </Link>
        <Link to="/mypage">
          <Button className="temp" variant="link">Mypage</Button>
        </Link>
                {accessToken ? (
          <Button className="temp" variant="link" onClick={handleLogout}>Logout</Button>
        ) : (
          <Button className="temp" variant="link" onClick={handleGoogleLogin}>Login</Button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
