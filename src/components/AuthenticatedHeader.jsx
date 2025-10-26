import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

const AuthenticatedHeader = ({ query, setQuery, handleSearch, setIsAuthenticated }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId || isNaN(Number(userId))) return;
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(getApiUrl(`/api/users/${userId}`), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setProfilePicture(userData.profilePicture ? getApiUrl(userData.profilePicture) : null);
          setUsername(userData.username); // Actualizar el nombre de usuario
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    fetchProfileData();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUsername = localStorage.getItem('username');
      if (updatedUsername !== username) {
        setUsername(updatedUsername);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // También escucha un evento personalizado para forzar la actualización
    const handleProfileUpdate = () => {
       const updatedUsername = localStorage.getItem('username');
       setUsername(updatedUsername);
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [username]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl('/api/users/delete'), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        alert('Tu cuenta ha sido eliminada exitosamente.');
        handleLogout();
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar la cuenta: ${errorData.error || 'Inténtalo de nuevo.'}`);
      }
    } catch (error) {
      alert('Hubo un problema de red. Por favor, inténtalo de nuevo.');
    }
    setIsDeleteModalOpen(false);
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    if (userSearchQuery.trim()) {
      navigate(`/users/search?q=${encodeURIComponent(userSearchQuery)}`);
    }
  };

  const dropdownItemStyle = {
    display: 'block',
    width: '100%',
    padding: '0.5rem 1rem',
    clear: 'both',
    fontWeight: 400,
    color: '#fff',
    textAlign: 'inherit',
    whiteSpace: 'nowrap',
    backgroundColor: 'transparent',
    border: 0,
    textDecoration: 'none'
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 fixed-top">
        <div className="container-fluid">
          {/* Logo */}
          <Link className="navbar-brand fs-4 fw-bold" to="/">The Movie Critic</Link>

          {/* Botón de hamburguesa para móvil */}
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#authenticatedNavbar" 
            aria-controls="authenticatedNavbar" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Contenido del menú (colapsable) */}
          <div className="collapse navbar-collapse" id="authenticatedNavbar">
            {/* Links a la izquierda en desktop */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/listas">Listas</Link>
              </li>
            </ul>

            {/* Buscadores en el medio en desktop */}
            <div className="d-none d-lg-flex gap-2 mx-auto">
              <form onSubmit={handleSearch} className="d-flex">
                <input
                  type="search"
                  placeholder="Buscar películas..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="form-control bg-dark text-white"
                />
              </form>
              <form onSubmit={handleUserSearch} className="d-flex">
                <input
                  type="search"
                  placeholder="Buscar usuarios..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="form-control bg-dark text-white"
                />
              </form>
            </div>
            
            {/* Contenido para el menú móvil */}
            <div className="d-lg-none">
              <hr className="text-white-50" />
              <form onSubmit={handleSearch} className="d-flex mb-2">
                <input
                  type="search"
                  placeholder="Buscar películas..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="form-control bg-dark text-white"
                />
              </form>
              <form onSubmit={handleUserSearch} className="d-flex mb-3">
                <input
                  type="search"
                  placeholder="Buscar usuarios..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="form-control bg-dark text-white"
                />
              </form>
              <h5 className="text-white">Mi Cuenta</h5>
              <ul className="navbar-nav">
                <li className="nav-item"><Link to="/profile" className="nav-link">Perfil</Link></li>
                <li className="nav-item"><Link to="/visto" className="nav-link">Visto</Link></li>
                <li className="nav-item"><Link to="/mis-listas" className="nav-link">Mis Listas</Link></li>
                <li className="nav-item"><Link to="/watchlist" className="nav-link">Watchlist</Link></li>
                <li className="nav-item"><Link to="/likes" className="nav-link">Likes</Link></li>
                <li className="nav-item"><hr className="text-white-50" /></li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="btn btn-link nav-link text-danger">Cerrar Sesión</button>
                </li>
                <li className="nav-item">
                  <button onClick={() => setIsDeleteModalOpen(true)} className="btn btn-link nav-link text-warning">Eliminar Cuenta</button>
                </li>
              </ul>
            </div>

            {/* Dropdown de perfil a la derecha en desktop */}
            <div className="d-none d-lg-flex" ref={dropdownRef}>
              <div className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle d-flex align-items-center" 
                  href="#" 
                  id="navbarDropdown" 
                  role="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  onClick={(e) => { e.preventDefault(); setShowDropdown(!showDropdown); }}
                >
                  <img
                    src={profilePicture ? `${profilePicture}?t=${new Date().getTime()}` : '/placeholder-profile.svg'}
                    alt="Profile"
                    className="rounded-circle me-2"
                    style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                  />
                  {username || 'Perfil'}
                </a>
                <ul className={`dropdown-menu dropdown-menu-dark dropdown-menu-end ${showDropdown ? 'show' : ''}`} aria-labelledby="navbarDropdown">
                  <li><Link to="/profile" style={dropdownItemStyle}>Perfil</Link></li>
                  <li><Link to="/visto" style={dropdownItemStyle}>Visto</Link></li>
                  <li><Link to="/mis-listas" style={dropdownItemStyle}>Mis Listas</Link></li>
                  <li><Link to="/watchlist" style={dropdownItemStyle}>Watchlist</Link></li>
                  <li><Link to="/likes" style={dropdownItemStyle}>Likes</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button onClick={handleLogout} style={{...dropdownItemStyle, color: '#dc3545'}}>Cerrar Sesión</button></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button onClick={() => setIsDeleteModalOpen(true)} style={{...dropdownItemStyle, color: '#ffc107'}}>Eliminar Cuenta</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isDeleteModalOpen && (
        <div className="modal-backdrop-dark">
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content bg-dark text-white">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmar Eliminación</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setIsDeleteModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <p>¿Estás seguro de que quieres eliminar tu cuenta permanentemente?</p>
                  <p className="text-warning small">Esta acción no se puede deshacer.</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>Sí, eliminar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthenticatedHeader;
