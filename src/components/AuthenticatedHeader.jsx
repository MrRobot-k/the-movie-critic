import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AuthenticatedHeader = ({ query, setQuery, handleSearch, setIsAuthenticated }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!userId || isNaN(Number(userId))) return;
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setProfilePicture(userData.profilePicture ? `http://localhost:3000${userData.profilePicture}` : null);
        } else {
          console.error('Failed to fetch profile picture');
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };
    fetchProfilePicture();
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand fs-4 fw-bold" to="/">
          The Movie Critic
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-3">
            <li className="nav-item">
              <Link className="nav-link" to="/listas">Listas</Link>
            </li>
          </ul>

          <form className="d-flex mx-auto" onSubmit={handleSearch} style={{ maxWidth: '500px', width: '100%' }}>
            <input 
              type="search" 
              className="form-control form-control-dark" 
              placeholder="Buscar películas y series..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </form>

          <ul className="navbar-nav ms-3">
            <li 
              className="nav-item dropdown"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <a 
                className="nav-link dropdown-toggle d-flex align-items-center" 
                href="#" 
                role="button" 
                aria-expanded={showDropdown}
              >
                {profilePicture ? (
                  <img 
                    src={`${profilePicture}?t=${new Date().getTime()}`} 
                    alt="Profile" 
                    className="rounded-circle me-2" 
                    style={{ width: '30px', height: '30px', objectFit: 'cover' }} 
                  />
                ) : (
                  <img 
                    src="/placeholder-profile.svg" 
                    alt="Profile" 
                    className="rounded-circle me-2" 
                    style={{ width: '30px', height: '30px', objectFit: 'cover' }} 
                  />
                )}
                {username || 'Mi Perfil'}
              </a>
              <ul className={`dropdown-menu dropdown-menu-dark dropdown-menu-end ${showDropdown ? 'show' : ''}`}>
                <li><Link className="dropdown-item" to="/profile">Perfil</Link></li>
                <li><Link className="dropdown-item" to="/visto">Visto</Link></li>
                <li><Link className="dropdown-item" to="/mis-listas">Mis Listas</Link></li>
                <li><Link className="dropdown-item" to="/watchlist">Watchlist</Link></li>
                <li><Link className="dropdown-item" to="/likes">Likes</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default AuthenticatedHeader;