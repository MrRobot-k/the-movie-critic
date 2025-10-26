import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/icon.png';

const GuestHeader = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
      <div className="container-fluid">
        {/* Logo/Brand */}
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="The Movie Critic Logo" style={{ height: '35px' }} />
        </Link>

        {/* Toggle button for mobile */}
        <button 
          className="navbar-toggler ms-auto" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNavMobile" 
          aria-controls="navbarNavMobile" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        {/* Mobile menu */}
        <div className="collapse navbar-collapse" id="navbarNavMobile">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/listas">Listas</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/login">Iniciar Sesión</Link>
            </li>
            <li className="nav-item">
              <Link className="btn btn-primary w-100 mt-2" to="/register">
                Registrarse
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
export default GuestHeader;