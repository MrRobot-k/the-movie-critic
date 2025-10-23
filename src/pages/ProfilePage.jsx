import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { User as UserIcon, Camera, Film, Heart, Eye, List as ListIcon, Star, Plus, Trash2, BarChart3, Bookmark, X, Save, Edit } from 'lucide-react';
import MovieDetailsModal from '../components/MovieDetailsModal';
import PaginatedMovieGrid from '../components/PaginatedMovieGrid';
import RatingDistributionChart from '../components/RatingDistributionChart';
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
  const [stats, setStats] = useState({ watched: 0, likes: 0, reviews: 0, watchlist: 0 });
  const loggedInUserId = localStorage.getItem('userId');
  const isOwnProfile = !paramUserId || paramUserId === loggedInUserId;
  const userIdToFetch = isOwnProfile ? loggedInUserId : paramUserId;
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
      // Fetch user profile
      const userRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}`, { headers: { 'Authorization': `Bearer ${token}` }, });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsername(userData.username);
        setSlogan(userData.slogan || '');
        setProfilePicture(userData.profilePicture ? `http://localhost:3000${userData.profilePicture}` : null);
      } else if (userRes.status === 401 || userRes.status === 403) handleAuthError();
      // Fetch user ratings para el gráfico
      const ratingsRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}/watched`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (ratingsRes.ok) {
        const data = await ratingsRes.json();
        setUserRatings(data.watchedMovies || []);
        setStats(prev => ({ ...prev, watched: data.watchedMovies.length }));
      } else if (ratingsRes.status === 401 || ratingsRes.status === 403) handleAuthError();
      const likesStatsRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}/likes`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (likesStatsRes.ok) {
        const data = await likesStatsRes.json();
        setStats(prev => ({ ...prev, likes: data.likedItems.length }));
      }

      const watchlistStatsRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}/watchlist`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (watchlistStatsRes.ok) {
        const data = await watchlistStatsRes.json();
        setStats(prev => ({ ...prev, watchlist: data.watchlistedMovies.length }));
      }

      // Fetch user lists
      const listsRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}/lists`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (listsRes.ok) {
        const data = await listsRes.json();
        setUserLists(data.lists);
      } else if (listsRes.status === 401 || listsRes.status === 403) handleAuthError();
      // Fetch user top movies
      const topMoviesRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}/top-movies`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (topMoviesRes.ok) {
        const data = await topMoviesRes.json();
        const detailedTopMoviesPromises = data.topMovies.map(async (item) => {
          const detailRes = await fetch(`${BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`);
          const detail = await detailRes.json();
          return { ...detail, mediaType: item.mediaType, order: item.order };
        });
        const movies = await Promise.all(detailedTopMoviesPromises);
        movies.sort((a, b) => a.order - b.order);
        setTopMovies(movies);
      } else if (topMoviesRes.status === 401 || topMoviesRes.status === 403) handleAuthError();
      // Fetch user top directors
      const topDirectorsRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}/top-directors`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (topDirectorsRes.ok) {
        const data = await topDirectorsRes.json();
        const detailedTopDirectorsPromises = data.topDirectors.map(async (item) => {
          const detailRes = await fetch(`${BASE_URL}/person/${item.personId}?api_key=${API_KEY}&language=es-MX`);
          const detail = await detailRes.json();
          return { ...detail, order: item.order };
        });
        const directors = await Promise.all(detailedTopDirectorsPromises);
        directors.sort((a, b) => a.order - b.order);
        setTopDirectors(directors);
      } else if (topDirectorsRes.status === 401 || topDirectorsRes.status === 403) handleAuthError();
      // Fetch user top actors
      const topActorsRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}/top-actors`, {
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

      // Fetch user reviews
      const reviewsRes = await fetch(`http://localhost:3000/api/users/${userIdToFetch}/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        
        const reviewsWithMovieDetails = await Promise.all(data.reviews.map(async (review) => {
          const detailRes = await fetch(`${BASE_URL}/${review.mediaType}/${review.mediaId}?api_key=${API_KEY}&language=es-MX`);
          const detail = await detailRes.json();
          return { ...review, movieDetails: detail };
        }));

        setReviews(reviewsWithMovieDetails);
      } else if (reviewsRes.status === 401 || reviewsRes.status === 403) {
        handleAuthError();
      }

    } catch (err) {
      console.error('Error fetching profile data:', err);
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
      const response = await fetch(`http://localhost:3000/api/users/profile-picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setProfilePicture(`http://localhost:3000${data.profilePicture}`);
        setProfilePicturePreview(null);
        setSelectedFile(null);
        alert('Foto de perfil actualizada exitosamente.');
      } else if (response.status === 401 || response.status === 403) {
        handleAuthError();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al actualizar la foto de perfil.');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
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
      const response = await fetch(`http://localhost:3000/api/users/profile-picture`, {
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
      } else if (response.status === 401 || response.status === 403) {
        handleAuthError();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar la foto de perfil.');
      }
    } catch (err) {
      console.error('Error deleting profile picture:', err);
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
      const response = await fetch(`http://localhost:3000/api/users/profile`, {
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
      } else if (response.status === 401 || response.status === 403) {
        handleAuthError();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al actualizar el perfil.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Error de red al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTopMovie = async (mediaId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/users/top-movies/${mediaId}`, {
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
      console.error('Error removing top movie:', err);
      setError('Error de red al eliminar la película.');
    }
  };
  const handleRemoveTopDirector = async (personId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/users/top-directors/${personId}`, {
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
      console.error('Error removing top director:', err);
      setError('Error de red al eliminar el director.');
    }
  };
  const handleRemoveTopActor = async (actorId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/user/top-actors/${actorId}`, {
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
      console.error('Error removing top actor:', err);
      setError('Error de red al eliminar el actor.');
    }
  };
  if (loading) return <div className="container mt-5 text-center">Cargando perfil...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  const ratingStats = {};

  return (
    <div className="container my-5">
      <div className="row">
        {/* Columna izquierda - Información del usuario y estadísticas */}
        <div className="col-md-4 mb-5">
          <div className="sticky-top" style={{ top: '20px', zIndex: 999 }}>
            {/* Información del usuario */}
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
            {/* Estadísticas principales */}
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
            {/* Gráfico de distribución de ratings */}
            <div className="p-4 rounded" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
              <h5 className="text-light mb-3">DISTRIBUCIÓN</h5>
              <RatingDistributionChart ratings={userRatings} />
            </div>
          </div>
        </div>
        {/* Columna derecha - Contenido principal */}
        <div className="col-md-8">
          {/* Sección de Top 10 Películas */}
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
                        onClick={() => getMovieDetails(movie.id, movie.media_type, null, topMovies, index)}
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
          {/* Sección de Top 10 Directores */}
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
          {/* Sección de Top 10 Actores/Actrices */}
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

          {/* Sección de Reviews */}
          <h2 className="fw-bold mb-4 text-light">Reviews</h2>
          <div className="mb-5">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className="p-4 rounded mb-4" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
                  <div className="row">
                    <div className="col-md-2">
                      <div className="poster-container">
                        {review.movieDetails.poster_path ? (
                          <img
                            src={`${IMAGE_BASE_URL}/w342${review.movieDetails.poster_path}`}
                            alt={review.movieDetails.title || review.movieDetails.name}
                          />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 bg-dark rounded">
                            <Film size={48} className="text-muted" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-10">
                      <h4 className="text-light">{review.movieDetails.title || review.movieDetails.name}</h4>
                      <p className="text-muted">{review.reviewText}</p>
                      <div className="d-flex align-items-center flex-wrap">
                        {review.rating && (
                          <span className="d-flex align-items-center me-3 mb-2">
                            <Star size={20} className="text-warning me-1" />
                            <span className="text-light">{review.rating}/5</span>
                          </span>
                        )}
                        <span className="d-flex align-items-center me-3 mb-2">
                           <BarChart3 size={20} className="text-info me-1" />
                          <span className="text-light">{review.movieDetails.vote_average.toFixed(1)}</span>
                        </span>
                        {review.hasLiked && (
                          <span className="d-flex align-items-center text-danger mb-2">
                            <Heart size={20} className="me-1" />
                            <span>Liked</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">Aún no has escrito ninguna review.</p>
            )}
          </div>

          {/* Sección de Películas Vistas */}
          <h2 className="fw-bold mb-4 text-light">Películas Vistas</h2>
          <div className="p-4 rounded mb-5" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
            <PaginatedMovieGrid
              moviesData={userRatings}
              title=""
              isAuthenticated={isAuthenticated}
              getMovieDetails={getMovieDetails}
              selectedMovie={selectedMovie}
              onCloseDetails={onCloseDetails}
              onRateMovie={onRateMovie}
              onToggleLike={onToggleLike}
              onToggleWatchlist={onToggleWatchlist}
            />
          </div>

          {/* Sección de Mis Listas */}
          <h2 className="fw-bold mb-4 text-light">Listas</h2>
          <div className="mb-5">
            {userLists.length > 0 ? (
              <div className="row">
                {userLists.map(list => (
                  <div key={list.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
                      <div className="card-body">
                        <h5 className="card-title text-light">{list.name}</h5>
                        <p className="card-text text-muted small">{list.description || 'Sin descripción.'}</p>
                        <p className="card-text text-muted small">{list.items.length} películas</p>
                        <button className="btn btn-sm btn-outline-light" onClick={() => navigate(`/lista/${list.id}`)}>Ver Lista</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">Aún no has creado ninguna lista.</p>
            )}
          </div>
        </div>
      </div>
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={onCloseDetails}
          isAuthenticated={isAuthenticated}
          onRateMovie={onRateMovie}
          onToggleLike={onToggleLike}
          onToggleWatchlist={onToggleWatchlist}
          movieList={movieList}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
        />
      )}
      {isProfilePictureModalOpen && (
        <div className="modal-backdrop-dark" onClick={() => setIsProfilePictureModalOpen(false)}>
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'transparent' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ position: 'relative', backgroundColor: 'transparent', border: 'none' }}>
                <button onClick={() => setIsProfilePictureModalOpen(false)} className="modal-close-button" aria-label="Cerrar">
                  <X size={24} />
                </button>
                <div className="modal-body text-center">
                  <img 
                    src={profilePicturePreview || profilePicture || '/placeholder-profile.svg'}
                    alt="Profile" 
                    className="img-fluid"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;