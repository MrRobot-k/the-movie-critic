import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

const AuthenticatedHeader = ({ query, setQuery, handleSearch, setIsAuthenticated }) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(getApiUrl(`/api/users/${userId}`), { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const userData = await response.json();
          setProfilePicture(userData.profilePicture ? getApiUrl(userData.profilePicture) : null);
          setUsername(userData.username);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    fetchProfileData();
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    if (userSearchQuery.trim()) {
      navigate(`/users/search?q=${encodeURIComponent(userSearchQuery)}`);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand fs-4 fw-bold" to="/">The Movie Critic</Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded={!isNavCollapsed} aria-label="Toggle navigation" onClick={() => setIsNavCollapsed(!isNavCollapsed)}>
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/listas">Listas</Link>
            </li>
          </ul>

          <div className="d-flex flex-column flex-lg-row align-items-center gap-2">
            <form onSubmit={handleSearch} className="d-flex my-2 my-lg-0">
              <input
                type="search"
                placeholder="Buscar películas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-control bg-dark text-white"
              />
            </form>
            <form onSubmit={handleUserSearch} className="d-flex my-2 my-lg-0">
              <input
                type="search"
                placeholder="Buscar usuarios..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="form-control bg-dark text-white"
              />
            </form>

            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <img
                    src={profilePicture || '/placeholder-profile.svg'}
                    alt="Profile"
                    className="rounded-circle me-2"
                    style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                  />
                  {username || 'Perfil'}
                </a>
                <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li><Link className="dropdown-item" to="/profile">Perfil</Link></li>
                  <li><Link className="dropdown-item" to="/visto">Visto</Link></li>
                  <li><Link className="dropdown-item" to="/mis-listas">Mis Listas</Link></li>
                  <li><Link className="dropdown-item" to="/watchlist">Watchlist</Link></li>
                  <li><Link className="dropdown-item" to="/likes">Likes</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger" onClick={handleLogout}>Cerrar Sesión</button></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthenticatedHeader;