import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { User as UserIcon, Camera, Film, Heart, Eye, List as ListIcon, Star, Plus, Trash2, BarChart3, Bookmark, X, Save, Edit } from 'lucide-react';
import MovieDetailsModal from '../components/MovieDetailsModal';
import PaginatedMovieGrid from '../components/PaginatedMovieGrid';
import RatingDistributionChart from '../components/RatingDistributionChart';
import { getApiUrl } from '../config/api';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const ProfilePage = ({ getMovieDetails, selectedMovie, onCloseDetails, isAuthenticated, onRateMovie, onToggleLike, onToggleWatchlist, movieList, currentIndex, onNavigate }) => {
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [slogan, setSlogan] = useState('');
  const [newSlogan, setNewSlogan] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userLists, setUserLists] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [topDirectors, setTopDirectors] = useState([]);
  const [topActors, setTopActors] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stats, setStats] = useState({ watched: 0, likes: 0, reviews: 0, watchlist: 0 });
  const loggedInUserId = localStorage.getItem('userId');
  const isOwnProfile = !paramUserId || paramUserId === loggedInUserId;
  const userIdToFetch = isOwnProfile ? loggedInUserId : paramUserId;

  useEffect(() => {
    if (location.hash === '#delete-account') {
      setIsDeleteModalOpen(true);
    }
  }, [location]);

  useEffect(() => {
    if (!isAuthenticated && isOwnProfile) {
      navigate('/login');
      return;
    }
    fetchProfileData();
  }, [isAuthenticated, userIdToFetch, navigate, location]);
  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!userIdToFetch || isNaN(Number(userIdToFetch))) {
      setError('ID de usuario inválido.');
      setLoading(false);
      return;
    }
    try {
      const userRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}`));
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsername(userData.username);
        setSlogan(userData.slogan || '');
        setProfilePicture(userData.profilePicture ? getApiUrl(userData.profilePicture) : null);
      } else if (userRes.status === 401 || userRes.status === 403) handleAuthError();
      const ratingsRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/ratings-with-scores`), { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (ratingsRes.ok) {
        const data = await ratingsRes.json();
        setUserRatings(data.ratings || []);
        setStats(prev => ({ ...prev, watched: data.ratings?.length || 0 }));
      } else if (ratingsRes.status === 401 || ratingsRes.status === 403) handleAuthError();
      const likesStatsRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/likes`), { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (likesStatsRes.ok) {
        const data = await likesStatsRes.json();
        setStats(prev => ({ ...prev, likes: data.likedItems?.length || 0 }));
      }
      const watchlistStatsRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/watchlist`), { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (watchlistStatsRes.ok) {
        const data = await watchlistStatsRes.json();
        setStats(prev => ({ ...prev, watchlist: data.watchlistedMovies?.length || 0 }));
      }
      const listsRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/lists`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (listsRes.ok) {
        const data = await listsRes.json();
        const lists = data.lists || [];
        const detailedLists = await Promise.all(
          lists.map(async (list) => {
            try {
              const listDetailRes = await fetch(getApiUrl(`/api/lists/${list.id}`), {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (listDetailRes.ok) {
                const ld = await listDetailRes.json();
                const listData = ld.list || ld;
                const moviesFromDetail = listData.items || [];
                
                // Fetch full movie details for each item
                const moviesWithDetails = await Promise.all(
                  moviesFromDetail.map(async (item) => {
                    try {
                      const movieRes = await fetch(`${BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`);
                      const movieDetail = await movieRes.json();
                      return {
                        ...movieDetail,
                        id: item.mediaId,
                        mediaType: item.mediaType,
                        order: item.order,
                        poster_path: movieDetail.poster_path
                      };
                    } catch (err) {
                      return {
                        id: item.mediaId,
                        mediaType: item.mediaType,
                        order: item.order,
                        poster_path: null
                      };
                    }
                  })
                );
                
                return {
                  ...list,
                  ...listData,
                  movies: moviesWithDetails,
                  movieCount: moviesWithDetails.length,
                };
              }
            } catch (err) { }
            return {
              ...list,
              movies: list.items || [],
              movieCount: list.items?.length || 0,
            };
          })
        );
        setUserLists(detailedLists);
        setStats(prev => ({ ...prev, reviews: detailedLists.length || 0 }));
      } else if (listsRes.status === 401 || listsRes.status === 403) handleAuthError();
      const likesRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/likes`), { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const watchedRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/watched`), { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });

      let likedItems = [];
      if (likesRes.ok) {
        const likesData = await likesRes.json();
        likedItems = likesData.likedItems || [];
      }

      let watchedItems = [];
      if (watchedRes.ok) {
        const watchedData = await watchedRes.json();
        watchedItems = watchedData.watchedMovies || [];
      }

      const topMoviesRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/top-movies`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (topMoviesRes.ok) {
        const data = await topMoviesRes.json();
        const detailedTopMoviesPromises = data.topMovies?.map(async (item) => {
          try {
            const detailRes = await fetch(`${BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`);
            const detail = await detailRes.json();
            
            const userRating = userRatings.find(r => r.mediaId === item.mediaId);
            const isLiked = likedItems.some(l => l.mediaId === item.mediaId);
            const isWatched = watchedItems.some(w => w.mediaId === item.mediaId);

            return { 
              ...detail, 
              mediaType: item.mediaType, 
              order: item.order,
              userScore: userRating ? userRating.score : null,
              isLiked: isLiked,
              isWatched: isWatched
            };
          } catch (error) { return null; }
        }) || [];
        const movies = (await Promise.all(detailedTopMoviesPromises)).filter(movie => movie !== null);
        movies.sort((a, b) => a.order - b.order);
        setTopMovies(movies);
      } else if (topMoviesRes.status === 401 || topMoviesRes.status === 403) handleAuthError();
      const topDirectorsRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/top-directors`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (topDirectorsRes.ok) {
        const data = await topDirectorsRes.json();
        const detailedTopDirectorsPromises = data.topDirectors?.map(async (item) => {
          try {
            const detailRes = await fetch(`${BASE_URL}/person/${item.personId}?api_key=${API_KEY}&language=es-MX`);
            const detail = await detailRes.json();
            return { ...detail, order: item.order };
          } catch (error) { return null; }
        }) || [];
        const directors = (await Promise.all(detailedTopDirectorsPromises)).filter(director => director !== null);
        directors.sort((a, b) => a.order - b.order);
        setTopDirectors(directors);
      } else if (topDirectorsRes.status === 401 || topDirectorsRes.status === 403) handleAuthError();
      const topActorsRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/top-actors`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (topActorsRes.ok) {
        const data = await topActorsRes.json();
        const normalizedActors = data.map(actor => ({
          ...actor,
          id: actor.actorId,
        }));
        normalizedActors.sort((a, b) => a.order - b.order);
        setTopActors(normalizedActors);
      } else if (topActorsRes.status === 401 || topActorsRes.status === 403) handleAuthError();
      const reviewsRes = await fetch(getApiUrl(`/api/users/${userIdToFetch}/reviews`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        const reviewsWithMovieDetails = await Promise.all(
          (data.reviews || []).map(async (review) => {
            try {
              const detailRes = await fetch(`${BASE_URL}/${review.mediaType}/${review.mediaId}?api_key=${API_KEY}&language=es-MX`);
              const detail = await detailRes.json();
              return {
                ...review,
                movieDetails: detail,
                comment: review.comment ?? review.reviewText ?? review.content ?? '',
                hasLiked: review.hasLiked ?? review.liked ?? review.userLiked ?? false,
                rating: review.rating ?? review.score ?? null,
              };
            } catch (error) {
              return {
                ...review,
                comment: review.comment ?? review.reviewText ?? review.content ?? '',
                hasLiked: review.hasLiked ?? review.liked ?? review.userLiked ?? false,
                rating: review.rating ?? review.score ?? null,
              };
            }
          })
        );
        setReviews(reviewsWithMovieDetails);
      } else if (reviewsRes.status === 401 || reviewsRes.status === 403) handleAuthError();
    } catch (err) {
      setError('Error al cargar los datos del perfil.');
    } finally {
      setLoading(false);
    }
  };
  const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login');
    setError('Tu sesión ha expirado o no es válida. Por favor, inicia sesión de nuevo.');
  };
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setProfilePicturePreview(null);
    }
  };
  const handleSaveProfilePicture = async () => {
    if (!selectedFile) {
      alert('Por favor, selecciona una imagen primero.');
      return;
    }
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePicture', selectedFile);
    try {
      const response = await fetch(getApiUrl(`api/users/profile-picture`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setProfilePicture(getApiUrl(data.profilePicture));
        setProfilePicturePreview(null);
        setSelectedFile(null);
        alert('Foto de perfil actualizada exitosamente.');
      } else if (response.status === 401 || response.status === 403) handleAuthError();
      else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al actualizar la foto de perfil.');
      }
    } catch (err) {
      setError('Error de red al actualizar la foto de perfil.');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteProfilePicture = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/users/profile-picture`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profilePicture: null })
      });
      if (response.ok) {
        setProfilePicture(null);
        setProfilePicturePreview(null);
        setSelectedFile(null);
        alert('Foto de perfil eliminada exitosamente.');
      } else if (response.status === 401 || response.status === 403) handleAuthError();
      else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar la foto de perfil.');
      }
    } catch (err) {
      setError('Error de red al eliminar la foto de perfil.');
    } finally {
      setLoading(false);
    }
  };
  const handleSaveProfile = async () => {
    if (!newUsername.trim()) {
      alert('El nombre de usuario no puede estar vacío.');
      return;
    }
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/users/profile`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: newUsername, slogan: newSlogan }),
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.user.username);
        setSlogan(data.user.slogan);
        setIsEditingUsername(false);
        localStorage.setItem('username', data.user.username);
      } else if (response.status === 401 || response.status === 403) handleAuthError();
      else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al actualizar el perfil.');
      }
    } catch (err) {
      setError('Error de red al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveTopMovie = async (mediaId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/users/top-movies/${mediaId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setTopMovies(topMovies.filter(movie => movie.id !== mediaId));
        alert('Película eliminada del Top 10 exitosamente.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar la película.');
      }
    } catch (err) {
      setError('Error de red al eliminar la película.');
    }
  };
  const handleRemoveTopDirector = async (personId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/users/top-directors/${personId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setTopDirectors(topDirectors.filter(director => director.id !== personId));
        alert('Director eliminado del Top 10 exitosamente.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar el director.');
      }
    } catch (err) {
      setError('Error de red al eliminar el director.');
    }
  };
  const handleRemoveTopActor = async (actorId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/user/top-actors/${actorId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setTopActors(topActors.filter(actor => actor.id !== actorId));
        alert('Actor eliminado del Top 10 exitosamente.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar el actor.');
      }
    } catch (err) {
      setError('Error de red al eliminar el actor.');
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      handleAuthError();
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/users/${loggedInUserId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Tu cuenta ha sido eliminada exitosamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        navigate('/register');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar la cuenta.');
      }
    } catch (err) {
      setError('Error de red al eliminar la cuenta.');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) return <div className="container mt-5 text-center">Cargando perfil...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;
  return (
    <div className="container my-5">
      <div className="row">
        {/* --- Columna izquierda --- */}
        <div className="col-md-4 mb-5">
          <div className="sticky-top" style={{ top: '20px', zIndex: 999 }}>
            {/* --- Info usuario --- */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block mb-3">
                <img 
                  src={profilePicturePreview || profilePicture || '/placeholder-profile.svg'}
                  alt="Profile" 
                  className="rounded-circle" 
                  style={{ width: '150px', height: '150px', objectFit: 'cover', border: '3px solid #454d5d', cursor: 'pointer' }}
                  onClick={() => isOwnProfile && setIsProfilePictureModalOpen(true)}
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }}
                />
              </div>
              {isOwnProfile && (
                <div className="d-flex justify-content-center gap-2 mb-3">
                  <button className="btn btn-sm btn-outline-light" onClick={() => fileInputRef.current.click()} title="Cambiar foto de perfil">
                    <Camera size={16} />
                  </button>
                  {(profilePicture || profilePicturePreview) && (
                    <button className="btn btn-sm btn-outline-danger" onClick={handleDeleteProfilePicture} title="Eliminar foto de perfil">
                      <Trash2 size={16} />
                    </button>
                  )}
                  {selectedFile && (
                    <button className="btn btn-sm btn-primary" onClick={handleSaveProfilePicture} title="Guardar foto de perfil">
                      <Save size={16} />
                    </button>
                  )}
                </div>
              )}
              {isEditingUsername ? (
                <div className="w-100">
                  <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nombre de usuario"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                  </div>
                  <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Eslogan..."
                      value={newSlogan}
                      onChange={(e) => setNewSlogan(e.target.value)}
                    />
                  </div>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <button className="btn btn-sm btn-primary" onClick={handleSaveProfile}>Guardar</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setIsEditingUsername(false)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <h1 className="fw-bold text-light mb-0">{username}</h1>
                    {isOwnProfile && (
                      <button className="btn btn-sm btn-outline-light" onClick={() => { setIsEditingUsername(true); setNewUsername(username); setNewSlogan(slogan); }}>
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  {slogan && <p className="text-muted mt-2">{slogan}</p>}
                </div>
              )}
            </div>
            {/* --- Stats principales --- */}
            <div className="p-4 rounded mb-4" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
              <div className="row text-center">
                <div className="col-3">
                  <div className="d-flex flex-column align-items-center">
                    <Film size={20} className="text-success mb-1" />
                    <h5 className="fw-bold mb-0 text-light">{stats.watched}</h5>
                    <small className="text-muted">DIARY</small>
                  </div>
                </div>
                <div className="col-3">
                  <div className="d-flex flex-column align-items-center">
                    <Heart size={20} className="text-danger mb-1" />
                    <h5 className="fw-bold mb-0 text-light">{stats.likes}</h5>
                    <small className="text-muted">LIKES</small>
                  </div>
                </div>
                <div className="col-3">
                  <div className="d-flex flex-column align-items-center">
                    <Bookmark size={20} className="text-primary mb-1" />
                    <h5 className="fw-bold mb-0 text-light">{stats.watchlist}</h5>
                    <small className="text-muted">WATCHLIST</small>
                  </div>
                </div>
                <div className="col-3">
                  <div className="d-flex flex-column align-items-center">
                    <ListIcon size={20} className="text-info mb-1" />
                    <h5 className="fw-bold mb-0 text-light">{userLists.length}</h5>
                    <small className="text-muted">LISTS</small>
                  </div>
                </div>
              </div>
            </div>
            {/* --- Gráfico distribución --- */}
            <div className="p-4 rounded" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
              <h5 className="text-light mb-3">DISTRIBUCIÓN</h5>
              <RatingDistributionChart ratings={userRatings} />
            </div>
          </div>
        </div>
        {/* --- Columna derecha --- */}
        <div className="col-md-8">
          {/* --- Top 10 películas --- */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0 text-light">Top 10 Mejores Películas</h2>
            {isOwnProfile && (
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/top-movies-editor')}
              >
                <Plus size={16} className="me-1" />
                Gestionar Top 10
              </button>
            )}
          </div>
          <div className="p-4 rounded mb-5" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
            {topMovies.length > 0 ? (
              <div className="row g-3">
                {topMovies.map((movie, index) => (
                  <div key={movie.id} className="col-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="position-relative">
                      <div 
                        className="movie-card position-relative"
                        onClick={() => {
                          const userRating = userRatings.find(rating => 
                            rating.mediaId === movie.id && rating.mediaType === movie.mediaType
                          );
                          const userScore = userRating ? userRating.score : null;
                          getMovieDetails(movie.id, movie.mediaType, userScore, topMovies, index);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="poster-container">
                          <img
                            src={movie.poster_path ? `${IMAGE_BASE_URL}/w342${movie.poster_path}` : '/placeholder-poster.svg'}
                            alt={movie.title || movie.name}
                          />
                        </div>
                        <div className="position-absolute top-0 start-0 bg-dark text-white px-2 py-1 rounded-end">
                          #{index + 1}
                        </div>
                      </div>
                      {isOwnProfile && (
                        <button
                          className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 mt-1 me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTopMovie(movie.id);
                          }}
                          style={{ padding: '2px 6px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted mb-3">Aún no has agregado películas a tu Top 10.</p>
                {isOwnProfile && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/top-movies-editor')}
                  >
                    <Plus size={16} className="me-1" />
                    Crear Mi Top 10
                  </button>
                )}
              </div>
            )}
          </div>
          {/* --- Top 10 directores --- */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0 text-light">Top 10 Mejores Directores</h2>
            {isOwnProfile && (
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/top-directors-editor')}
              >
                <Plus size={16} className="me-1" />
                Gestionar Top 10
              </button>
            )}
          </div>
          <div className="p-4 rounded mb-5" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
            {topDirectors.length > 0 ? (
              <div className="row g-3">
                {topDirectors.map((director, index) => (
                  <div key={director.id} className="col-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="position-relative">
                      <div 
                        className="director-card position-relative text-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/person/${director.id}/director`)}
                      >
                        <img
                          src={director.profile_path ? `${IMAGE_BASE_URL}/w342${director.profile_path}` : '/placeholder-profile.svg'}
                          alt={director.name}
                          className="img-fluid rounded-circle"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                        <div className="position-absolute top-0 start-50 translate-middle-x bg-dark text-white px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </div>
                      {isOwnProfile && (
                        <button
                          className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 mt-1 me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTopDirector(director.id);
                          }}
                          style={{ padding: '2px 6px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-light small mt-2 mb-0 text-center">
                      {director.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted mb-3">Aún no has agregado directores a tu Top 10.</p>
                {isOwnProfile && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/top-directors-editor')}
                  >
                    <Plus size={16} className="me-1" />
                    Crear Mi Top 10
                  </button>
                )}
              </div>
            )}
          </div>
          {/* --- Top 10 actores --- */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0 text-light">Top 10 Mejores Actores/Actrices</h2>
            {isOwnProfile && (
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/top-actors-editor')}
              >
                <Plus size={16} className="me-1" />
                Gestionar Top 10
              </button>
            )}
          </div>
          <div className="p-4 rounded mb-5" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
            {topActors.length > 0 ? (
              <div className="row g-3">
                {topActors.map((actor, index) => (
                  <div key={actor.id} className="col-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="position-relative">
                      <div 
                        className="actor-card position-relative text-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/person/${actor.id}/actor`)}
                      >
                        <img
                          src={actor.profile_path ? `${IMAGE_BASE_URL}/w342${actor.profile_path}` : '/placeholder-profile.svg'}
                          alt={actor.name}
                          className="img-fluid rounded-circle"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                        <div className="position-absolute top-0 start-50 translate-middle-x bg-dark text-white px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </div>
                      {isOwnProfile && (
                        <button
                          className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 mt-1 me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTopActor(actor.id);
                          }}
                          style={{ padding: '2px 6px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-light small mt-2 mb-0 text-center">
                      {actor.name}
                    </p>
                    <p className="text-muted small text-center">
                      {actor.known_for_department}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted mb-3">Aún no has agregado actores/actrices a tu Top 10.</p>
                {isOwnProfile && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/top-actors-editor')}
                  >
                    <Plus size={16} className="me-1" />
                    Crear Mi Top 10
                  </button>
                )}
              </div>
            )}
          </div>
          {/* --- Reviews --- */}
          <h2 className="fw-bold mb-4 text-light">Reviews</h2>
          <div className="mb-5">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="p-4 rounded mb-4" style={{ backgroundColor: "#1e2328", border: "1px solid #454d5d" }}>
                  <div className="row">
                    <div className="col-md-2">
                      <div className="poster-container">
                        <img
                          src={review.movieDetails?.poster_path ? `${IMAGE_BASE_URL}/w342${review.movieDetails.poster_path}` : "/placeholder-poster.svg"}
                          alt={review.movieDetails?.title || review.movieDetails?.name}
                          className="img-fluid rounded"
                        />
                      </div>
                    </div>
                    <div className="col-md-10">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="text-light mb-0">{review.movieDetails?.title || review.movieDetails?.name}</h5>
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-flex align-items-center">
                            <Star size={16} className="text-warning me-1" />
                            <span className="text-light fw-bold">{review.rating}</span>
                          </div>
                          {review.hasLiked && (
                            <Heart size={16} className="text-danger" fill="currentColor" />
                          )}
                        </div>
                      </div>
                      <p className="text-light">{review.comment}</p>
                      <small className="text-muted">{new Date(review.createdAt).toLocaleDateString("es-MX")}</small>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted">Aún no has escrito ninguna review.</p>
              </div>
            )}
          </div>
          {/* --- Listas --- */}
          <h2 className="fw-bold mb-4 text-light">Mis Listas</h2>
          <div className="mb-5">
            {userLists.length > 0 ? (
              <div className="row g-3">
                {userLists.map(list => (
                  <div key={list.id} className="col-md-6 col-lg-4">
                    <div 
                      className="p-3 rounded h-100"
                      style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d', cursor: 'pointer' }}
                      onClick={() => navigate(`/lista/${list.id}`)}
                    >
                      <h6 className="text-light mb-2">{list.name}</h6>
                      <p className="text-muted small mb-2">{list.description}</p>
                      <div className="d-flex align-items-center mb-2">
                        <Film size={16} className="text-muted me-1" />
                        <small className="text-muted">
                          {
                            typeof list.movieCount === 'number'
                              ? list.movieCount
                              : (list.movies?.length || 0)
                          } películas
                        </small>
                      </div>
                      {list.movies && list.movies.length > 0 && (
                      <div className="d-flex gap-1 mb-2 overflow-hidden" style={{ height: '60px' }}>
                      {list.movies.slice(0, 3).map((movie, index) => (
                      <div key={movie.id} className="position-relative" style={{ height: '100%', width: 'auto' }}>
                      <img
                      src={movie.poster_path ? `${IMAGE_BASE_URL}/w92${movie.poster_path}` : "/placeholder-poster.svg"}
                      alt={movie.title}
                      className="rounded"
                      style={{ height: '100%', width: 'auto' }}
                      />
                      {list.isNumbered && (
                      <div className="position-absolute top-0 start-0 bg-dark text-white px-1 py-0 rounded" style={{ fontSize: '10px', fontWeight: 'bold' }}>
                      #{movie.order || index + 1}
                      </div>
                      )}
                      </div>
                      ))}
                      {list.movies.length > 3 && (
                      <div className="d-flex align-items-center justify-content-center rounded bg-dark" 
                      style={{ height: '100%', width: '40px' }}>
                      <small className="text-muted">+{list.movies.length - 3}</small>
                      </div>
                      )}
                      </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {new Date(list.createdAt).toLocaleDateString('es-MX')}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted">Aún no has creado ninguna lista.</p>
                {isOwnProfile && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/list-creator')}
                  >
                    <Plus size={16} className="me-1" />
                    Crear Mi Primera Lista
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de detalles de película */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={onCloseDetails}
          onRateMovie={onRateMovie}
          onToggleLike={onToggleLike}
          onToggleWatchlist={onToggleWatchlist}
          movieList={movieList}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
        />
      )}
      {/* Modal para cambiar foto de perfil */}
      {isProfilePictureModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
              <div className="modal-header">
                <h5 className="modal-title text-light">Cambiar Foto de Perfil</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsProfilePictureModalOpen(false)}></button>
              </div>
              <div className="modal-body text-center">
                <img 
                  src={profilePicturePreview || profilePicture || '/placeholder-profile.svg'}
                  alt="Profile Preview" 
                  className="rounded-circle mb-3"
                  style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="form-control mb-3" 
                  onChange={handleFileChange}
                />
                <div className="d-flex justify-content-center gap-2">
                  <button 
                    className="btn btn-primary"
                    onClick={handleSaveProfilePicture}
                    disabled={!selectedFile}
                  >
                    Guardar
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setIsProfilePictureModalOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5 className="modal-title">Eliminar Cuenta</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsDeleteModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>Eliminar Cuenta</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;