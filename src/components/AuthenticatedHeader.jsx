import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import logo from '../assets/icon.png';

const AuthenticatedHeader = ({ query, setQuery, handleSearch, setIsAuthenticated }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem('userId');

  // Cerrar el menú cuando cambia la ruta
  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      if (!userId) {
        setIsLoading(false);
        navigate('/login');
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        navigate('/login');
        return;
      }
      try {
        const response = await fetch(getApiUrl(`/api/users/${userId}`), { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-control': 'no-cache'
          } 
        });
        if (response.ok) {
          const userData = await response.json();
          setProfilePicture(userData.profilePicture ? getApiUrl(userData.profilePicture) : null);
          setUsername(userData.username);
          localStorage.setItem('username', userData.username);
        } else if (response.status === 401 || response.status === 403) {
          console.error("Authorization error:", response);
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          setIsAuthenticated(false);
          navigate('/login');
        } else {
          console.error("Error fetching profile data:", response);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [userId, location.pathname, navigate, setIsAuthenticated]);

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
      setIsNavOpen(false);
    }
  };

  const handleMovieSearch = (e) => {
    e.preventDefault();
    handleSearch(e);
    setIsNavOpen(false);
  };

  const toggleNav = () => {
    console.log('Toggle clicked! Current state:', isNavOpen); // DEBUG
    setIsNavOpen(!isNavOpen);
  };

  if (isLoading) {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <img src={logo} alt="The Movie Critic Logo" style={{ height: '35px' }} />
          </Link>
          <div className="ms-auto">
            <span className="text-white">Cargando...</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/" onClick={() => setIsNavOpen(false)}>
          <img src={logo} alt="The Movie Critic Logo" style={{ height: '35px' }} />
        </Link>
        
        <button 
          className={`navbar-toggler ${isNavOpen ? '' : 'collapsed'}`}
          type="button" 
          onClick={toggleNav}
          aria-controls="navbarContent" 
          aria-expanded={isNavOpen}
          aria-label="Toggle navigation"
          style={{ 
            position: 'relative',
            zIndex: 1031,
            border: '2px solid white' // Para verlo mejor
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div 
          className={`navbar-collapse ${isNavOpen ? 'show' : 'collapse'}`}
          id="navbarContent"
        >
          <ul className="navbar-nav 3mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/listas" onClick={() => setIsNavOpen(false)}>
                Listas
              </Link>
            </li>
          </ul>

          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 ms-auto">
            <form onSubmit={handleMovieSearch} className="d-flex my-2 my-lg-0">
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
                <button 
                  className="nav-link dropdown-toggle d-flex align-items-center btn btn-link text-decoration-none"
                  type="button"
                  id="navbarDropdown" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <img
                    src={profilePicture || '/placeholder-profile.svg'}
                    alt="Profile"
                    className="rounded-circle me-2"
                    style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-profile.svg';
                    }}
                  />
                  {username || 'Perfil'}
                </button>
                <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li><Link className="dropdown-item" to="/profile" onClick={() => setIsNavOpen(false)}>Perfil</Link></li>
                  <li><Link className="dropdown-item" to="/visto" onClick={() => setIsNavOpen(false)}>Visto</Link></li>
                  <li><Link className="dropdown-item" to="/mis-listas" onClick={() => setIsNavOpen(false)}>Mis Listas</Link></li>
                  <li><Link className="dropdown-item" to="/watchlist" onClick={() => setIsNavOpen(false)}>Watchlist</Link></li>
                  <li><Link className="dropdown-item" to="/likes" onClick={() => setIsNavOpen(false)}>Likes</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger" onClick={() => { handleLogout(); setIsNavOpen(false); }}>Cerrar Sesión</button></li>
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