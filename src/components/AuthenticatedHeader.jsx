import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AuthenticatedHeader = ({ query, setQuery, handleSearch, setIsAuthenticated }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  const dropdownRef = useRef(null);

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
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };
    fetchProfilePicture();
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
            </ul>
          )}
        </div>
      </div>
    </nav>
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