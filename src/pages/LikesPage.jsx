import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieDetailsModal from '../components/MovieDetailsModal'; // Import the modal component

const API_KEY = '3f46d222391647fd5bae513ec8dd5ca4';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const LikesPage = ({ getMovieDetails, selectedMovie, onCloseDetails, isAuthenticated, onRateMovie, onToggleLike }) => {
  const [likedMovies, setLikedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLikedMovies = async () => {
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
        // 1. Obtener IDs de películas con 'Me gusta' del backend
        const response = await fetch('http://localhost:5000/api/users/likes', {
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
          throw new Error(errorData.error || "Error al obtener películas con 'Me gusta'.");
        }

        const data = await response.json();
        const movieIds = data.likedMovies.map(item => item.movieId); // [{ movieId: 123 }, ...]

        if (movieIds.length === 0) {
          setLikedMovies([]);
          setLoading(false);
          return;
        }

        // 2. Obtener detalles de cada película de TMDb
        const movieDetailsPromises = movieIds.map(async (movieId) => {
          const movieDetailRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-MX`);
          return movieDetailRes.json();
        });

        const detailedMovies = await Promise.all(movieDetailsPromises);
        setLikedMovies(detailedMovies);

      } catch (err) {
        console.error('Error en LikesPage:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedMovies();
  }, [navigate]);

  if (loading) {
    return <div className="container" style={{ paddingTop: '80px' }}><div className="text-center">Cargando películas con 'Me gusta'...</div></div>;
  }

  if (error) {
    return <div className="container" style={{ paddingTop: '80px' }}><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <h2 className="mb-4">Mis Películas con 'Me gusta'</h2>
      {likedMovies.length === 0 ? (
        <p>Aún no le has dado 'Me gusta' a ninguna película. ¡Explora y añade algunas!</p>
      ) : (
        <div className="row g-1 poster-grid">
          {likedMovies.map((movie) => (
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

export default LikesPage;
