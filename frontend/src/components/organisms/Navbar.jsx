import { Link } from 'react-router-dom';
import './Navbar.css';
import {Button} from "@/components/ui/button"
import {useGoogleLogin} from "@/hooks/useGoogleLogin"

const Navbar = () => {

  const handleGoogleLogin = useGoogleLogin();
  return (
    <div className="Header">
      <div className="left">
        <Link to="/">
          <div className="home" >OnBoard</div>
        </Link>
      </div>
      <div className="center" />
      <div className="right">
        <Link to="/plan">
          <Button className="temp" variant="link">Plan</Button>
        </Link>
        <Link to="/mypage">
          <Button className="temp" variant="link">Mypage</Button>
        </Link>
        <Button className="temp" variant="link" onClick={handleGoogleLogin}>Login</Button>
      </div>
    </div>
  );
};

export default Navbar;
