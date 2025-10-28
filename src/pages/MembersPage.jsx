import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import placeholderProfile from '/placeholder-profile.svg';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const MembersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(getApiUrl('/api/users'));
        const data = await response.json();
        const usersWithMovies = await Promise.all(
          data.map(async (user) => {
            try {
              const topMoviesRes = await fetch(getApiUrl(`/api/users/${user.id}/top-movies`));
              if (topMoviesRes.ok) {
                const topMoviesData = await topMoviesRes.json();
                const movieDetails = await Promise.all(
                  topMoviesData.topMovies.slice(0, 4).map(async (item) => {
                    try {
                      const detailRes = await fetch(`${BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`);
                      const detail = await detailRes.json();
                      return detail;
                    } catch (error) {
                      return null;
                    }
                  })
                );
                return {
                  ...user,
                  topMovies: movieDetails.filter(movie => movie !== null)
                };
              }
              return { ...user, topMovies: [] };
            } catch (error) {
              return { ...user, topMovies: [] };
            }
          })
        );
        setUsers(usersWithMovies);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <h1 className="fw-bold mb-4">Miembros</h1>
      {loading ? (
        <div className="text-center py-5">
          <p>Cargando...</p>
        </div>
      ) : (
        <div className="row g-4">
          {users.map((user) => (
            <div key={user.id} className="col-6 col-md-4 col-lg-3">
              <Link
                to={`/profile/${user.username}`}
                className="text-decoration-none"
              >
                <div 
                  className="card h-100 text-center" 
                  style={{ 
                    backgroundColor: '#1e2328', 
                    border: '1px solid #454d5d',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="card-body p-3">
                    {/* Foto de perfil circular */}
                    <img
                      src={user.profilePicture ? getApiUrl(user.profilePicture) : placeholderProfile}
                      alt={user.username}
                      className="rounded-circle mb-2"
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'cover',
                        border: '3px solid #454d5d'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderProfile;
                      }}
                    /> {/* Nombre de usuario */}
                    <h6 className="text-light mb-1 fw-bold" style={{ fontSize: '1rem' }}>
                      {user.username}
                    </h6> {/* Eslogan */}
                    {user.slogan ? (
                      <p className="text-muted small mb-3" style={{ 
                        fontSize: '0.75rem',
                        minHeight: '2.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {user.slogan}
                      </p>
                    ) : (
                      <div style={{ minHeight: '2.5rem', marginBottom: '1rem' }}></div>
                    )} {/* 4 películas en línea horizontal */}
                    <div className="d-flex gap-1" style={{ overflow: 'hidden' }}>
                      {user.topMovies && user.topMovies.length > 0 ? (
                        [0, 1, 2, 3].map((idx) => {
                          const movie = user.topMovies[idx];
                          return (
                            <div
                              key={idx}
                              style={{
                                flex: '1',
                                aspectRatio: '2/3',
                                backgroundImage: movie ? `url(${IMAGE_BASE_URL}/w185${movie.poster_path})` : 'none',
                                backgroundColor: movie ? 'transparent' : '#2c3440',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {!movie && <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>🎬</span>}
                            </div>
                          );
                        })
                      ) : (
                        <div className="d-flex align-items-center justify-content-center w-100" style={{ 
                          backgroundColor: '#2c3440', 
                          borderRadius: '4px',
                          aspectRatio: '8/3'
                        }}>
                          <span className="text-muted" style={{ fontSize: '2rem', opacity: 0.3 }}>🎬</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MembersPage;