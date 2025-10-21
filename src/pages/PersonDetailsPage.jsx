import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PaginatedPersonMovies from '../components/PaginatedPersonMovies';
import MovieDetailsModal from '../components/MovieDetailsModal';
import ErrorBoundary from '../components/ErrorBoundary'; // Import ErrorBoundary

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const PersonDetailsPage = ({ getMovieDetails, selectedMovie, onCloseDetails, isAuthenticated, onRateMovie, onToggleLike, onToggleWatchlist }) => {
  const { personId, role } = useParams();
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [personId, role]);

  if (loading) return <div className="container mt-5"><p>Cargando...</p></div>;
  if (error) return <div className="container mt-5"><p>Error: {error}</p></div>;
  if (!person) return null;

  const filmographyTitle = role === 'director' ? 'Filmografía como Director' : 'Filmografía como Actor';

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-4 text-center">
          <img 
            src={person.profile_path ? `${IMAGE_BASE_URL}/h632${person.profile_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
            alt={person.name}
            className="img-fluid rounded mb-4"
          />
          <h1 className="fw-bold text-center mb-4">{person.name}</h1>
        </div>
      </div>

      <hr className="my-5" />

      <div>
        <h2 className="fw-bold mb-4">{filmographyTitle}</h2>
        <ErrorBoundary> {/* Wrap PaginatedPersonMovies with ErrorBoundary */}
          <PaginatedPersonMovies movies={movies} getMovieDetails={getMovieDetails} />
        </ErrorBoundary>
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