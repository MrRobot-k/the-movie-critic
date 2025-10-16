import React, { useState, useEffect } from 'react';
import { Star, Heart, Eye } from 'lucide-react'; // Importar Heart y Eye

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const MovieDetailsModal = ({ movie, onClose, isAuthenticated, onRateMovie, onToggleLike, onToggleWatchlist }) => {
  if (!movie) return null;

  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [ratingError, setRatingError] = useState('');
  const [isLiked, setIsLiked] = useState(false); // Estado para 'Me gusta'
  const [likeError, setLikeError] = useState('');
  const [isWatchlisted, setIsWatchlisted] = useState(false); // Estado para 'Watchlist'
  const [watchlistError, setWatchlistError] = useState('');

  const movieId = movie.id;
  const userId = localStorage.getItem('userId'); // Obtener userId del localStorage

  // Función para obtener la calificación existente del usuario
  const fetchUserRating = async () => {
    if (!isAuthenticated || !userId || !movieId) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/movies/${movieId}/rating`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.rating) {
          setUserRating(data.rating.score);
        }
      } else if (response.status === 404) {
        setUserRating(0); // No rating found for this user/movie
      } else {
        console.error('Error fetching user rating:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  // Función para obtener el estado de 'Me gusta' del usuario
  const fetchUserLikeStatus = async () => {
    if (!isAuthenticated || !userId || !movieId) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/movies/${movieId}/likeStatus`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
      } else if (response.status === 404) {
        setIsLiked(false); // No like found for this user/movie
      } else {
        console.error('Error fetching user like status:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user like status:', error);
    }
  };

  // Función para obtener el estado de 'Watchlist' del usuario
  const fetchUserWatchlistStatus = async () => {
    if (!isAuthenticated || !userId || !movieId) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/movies/${movieId}/watchlistStatus`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsWatchlisted(data.isWatchlisted);
      } else if (response.status === 404) {
        setIsWatchlisted(false); // Not in watchlist for this user/movie
      } else {
        console.error('Error fetching user watchlist status:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user watchlist status:', error);
    }
  };

  useEffect(() => {
    fetchUserRating();
    fetchUserLikeStatus();
    fetchUserWatchlistStatus(); // Fetch watchlist status as well
  }, [movieId, isAuthenticated]); // Refetch when movie or auth status changes

  const handleStarClick = async (score) => {
    if (!isAuthenticated) {
      setRatingError('Debes iniciar sesión para calificar una película.');
      return;
    }
    setRatingError('');
    setUserRating(score);
    await onRateMovie(movieId, score); // Llama a la función pasada desde App.jsx
  };

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      setLikeError("Debes iniciar sesión para dar 'Me gusta'.");
      return;
    }
    setLikeError('');
    setIsLiked(!isLiked); // Optimistic UI update
    await onToggleLike(movieId, !isLiked); // Llama a la función pasada desde App.jsx
  };

  const handleWatchlistClick = async () => {
    if (!isAuthenticated) {
      setWatchlistError("Debes iniciar sesión para añadir a la Watchlist.");
      return;
    }
    setWatchlistError('');
    setIsWatchlisted(!isWatchlisted); // Optimistic UI update
    await onToggleWatchlist(movieId, !isWatchlisted); // Llama a la función pasada desde App.jsx
  };

  const backdropUrl = movie.backdrop_path
    ? `${IMAGE_BASE_URL}/w1280${movie.backdrop_path}`
    : 'https://via.placeholder.com/1280x720?text=No+Image';

  return (
    <div className="modal fade show d-block modal-backdrop-custom" tabIndex="-1" onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-xl modal-custom-width" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content modal-content-custom">
          <div className="modal-body p-0">
            <img src={backdropUrl} alt="" className="img-fluid movie-backdrop w-100" />
            <div className="p-4">
              <h2 className="fw-bold">{movie.title}</h2>
              {movie.original_title !== movie.title && (
                <p className="fst-italic">{movie.original_title}</p>
              )}
              <div className="d-flex align-items-center gap-3 mt-2">
                <div className="d-flex align-items-center gap-1">
                  <Star color="#ffc107" size={16} />
                  <span>{movie.vote_average?.toFixed(1)}</span>
                </div>
                <span>{movie.release_date?.split('-')[0]}</span>
                {movie.runtime && <span>{`${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`}</span>}
              </div>
              {movie.genres && movie.genres.length > 0 && (
                <p>{movie.genres.map(g => g.name).join(', ')}</p>
              )}
              <p className="mt-3">{movie.overview || 'No hay sinopsis disponible.'}</p>

              {/* Sección de Calificación, Like y Watchlist */}
              <div className="d-flex align-items-center gap-4 mt-4">
                <div>
                  <h4>Tu Calificación:</h4>
                  <div className="d-flex align-items-center">
                    {[...Array(5)].map((_, index) => {
                      const starNumber = index + 1;
                      const currentRatingValue = hoverRating || userRating;
                      const isFull = currentRatingValue >= starNumber;
                      const isHalf = currentRatingValue >= (starNumber - 0.5) && currentRatingValue < starNumber;

                      return (
                        <div
                          key={index}
                          style={{ position: 'relative', width: '24px', height: '24px', cursor: isAuthenticated ? 'pointer' : 'not-allowed' }}
                          onMouseMove={(e) => {
                            if (!isAuthenticated) return;
                            const { left, width } = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - left;
                            const halfPoint = width / 2;
                            const newHoverRating = starNumber - (clickX < halfPoint ? 0.5 : 0);
                            setHoverRating(newHoverRating);
                          }}
                          onMouseLeave={() => isAuthenticated && setHoverRating(0)}
                          onClick={() => isAuthenticated && handleStarClick(hoverRating)}
                        >
                          <Star
                            color={isFull || isHalf ? "#ffc107" : "#e4e5e9"}
                            fill={isFull ? "#ffc107" : (isHalf ? "#ffeb3b" : "none")} // Distinct yellow fill for half-star
                            size={24}
                          />
                        </div>
                      );
                    })}
                    {userRating > 0 && <span className="ms-2">({userRating} estrellas)</span>}
                  </div>
                  {ratingError && <div className="text-danger mt-2">{ratingError}</div>}
                </div>

                {/* Botón de Like */}
                <div className="ms-auto d-flex align-items-center gap-3">
                  <Heart
                    size={28}
                    color={isLiked ? "#e74c3c" : "#e4e5e9"} // Rojo si le gusta, gris si no
                    fill={isLiked ? "#e74c3c" : "none"}
                    onClick={handleLikeClick}
                    style={{ cursor: isAuthenticated ? 'pointer' : 'not-allowed' }}
                  />
                  {/* Botón de Watchlist */}
                  <Eye
                    size={28}
                    color={isWatchlisted ? "#3498db" : "#e4e5e9"} // Azul si está en watchlist, gris si no
                    fill={isWatchlisted ? "#3498db" : "none"}
                    onClick={handleWatchlistClick}
                    style={{ cursor: isAuthenticated ? 'pointer' : 'not-allowed' }}
                  />
                </div>
                {likeError && <div className="text-danger mt-2">{likeError}</div>}
                {watchlistError && <div className="text-danger mt-2">{watchlistError}</div>}
              </div>

              <div className="mt-4">
                {movie.director && <p><strong>Director:</strong> {movie.director.name}</p>}
                {movie.production_countries && movie.production_countries.length > 0 && (
                  <p><strong>País:</strong> {movie.production_countries.map(c => c.name).join(', ')}</p>
                )}
                {movie.cast && movie.cast.length > 0 && (
                  <div>
                    <strong>Reparto:</strong>
                    <div className="d-flex flex-wrap gap-3 mt-2">
                      {movie.cast.slice(0, 6).map(actor => (
                        <div key={actor.id} className="text-center">
                          <img 
                            src={actor.profile_path ? `${IMAGE_BASE_URL}/w185${actor.profile_path}` : 'https://via.placeholder.com/185x278?text=No+Foto'}
                            alt={actor.name}
                            className="rounded-circle" 
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
                          />
                          <p className="mb-0 mt-1">{actor.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;