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
    const fetchProfilePicture = async () => {
      if (!userId || isNaN(Number(userId))) return;
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(getApiUrl(`/api/users/${userId}`), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setProfilePicture(userData.profilePicture ? getApiUrl(`${userData.profilePicture}`) : null);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };
    fetchProfilePicture();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUsername = localStorage.getItem('username');
      setUsername(updatedUsername);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Tu cuenta ha sido eliminada exitosamente.');
        handleLogout(); // Cierra sesión y redirige
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar la cuenta: ${errorData.error || 'Inténtalo de nuevo.'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Hubo un problema de red. Por favor, inténtalo de nuevo.');
    }
    setIsDeleteModalOpen(false);
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    if (userSearchQuery.trim()) navigate(`/users/search?q=${encodeURIComponent(userSearchQuery)}`);
  };

  return (
    <>
      <nav style={{
        backgroundColor: '#14181c',
        borderBottom: '1px solid #2c3440',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '0.5rem 1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '100%',
          gap: '1rem'
        }}>
          {/* Logo */}
          <Link to="/" style={{
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}>
            The Movie Critic
          </Link>
          {/* Listas link */}
          <Link to="/listas" style={{
            color: 'rgba(255, 255, 255, 0.8)',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}>
            Listas
          </Link>
          {/* Search form */}
          <form onSubmit={handleSearch} style={{
            flex: 1,
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <input 
              type="search" 
              placeholder="Buscar películas..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: '#2c3440',
                color: '#fff',
                border: '1px solid #454d5d',
                borderRadius: '0.25rem',
                outline: 'none'
              }}
            />
          </form>
          {/* User Search form */}
          <form onSubmit={handleUserSearch} style={{
            flex: 1,
            maxWidth: '200px',
          }}>
            <input 
              type="search" 
              placeholder="Buscar usuarios..." 
              value={userSearchQuery} 
              onChange={(e) => setUserSearchQuery(e.target.value)} 
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: '#2c3440',
                color: '#fff',
                border: '1px solid #454d5d',
                borderRadius: '0.25rem',
                outline: 'none'
              }}
            />
          </form>
          {/* Profile dropdown */}
          <div 
            style={{ position: 'relative' }}
            ref={dropdownRef}
          >
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowDropdown(!showDropdown);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                gap: '0.5rem'
              }}
            >
              <img 
                src={profilePicture ? `${profilePicture}?t=${new Date().getTime()}` : '/placeholder-profile.svg'}
                alt="Profile" 
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              {username || 'angel_eyes'}
            </a>
            {showDropdown && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#2c3440',
                border: '1px solid #454d5d',
                borderRadius: '0.25rem',
                listStyle: 'none',
                padding: '0.5rem 0',
                margin: '0.5rem 0 0 0',
                minWidth: '160px',
                zIndex: 1000
              }}>
                <li><Link to="/profile" style={dropdownItemStyle}>Perfil</Link></li>
                <li><Link to="/visto" style={dropdownItemStyle}>Visto</Link></li>
                <li><Link to="/mis-listas" style={dropdownItemStyle}>Mis Listas</Link></li>
                <li><Link to="/watchlist" style={dropdownItemStyle}>Watchlist</Link></li>
                <li><Link to="/likes" style={dropdownItemStyle}>Likes</Link></li>
                <li style={{ borderTop: '1px solid #454d5d', margin: '0.5rem 0' }}></li>
                <li>
                  <button onClick={handleLogout} style={{
                    ...dropdownItemStyle,
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    Cerrar Sesión
                  </button>
                </li>
                <li style={{ borderTop: '1px solid #454d5d', margin: '0.5rem 0' }}></li>
                <li>
                  <button onClick={() => { setIsDeleteModalOpen(true); setShowDropdown(false); }} style={{
                    ...dropdownItemStyle,
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc3545'
                  }}>
                    Eliminar Cuenta
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      {isDeleteModalOpen && (
        <div className="modal-backdrop-dark">
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'transparent' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
                <div className="modal-header">
                  <h5 className="modal-title text-light">Confirmar Eliminación de Cuenta</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setIsDeleteModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-light">¿Estás seguro de que quieres eliminar tu cuenta permanentemente?</p>
                  <p className="text-warning small">Esta acción no se puede deshacer. Todos tus datos, incluyendo listas, calificaciones y reviews, se perderán para siempre.</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>Sí, eliminar mi cuenta</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const dropdownItemStyle = {
  display: 'block',
  padding: '0.5rem 1rem',
  color: '#fff',
  textDecoration: 'none',
  transition: 'background-color 0.2s'
};

export default AuthenticatedHeader;