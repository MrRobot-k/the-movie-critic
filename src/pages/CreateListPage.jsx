import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, X, GripVertical, Trash2, Heart, Eye } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import MovieDetailsModal from '../components/MovieDetailsModal';
import { getApiUrl } from '../config/api';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const CreateListPage = () => {
  const navigate = useNavigate();
  const { listId } = useParams();
  const isEditMode = !!listId;
  const [listName, setListName] = useState('');
  const [description, setDescription] = useState('');
  const [isNumbered, setIsNumbered] = useState(false);
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('custom'); // 'custom', 'release_date.desc', 'vote_average.desc' etc.
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    if (isEditMode) loadList();
  }, [listId]);
  useEffect(() => {
    const sortMovies = () => {
      const sortedMovies = [...movies];
      switch (sortBy) {
        case 'release_date.desc':
          sortedMovies.sort((a, b) => (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''));
          break;
        case 'release_date.asc':
          sortedMovies.sort((a, b) => (a.release_date || a.first_air_date || '').localeCompare(b.release_date || b.first_air_date || ''));
          break;
        case 'vote_average.desc':
          sortedMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
          break;
        case 'title.asc':
          sortedMovies.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
          break;
        default:
          return;
      }
      setMovies(sortedMovies);
    };
    if (sortBy !== 'custom') sortMovies();
  }, [sortBy]);
  const loadList = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(getApiUrl(`/api/lists/${listId}`));
      if (response.ok) {
        const data = await response.json();
        const list = data.list;
        setListName(list.name);
        setDescription(list.description);
        setIsNumbered(list.isNumbered);
        // Cargar detalles de las películas
        if (list.items && list.items.length > 0) {
          const movieDetailsPromises = list.items
            .sort((a, b) => a.order - b.order)
            .map(async (item) => {
              const detailRes = await fetch(
                `${import.meta.env.VITE_BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`
              );
              const detail = await detailRes.json();
              return { ...detail, media_type: item.mediaType };
            });
          const movieDetails = await Promise.all(movieDetailsPromises);
          setMovies(movieDetails);
        }
      }
    } catch (error) {
      console.error('Error loading list:', error);
    }
  };
  const getMovieDetails = async (movieId, mediaType) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/${mediaType}/${movieId}?api_key=${API_KEY}&language=es-MX&append_to_response=credits,videos`);
      const data = await response.json();
      setSelectedMovie(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching movie details:", error);
    }
  };
  const handleCloseDetails = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };
  const searchMovies = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      const filtered = data.results
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
        .slice(0, 10);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setIsSearching(false);
    }
  };
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) searchMovies();
      else setSearchResults([]);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);
  const getMovieUserData = async (movie) => {
    const token = localStorage.getItem('token');
    if (!token) return movie;
    try {
      const [ratingRes, likeRes, watchlistRes] = await Promise.all([
        fetch(getApiUrl(`/api/media/${movie.id}/rating?mediaType=${movie.media_type}`), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(getApiUrl(`/api/media/${movie.id}/likeStatus?mediaType=${movie.media_type}`), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(getApiUrl(`/api/media/${movie.id}/watchlistStatus?mediaType=${movie.media_type}`), { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const ratingData = ratingRes.ok ? await ratingRes.json() : null;
      const likeData = likeRes.ok ? await likeRes.json() : null;
      const watchlistData = watchlistRes.ok ? await watchlistRes.json() : null;
      return {
        ...movie,
        userScore: ratingData?.rating?.score,
        isLiked: likeData?.isLiked,
        isWatchlisted: watchlistData?.isWatchlisted
      };
    } catch (error) {
      console.error('Error fetching user data for movie:', error);
      return movie; // Devuelve la película sin datos de usuario si hay un error
    }
  };
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  const addMovie = async (movie) => {
    // Verificar si ya está en la lista
    const exists = movies.find(m => m.id === movie.id && m.media_type === movie.media_type);
    if (!exists) {
      const movieWithUserData = await getMovieUserData(movie);
      setMovies([...movies, movieWithUserData]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };
  const removeMovie = (index) => {
    const newMovies = [...movies];
    newMovies.splice(index, 1);
    setMovies(newMovies);
  };
  const moveMovie = (fromIndex, toIndex) => {
    const newMovies = [...movies];
    const [removed] = newMovies.splice(fromIndex, 1);
    newMovies.splice(toIndex, 0, removed);
    setMovies(newMovies);
  };
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    moveMovie(result.source.index, result.destination.index);
  };
  const saveList = async () => {
    if (!listName.trim()) {
      setError('El nombre de la lista es requerido');
      return;
    }
    if (movies.length === 0) {
      setError('Debes agregar al menos una película a la lista');
      return;
    }
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const listData = {
      name: listName.trim(),
      description: description.trim(),
      isNumbered,
      items: movies.map((movie) => ({
        mediaId: movie.id,
        mediaType: movie.media_type,
      })),
    };
    try {
      const url = isEditMode ? getApiUrl(`/api/lists/${listId}`) : getApiUrl('/api/lists');
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(listData),
      });
      if (response.ok) {
        navigate('/mis-listas');
      } else {
        // Manejo específico para errores de autenticación
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          navigate('/login');
          setError('Tu sesión ha expirado o no es válida. Por favor, inicia sesión de nuevo.');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Error al guardar la lista');
        }
      }
    } catch (error) {
      setError('Error al guardar la lista');
      console.error('Error saving list:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container" style={{ paddingTop: '80px', maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isEditMode ? 'Editar Lista' : 'Crear Nueva Lista'}</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/mis-listas')}>
          Cancelar
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {/* Formulario de la lista */}
      <div className="mb-4">
        <div className="mb-3">
          <label className="form-label">Nombre de la Lista *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej: Mis películas favoritas de los 90s"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="¿Por qué recomiendas estas películas?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-check mb-4">
          <input
            className="form-check-input"
            type="checkbox"
            id="isNumbered"
            checked={isNumbered}
            onChange={(e) => setIsNumbered(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="isNumbered">
            Enumerar películas (Top 10, Top 50, etc.)
          </label>
        </div>
      </div>
      {/* Buscador de películas */}
      <div className="mb-4">
        <h5 className="mb-3">Agregar Películas</h5>
        <div className="position-relative">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={20} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar películas o series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000 }}>
              {searchResults.map((movie) => (
                <button
                  key={`${movie.id}-${movie.media_type}`}
                  className="list-group-item list-group-item-action d-flex align-items-center"
                  onClick={() => addMovie(movie)}
                >
                  <img
                    src={
                      movie.poster_path
                        ? `${IMAGE_BASE_URL}/w92${movie.poster_path}`
                        : '/placeholder-poster.svg'
                    }
                    alt={movie.title || movie.name}
                    style={{ width: '40px', height: '60px', objectFit: 'cover' }}
                    className="me-3 rounded"
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-0">{movie.title || movie.name}</h6>
                    <small className="text-muted">
                      {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0] || 'N/A'}
                      {' • '}
                      {movie.media_type === 'movie' ? 'Película' : 'Serie'}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Lista de películas agregadas */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            Películas en la lista ({movies.length})
          </h5>
          <div className="d-flex align-items-center">
            <label htmlFor="sort-by" className="form-label me-2 mb-0">Ordenar por:</label>
            <select id="sort-by" className="form-select form-select-sm" value={sortBy} onChange={handleSortChange}>
              <option value="custom">Orden Personalizado</option>
              <option value="release_date.desc">Fecha de lanzamiento (Nuevas primero)</option>
              <option value="release_date.asc">Fecha de lanzamiento (Antiguas primero)</option>
              <option value="vote_average.desc">Calificación (Mejor a Peor)</option>
              <option value="title.asc">Título (A-Z)</option>
            </select>
          </div>
        </div>
        {movies.length === 0 ? (
          <div className="alert alert-info">
            No has agregado películas aún. Usa el buscador arriba para agregar películas a tu lista.
          </div>
        ) : (
          <div className="row g-1 poster-grid create-list-poster-grid">
            {movies.map((movie, index) => (
              <div key={`${movie.id}-${index}`} className="col-3 col-md-2 col-lg-1 mb-1">
                <div className="movie-card">
                  <img
                    src={
                      movie.poster_path
                        ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
                        : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                    }
                    alt={movie.title || movie.name}
                    className="img-fluid rounded"
                    onClick={() => getMovieDetails(movie.id, movie.media_type)}
                    style={{ cursor: 'pointer' }}
                  />
                  {movie.userScore && (
                    <div className="user-score-overlay">
                      <span>{movie.userScore.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="poster-icons-overlay">
                    {movie.isLiked && <Heart size={16} color="#e74c3c" fill="#e74c3c" />}
                    {movie.isWatchlisted && <Eye size={16} color="#3498db" fill="#3498db" />}
                  </div>
                  <button
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                    onClick={() => removeMovie(index)}
                    title="Eliminar de la lista"
                    style={{ lineHeight: 1, padding: '0.2rem 0.4rem' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Botones de acción */}
      <div className="d-flex gap-2 mb-5">
        <button
          className="btn btn-primary btn-lg"
          onClick={saveList}
          disabled={loading}
        >
          {loading ? 'Guardando...' : isEditMode ? 'Actualizar Lista' : 'Crear Lista'}
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={() => navigate('/mis-listas')}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
      {isModalOpen && selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={handleCloseDetails}
          isAuthenticated={true} // Asumimos que el usuario está autenticado para crear listas
        />
      )}
    </div>
  );
};
export default CreateListPage;