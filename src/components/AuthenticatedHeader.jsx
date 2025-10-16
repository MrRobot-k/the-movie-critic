
import React from 'react';
import { Link } from 'react-router-dom';

const AuthenticatedHeader = ({ query, setQuery, handleSearch }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand fs-4 fw-bold" href="#">The Movie Critic</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                              <li className="nav-item">
                                <Link className="nav-link" to="/visto">Visto</Link>
                              </li>            <li className="nav-item">
              <a className="nav-link" href="#">Mis Listas</a>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/watchlist">Watchlist</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/likes">Likes</Link>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Mi Perfil</a>
            </li>
          </ul>
          <form className="d-flex" onSubmit={handleSearch}>
            <input type="search" className="form-control form-control-dark" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </form>
        </div>
      </div>
    </nav>
  );
};

export default AuthenticatedHeader;
