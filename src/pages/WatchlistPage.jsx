import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieDetailsModal from '../components/MovieDetailsModal';

const API_KEY = '3f46d222391647fd5bae513ec8dd5ca4';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const WatchlistPage = ({ getMovieDetails, selectedMovie, onCloseDetails, isAuthenticated, onRateMovie, onToggleLike, onToggleWatchlist }) => {
  const [watchlistedMovies, setWatchlistedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWatchlistedMovies = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No autenticado. Por favor, inicia sesión.');
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        // 1. Obtener IDs de películas en la Watchlist del backend
        const response = await fetch('http://localhost:5000/api/users/watchlist', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            navigate('/login');
            throw new Error('Sesión expirada o no válida. Por favor, inicia sesión de nuevo.');
          }
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al obtener películas en la Watchlist.");
        }

        const data = await response.json();
        const movieIds = data.watchlistedMovies.map(item => item.movieId); // [{ movieId: 123 }, ...]

        if (movieIds.length === 0) {
          setWatchlistedMovies([]);
          setLoading(false);
          return;
        }

        // 2. Obtener detalles de cada película de TMDb
        const movieDetailsPromises = movieIds.map(async (movieId) => {
          const movieDetailRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-MX`);
          return movieDetailRes.json();
        });

        const detailedMovies = await Promise.all(movieDetailsPromises);
        setWatchlistedMovies(detailedMovies);

      } catch (err) {
        console.error('Error en WatchlistPage:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistedMovies();
  }, [navigate]);

  if (loading) {
    return <div className="container" style={{ paddingTop: '80px' }}><div className="text-center">Cargando películas en la Watchlist...</div></div>;
  }

  if (error) {
    return <div className="container" style={{ paddingTop: '80px' }}><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <h2 className="mb-4">Mi Watchlist</h2>
      {watchlistedMovies.length === 0 ? (
        <p>Aún no has añadido ninguna película a tu Watchlist. ¡Explora y añade algunas!</p>
      ) : (
        <div className="row g-1 poster-grid">
          {watchlistedMovies.map((movie) => (
            <div key={movie.id} className="col-4 col-md-3 col-lg-2 mb-1">
              <div className="movie-card" onClick={() => getMovieDetails(movie.id)}>
                <img
                  src={
                    movie.poster_path
                      ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
                      : 'https://via.placeholder.com/342x513?text=No+Poster'
                  }
                  alt={movie.title}
                  className="img-fluid rounded"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={onCloseDetails}
          isAuthenticated={isAuthenticated}
          onRateMovie={onRateMovie}
          onToggleLike={onToggleLike}
          onToggleWatchlist={onToggleWatchlist}
        />
      )}
    </div>
  );
};

export default WatchlistPage;