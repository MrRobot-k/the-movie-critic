import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/icon.png';
const GuestHeader = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };
  const closeNav = () => {
    setIsNavOpen(false);
  };
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
      <div className="container-fluid">
        {/* Logo/Brand */}
        <Link className="navbar-brand" to="/" onClick={closeNav}>
          <img src={logo} alt="The Movie Critic Logo" style={{ height: '35px' }} />
        </Link>
        {/* Link de Listas - siempre visible en desktop */}
        <Link className="nav-link text-white d-none d-lg-block me-3" to="/listas">
          Listas
        </Link>
        {/* Spacer para empujar los botones a la derecha */}
        <div className="d-none d-lg-block flex-grow-1"></div>
        {/* Auth buttons - siempre visibles en desktop */}
        <div className="d-none d-lg-flex align-items-center">
          <Link className="nav-link text-white me-2" to="/login">
            Iniciar Sesión
          </Link>
          <Link className="btn btn-primary" to="/register">
            Registrarse
          </Link>
        </div>
        {/* Toggle button for mobile - VERSIÓN CORREGIDA */}
        <button 
          className={`navbar-toggler ${isNavOpen ? '' : 'collapsed'}`}
          type="button" 
          onClick={toggleNav}
          aria-controls="navbarNavMobile"
          aria-expanded={isNavOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        {/* Mobile menu - VERSIÓN CORREGIDA */}
        <div 
          className={`navbar-collapse ${isNavOpen ? 'show' : 'collapse'}`}
          id="navbarNavMobile"
        >
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/listas" onClick={closeNav}>
                Listas
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/login" onClick={closeNav}>
                Iniciar Sesión
              </Link>
            </li>
            <li className="nav-item">
              <Link className="btn btn-primary w-100 mt-2" to="/register" onClick={closeNav}>
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