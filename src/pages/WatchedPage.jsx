import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_KEY = '3f46d222391647fd5bae513ec8dd5ca4';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const WatchedPage = () => {
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWatchedMovies = async () => {
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
        // 1. Obtener IDs de películas calificadas del backend
        const response = await fetch('http://localhost:5000/api/users/watched', {
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
          throw new Error(errorData.error || 'Error al obtener películas vistas.');
        }

        const data = await response.json();
        const movieIdsWithScores = data.watchedMovies; // [{ movieId: 123, score: 4.5 }, ...]

        if (movieIdsWithScores.length === 0) {
          setWatchedMovies([]);
          setLoading(false);
          return;
        }

        // 2. Obtener detalles de cada película de TMDb
        const movieDetailsPromises = movieIdsWithScores.map(async (item) => {
          const movieDetailRes = await fetch(`${BASE_URL}/movie/${item.movieId}?api_key=${API_KEY}&language=es-MX`);
          const movieDetail = await movieDetailRes.json();
          return { ...movieDetail, userScore: item.score }; // Añadir la calificación del usuario
        });

        const detailedMovies = await Promise.all(movieDetailsPromises);
        setWatchedMovies(detailedMovies);

      } catch (err) {
        console.error('Error en WatchedPage:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchedMovies();
  }, [navigate]);

  if (loading) {
    return <div className="container" style={{ paddingTop: '80px' }}><div className="text-center">Cargando películas vistas...</div></div>;
  }

  if (error) {
    return <div className="container" style={{ paddingTop: '80px' }}><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <h2 className="mb-4">Mis Películas Vistas</h2>
      {watchedMovies.length === 0 ? (
        <p>Aún no has calificado ninguna película. ¡Califica algunas para verlas aquí!</p>
      ) : (
        <div className="row g-1 poster-grid">
          {watchedMovies.map((movie) => (
            <div key={movie.id} className="col-4 col-md-3 col-lg-2 mb-1">
              <div className="movie-card">
                <img
                  src={
                    movie.poster_path
                      ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
                      : 'https://via.placeholder.com/342x513?text=No+Poster'
                  }
                  alt={movie.title}
                  className="img-fluid rounded"
                />
                {movie.userScore && (
                  <div className="user-score-overlay">
                    <span>{movie.userScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchedPage;
