import React from 'react';
import { Link } from 'react-router-dom';

const GuestHeader = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand fs-4 fw-bold" to="/">The Movie Critic</Link>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/register">Crear Cuenta</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/login">Iniciar Sesión</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default GuestHeader;
