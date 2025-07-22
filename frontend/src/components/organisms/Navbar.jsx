import { Link } from 'react-router-dom';
import './Navbar.css';

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
        <Link to="/test">
          <div className="temp">test</div>
        </Link>
        <Link to="/temp">
          <div className="temp">temp</div>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
