import React from "react";
import { BiUserCircle } from "react-icons/bi";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import logo from "./logo.png"
const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  // logout handler
  const handleLogout = () => {
    localStorage.clear();
    alert("Logout Successfully");
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">
        <div className="container-fluid ">
          <div className="navbar-brand h1 ">
            <img className="navbar-logo" src={logo} alt="" height='80px'/>
             Rebooked
          </div>
          <ul className="navbar-nav flex-row">
            <li className="nav-item mx-3">
              <p className="nav-link">
                <BiUserCircle /> Welcome{" "}
                {user?.name || user?.instituteName || user?.organisationName}
                &nbsp;
                <span className="badge">{user?.role}</span>
              </p>
            </li>
            {location.pathname === "/" ||
            location.pathname === "/donar" ||
            location.pathname === "/institute" ? (
              <li className="nav-item mx-3">
                <Link to="/analytics" className="nav-link">
                  Analytics
                </Link>
              </li>
            ) : (
              <li className="nav-item mx-3">
                <Link to="/" className="nav-link">
                  Home
                </Link>
              </li>
            )}
            <li className="nav-item mx-3">
              <button className="btn btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;