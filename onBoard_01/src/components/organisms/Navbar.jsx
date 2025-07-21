import { Link } from 'react-router-dom';
import './Navbar.css';
import {Button} from "@/components/ui/button"

const Navbar = () => {
  return (
    <div className="Header">
      <div className="left">
        <Link to="/">
          <div className="Home">Home</div>
        </Link>
      </div>
      <div className="center" />
      <div className="right">
        <Link to="/temp">
          <div className="temp">temp</div>
        </Link>
        <Link to="/temp">
          <div className="temp">temp</div>
        </Link>
        <Link to="/temp">
          <Button variant="ghost">temp</Button>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
