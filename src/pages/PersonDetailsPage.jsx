import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PaginatedPersonMovies from '../components/PaginatedPersonMovies';
import MovieDetailsModal from '../components/MovieDetailsModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { getApiUrl } from '../config/api';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const PersonDetailsPage = ({ getMovieDetails, selectedMovie, onCloseDetails, isAuthenticated, onRateMovie, onToggleLike, onToggleWatchlist }) => {
  const { personId, role } = useParams();
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRatings, setUserRatings] = useState([]);
  const [watchedInListCount, setWatchedInListCount] = useState(0);
  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        setLoading(true);
        const personResponse = await fetch(`${BASE_URL}/person/${personId}?api_key=${API_KEY}&language=es-MX`);
        if (!personResponse.ok) throw new Error('Failed to fetch person details.');
        const personData = await personResponse.json();
        setPerson(personData);
        const creditsResponse = await fetch(`${BASE_URL}/person/${personId}/movie_credits?api_key=${API_KEY}&language=es-MX`);
        if (!creditsResponse.ok) throw new Error('Failed to fetch person credits.');
        const creditsData = await creditsResponse.json();
        let movieCredits = [];
        if (role === 'director')  movieCredits = creditsData.crew.filter(movie => movie.job === 'Director');
        else movieCredits = creditsData.cast;
        setMovies(movieCredits.map(movie => ({ ...movie, media_type: 'movie' })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPersonDetails();
    if (isAuthenticated) loadUserRatings();
  }, [personId, role, isAuthenticated]);
  useEffect(() => {
    if (movies.length > 0 && userRatings.length > 0) {
      const movieIds = new Set(movies.map(m => m.id.toString()));
      const watchedIds = new Set(userRatings.map(r => r.mediaId.toString()));
      const count = [...movieIds].filter(id => watchedIds.has(id)).length;
      setWatchedInListCount(count);
    }
  }, [movies, userRatings]);
  const loadUserRatings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(getApiUrl('/api/users/watched'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserRatings(data.watchedMovies || []);
      } else console.error('Failed to fetch user ratings');
    } catch (error) {
      console.error('Error loading user ratings:', error);
    }
  };
  if (loading) return <div className="container mt-5"><p>Cargando...</p></div>;
  if (error) return <div className="container mt-5"><p>Error: {error}</p></div>;
  if (!person) return null;
  const filmographyTitle = role === 'director' ? 'Filmografía como Director' : 'Filmografía como Actor';
  const totalMovies = movies.length;
  const percentageWatched = totalMovies > 0 ? (watchedInListCount / totalMovies) * 100 : 0;
  return (
    <div className="container-fluid" style={{ paddingTop: '80px' }}>
      <div className="row">
        <div className="col-md-3 text-center">
          <img 
            src={person.profile_path ? `${IMAGE_BASE_URL}/h632${person.profile_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
            alt={person.name}
            className="img-fluid rounded mb-4"
          />
          <h2 className="fw-bold text-center mb-4">{person.name}</h2>
        </div>
        <div className="col-md-7">
          <h3 className="fw-bold mb-4">{filmographyTitle}</h3>
          <ErrorBoundary>
            <PaginatedPersonMovies movies={movies} getMovieDetails={getMovieDetails} />
          </ErrorBoundary>
        </div>
        <div className="col-md-2">
          {isAuthenticated && totalMovies > 0 && (
            <div className="p-3 rounded sticky-top" style={{ backgroundColor: '#1e2328', top: '100px' }}>
              <h5 className="text-light mb-3">Progreso</h5>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-light" style={{ fontSize: '0.8rem' }}>Vistas: {watchedInListCount} de {totalMovies}</span>
                <span className="text-light" style={{ fontSize: '0.9rem' }}>{percentageWatched.toFixed(0)}%</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${percentageWatched}%`, backgroundColor: '#00b020' }}
                  aria-valuenow={percentageWatched}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          )}
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
        />
      )}
    </div>
  );
};

export default PersonDetailsPage;