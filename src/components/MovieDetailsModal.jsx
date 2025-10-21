import React, { useState, useEffect } from 'react';
import { Star, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const MovieDetailsModal = ({ movie, onClose, isAuthenticated, onRateMovie, onToggleLike, onToggleWatchlist, onMovieRated, movieList, currentIndex, onNavigate }) => {
  if (!movie) return null;

  // Estados del componente
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [ratingError, setRatingError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeError, setLikeError] = useState('');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistError, setWatchlistError] = useState('');
  const [isWatched, setIsWatched] = useState(false);
  const [watchedError, setWatchedError] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [myReview, setMyReview] = useState('');
  const [allReviews, setAllReviews] = useState([]);
  const [reviewError, setReviewError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Obtener título y detalles según el tipo de contenido
  const getTitle = () => {
    return movie.title || movie.name || 'Título no disponible';
  };

  const getOriginalTitle = () => {
    return movie.original_title || movie.original_name;
  };

  const getReleaseDate = () => {
    return movie.release_date || movie.first_air_date;
  };

  const getRuntime = () => {
    if (movie.runtime) return movie.runtime; // Para películas
    if (movie.episode_run_time && movie.episode_run_time.length > 0) {
      return movie.episode_run_time[0]; // Para series (tomamos el primer tiempo de episodio)
    }
    return null;
  };

  const userId = localStorage.getItem('userId');

  const fetchUserRating = async () => {
    const token = localStorage.getItem('token');
    if (!token || !userId || !movie.id) return 0;
    try {
      const response = await fetch(`http://localhost:3000/api/media/${movie.id}/rating?mediaType=${movie.media_type}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.rating) {
          setUserRating(data.rating.score);
          setIsWatched(true);
          return data.rating.score;
        }
      } else if (response.status === 404) {
        setUserRating(0);
      }
    } catch (error) { console.error('Error fetching user rating:', error); }
    return 0;
  };

  const fetchUserLikeStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token || !userId || !movie.id) return;
    try {
      const response = await fetch(`http://localhost:3000/api/media/${movie.id}/likeStatus?mediaType=${movie.media_type}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
      } else if (response.status === 404) setIsLiked(false);
    } catch (error) { console.error('Error fetching user like status:', error); }
  };

  const fetchUserWatchlistStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token || !userId || !movie.id) return;
    try {
      const response = await fetch(`http://localhost:3000/api/media/${movie.id}/watchlistStatus?mediaType=${movie.media_type}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsWatchlisted(data.isWatchlisted);
      } else if (response.status === 404) setIsWatchlisted(false);
    } catch (error) { console.error('Error fetching user watchlist status:', error); }
  };

  const fetchUserWatchedStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token || !userId || !movie.id) return;
    try {
      const response = await fetch(`http://localhost:3000/api/media/${movie.id}/watchedStatus?mediaType=${movie.media_type}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsWatched(data.isWatched);
      } else if (response.status === 404) {
        setIsWatched(false);
      }
    } catch (error) { console.error('Error fetching user watched status:', error); }
  };

  const fetchMyReview = async () => {
    const token = localStorage.getItem('token');
    if (!token || !userId || !movie.id) return;
    try {
      const response = await fetch(`http://localhost:3000/api/media/${movie.id}/myReview?mediaType=${movie.media_type}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.review) {
          setMyReview(data.review.reviewText);
          setReviewText(data.review.reviewText);
        }
      }
    } catch (error) { console.error('Error fetching my review:', error); }
  };

  const fetchAllReviews = async () => {
    if (!movie.id) return;
    try {
      const response = await fetch(`http://localhost:3000/api/media/${movie.id}/reviews?mediaType=${movie.media_type}`);
      if (response.ok) {
        const data = await response.json();
        setAllReviews(data.reviews);
      }
    } catch (error) { console.error('Error fetching reviews:', error); }
  };

  useEffect(() => {
    setHoverRating(0);
    setUserRating(0);
    setRatingError('');
    setIsLiked(false);
    setLikeError('');
    setIsWatchlisted(false);
    setWatchlistError('');
    setIsWatched(false);
    setWatchedError('');
    setReviewText('');
    setMyReview('');
    setAllReviews([]);
    setReviewError('');
    setShowReviewForm(false);

    const fetchAllData = async () => {
      if (!movie.id) return;

      if (isAuthenticated) {
        let rating = 0;
        if (movie.userScore) {
          setUserRating(movie.userScore);
          if (movie.userScore > 0) setIsWatched(true);
          rating = movie.userScore;
        } else {
          rating = await fetchUserRating();
        }

        if (rating === 0) {
          await fetchUserWatchedStatus();
        }

        await Promise.all([
          fetchUserLikeStatus(),
          fetchMyReview(),
          fetchUserWatchlistStatus()
        ]);
      }

      await fetchAllReviews();
    };

    fetchAllData();

    document.body.classList.add('modal-is-open');
    return () => {
      document.body.classList.remove('modal-is-open');
    };
  }, [movie.id, isAuthenticated]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      setReviewError('Debes iniciar sesión para escribir un review.');
      return;
    }

    if (!reviewText.trim()) {
      setReviewError('El review no puede estar vacío.');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/media/${movie.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mediaType: movie.media_type, reviewText: reviewText.trim() }),
      });

      if (response.ok) {
        setMyReview(reviewText.trim());
        setShowReviewForm(false);
        setReviewError('');
        fetchAllReviews();
      } else {
        const errorData = await response.json();
        setReviewError(errorData.error || 'Error al guardar el review.');
      }
    } catch (error) {
      setReviewError('Error al guardar el review.');
      console.error('Error submitting review:', error);
    }
  };

  const handleStarClick = async (score) => {
    if (!isAuthenticated) {
      setRatingError('Debes iniciar sesión para calificar una película.');
      return;
    }
    setRatingError('');
    setUserRating(score);
    await onRateMovie(movie.id, movie.media_type, score);
    if (!isWatched) {
      setIsWatched(true);
    }
    if (onMovieRated) {
      onMovieRated(movie.id);
    }
    if (isWatchlisted) {
      await onToggleWatchlist(movie.id, movie.media_type, false);
      setIsWatchlisted(false);
    }
  };

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      setLikeError("Debes iniciar sesión para dar 'Me gusta'.");
      return;
    }
    setLikeError('');
    setIsLiked(!isLiked);
    await onToggleLike(movie.id, movie.media_type, !isLiked);
  };

  const handleWatchlistClick = async () => {
    if (!isAuthenticated) {
      setWatchlistError("Debes iniciar sesión para añadir a la Watchlist.");
      return;
    }
    setWatchlistError('');
    setIsWatchlisted(!isWatchlisted);
    await onToggleWatchlist(movie.id, movie.media_type, !isWatchlisted);
  };

  const handleWatchedClick = async () => {
    if (!isAuthenticated) {
      setWatchedError("Debes iniciar sesión para marcar una película como vista.");
      return;
    }
    setWatchedError('');
    const newWatchedStatus = !isWatched;
    setIsWatched(newWatchedStatus);

    if (!newWatchedStatus && userRating > 0) {
      setUserRating(0);
      await onRateMovie(movie.id, movie.media_type, 0);
    }

    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:3000/api/media/${movie.id}/watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mediaType: movie.media_type, watched: newWatchedStatus }),
      });
    } catch (error) {
      console.error('Error updating watched status:', error);
      setIsWatched(!newWatchedStatus);
      if (!newWatchedStatus && userRating > 0) {
         fetchUserRating();
      }
    }
  };

  // Función para obtener la URL de la imagen de perfil
  const getProfileImageUrl = (profilePicture) => {
    console.log('🖼️ ProfilePicture recibida:', profilePicture);
    
    if (!profilePicture) {
      console.log('❌ No hay profilePicture, usando placeholder');
      return '/placeholder-profile.svg';
    }
    
    // Si la URL ya es completa (empieza con http:// o https://)
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      console.log('✅ URL completa:', profilePicture);
      return profilePicture;
    }
    
    // Si es una ruta relativa, agregar el dominio del backend
    const fullUrl = `http://localhost:3000${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
    console.log('🔗 URL construida:', fullUrl);
    return fullUrl;
  };

  const backdropUrl = movie.backdrop_path
    ? `${IMAGE_BASE_URL}/w1280${movie.backdrop_path}`
    : '/placeholder-image.svg';

  const runtime = getRuntime();
  const releaseDate = getReleaseDate();

  return (
    <div className="modal-backdrop-dark" onClick={onClose}>
      {movieList && onNavigate && (
        <>
          <button 
            className="modal-nav-button prev" 
            onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }} 
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={48} />
          </button>
          <button 
            className="modal-nav-button next" 
            onClick={(e) => { e.stopPropagation(); onNavigate('next'); }} 
            disabled={currentIndex === movieList.length - 1}
          >
            <ChevronRight size={48} />
          </button>
        </>
      )}

      <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'transparent' }}>
        <div className="modal-dialog modal-dialog-centered modal-xl modal-custom-width" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content modal-content-custom" style={{ position: 'relative' }}>
            <button onClick={onClose} className="modal-close-button" aria-label="Cerrar">
              <X size={24} />
            </button>
            <div className="modal-body p-0">
              <img src={backdropUrl} alt="" className="img-fluid movie-backdrop w-100" />
              <div className="p-4">
                <h2 className="fw-bold">{getTitle()}</h2>
                {getOriginalTitle() && getOriginalTitle() !== getTitle() && <p className="fst-italic">{getOriginalTitle()}</p>}
                <div className="d-flex align-items-center gap-3 mt-2">
                  <div className="d-flex align-items-center gap-1">
                    <Star color="#ffc107" size={16} />
                    <span>{movie.vote_average?.toFixed(1)}</span>
                  </div>
                  {releaseDate && <span>{releaseDate.split('-')[0]}</span>}
                  {runtime && <span>{`${Math.floor(runtime / 60)}h ${runtime % 60}m`}</span>}
                  {movie.number_of_seasons && <span>{movie.number_of_seasons} temporada{movie.number_of_seasons !== 1 ? 's' : ''}</span>}
                </div>
                {movie.genres && movie.genres.length > 0 && <p>{movie.genres.map(g => g.name).join(', ')}</p>}
                <p className="mt-3">{movie.overview || 'No hay sinopsis disponible.'}</p>
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
                              fill={isFull ? "#ffc107" : (isHalf ? "#ffeb3b" : "none")}
                              size={24}
                            />
                          </div>
                        );
                      })}
                      {userRating > 0 && <span className="ms-2">({userRating} estrellas)</span>}
                    </div>
                    {ratingError && <div className="text-danger mt-2">{ratingError}</div>}
                  </div>
                  <div className="ms-auto d-flex align-items-center gap-3">
                    <img
                      src={isWatched ? "/eye-fill.svg" : "/eye.svg"}
                      alt="Watched"
                      width="28"
                      height="28"
                      onClick={handleWatchedClick}
                      style={{ cursor: isAuthenticated ? 'pointer' : 'not-allowed' }}
                    />
                    <Heart
                      size={28}
                      color={isLiked ? "#e74c3c" : "#e4e5e9"}
                      fill={isLiked ? "#e74c3c" : "none"}
                      onClick={handleLikeClick}
                      style={{ cursor: isAuthenticated ? 'pointer' : 'not-allowed' }}
                    />
                    <img
                      src={isWatchlisted ? "/bookmark-fill.png" : "/bookmark.png"}
                      alt="Watchlist"
                      width="28"
                      height="28"
                      onClick={handleWatchlistClick}
                      style={{ cursor: isAuthenticated ? 'pointer' : 'not-allowed' }}
                    />
                  </div>
                  {likeError && <div className="text-danger mt-2">{likeError}</div>}
                  {watchlistError && <div className="text-danger mt-2">{watchlistError}</div>}
                  {watchedError && <div className="text-danger mt-2">{watchedError}</div>}
                </div>
                <div className="mt-4">
                  {movie.director && (
                    <p>
                      <strong>Director:</strong>{' '}
                      <a 
                        href={`/person/${movie.director.id}/director`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#0d6efd', textDecoration: 'none' }}
                      >
                        {movie.director.name}
                      </a>
                    </p>
                  )}
                  {movie.production_countries && movie.production_countries.length > 0 && <p><strong>País:</strong> {movie.production_countries.map(c => c.name).join(', ')}</p>}
                  {movie.cast && movie.cast.length > 0 && (
                    <div>
                      <strong>Reparto:</strong>
                      <div className="d-flex flex-wrap gap-3 mt-2">
                        {movie.cast.slice(0, 6).map(actor => (
                          <div key={actor.id} className="text-center">
                            <a 
                              href={`/person/${actor.id}/actor`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <img 
                                src={actor.profile_path ? `${IMAGE_BASE_URL}/w185${actor.profile_path}` : '/placeholder-profile.svg'}
                                alt={actor.name}
                                className="rounded-circle" 
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
                              />
                              <p className="mb-0 mt-1">{actor.name}</p>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-5">
                  <hr className="border-secondary mb-4" />
                  <h4 className="mb-3">Reviews</h4>
                  {isAuthenticated && (
                    <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#1e2328' }}>
                      <h6 className="mb-2">Tu Review</h6>
                      {!showReviewForm && !myReview ? (
                        <button className="btn btn-sm btn-outline-light" onClick={() => setShowReviewForm(true)}>Escribir Review</button>
                      ) : !showReviewForm && myReview ? (
                        <div>
                          <p className="mb-2">{myReview}</p>
                          <button className="btn btn-sm btn-outline-light" onClick={() => setShowReviewForm(true)}>Editar Review</button>
                        </div>
                      ) : (
                        <div>
                          <textarea
                            className="form-control mb-2"
                            rows="4"
                            placeholder="Escribe tu review aquí..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            style={{ backgroundColor: '#2c3440', color: '#fff', border: '1px solid #454d5d' }}
                          />
                          {reviewError && <div className="text-danger mb-2">{reviewError}</div>}
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary" onClick={handleSubmitReview}>Guardar Review</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => { setShowReviewForm(false); setReviewText(myReview); setReviewError(''); }}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <h6 className="mb-3">Reviews de la comunidad ({allReviews.length})</h6>
                    {allReviews.length === 0 ? (
                      <p className="text-muted">Aún no hay reviews para esta película.</p>
                    ) : (
                      <div className="reviews-list">
                        {allReviews.map((review) => (
                          <div key={review.id} className="review-item p-3 mb-3 border rounded" style={{ backgroundColor: '#1e2328' }}>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-center">
                                <img
                                  src={review.user.profilePicture ? `http://localhost:3000${review.user.profilePicture}?t=${new Date().getTime()}` : '/placeholder-profile.svg'}
                                  alt={`${review.user.username} profile`}
                                  className="rounded-circle me-2" 
                                  style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/placeholder-profile.svg';
                                  }}
                                />
                                <strong className="text-light">{review.user.username}</strong>
                                <div className="d-flex align-items-center gap-2 ms-3">
                                  {review.rating && <span className="badge bg-warning text-dark">⭐ {review.rating.toFixed(1)}</span>}
                                  {review.hasLiked && <span className="badge bg-danger">❤️ Le gustó</span>}
                                </div>
                              </div>
                              <small className="text-muted">{new Date(review.createdAt).toLocaleDateString('es-ES')}</small>
                            </div>
                            <p className="mb-0 text-light">{review.reviewText}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;