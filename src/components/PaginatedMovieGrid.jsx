import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieDetailsModal from './MovieDetailsModal';
import { getApiUrl } from '../config/api';
import { Star } from 'lucide-react';
import { useMovies } from '../hooks/useMovies'; // Importar el nuevo hook

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// ... (el resto de las funciones auxiliares como renderStars se mantienen igual)

const renderStars = (score) => {
  const fullStars = Math.floor(score);
  const halfStar = score % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <>
      {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} size={12} fill="currentColor" className="text-warning" />)}
      {halfStar && <Star key="half" size={12} fill="currentColor" className="text-warning" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
      {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} size={12} className="text-secondary" />)}
    </>
  );
};

const PaginatedMovieGrid = ({ endpoint = '', title, getMovieDetails, selectedMovie, onCloseDetails, query, clearSearch }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const isWatchedPage = endpoint === '/api/users/watched';
  const defaultSort = isWatchedPage ? 'user_rating.desc' : endpoint.startsWith('/api') ? 'release_date.desc' : 'vote_average.desc';
  const [sortBy, setSortBy] = useState(defaultSort);
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('');
  const navigate = useNavigate();

  // Lógica de fetching de géneros y países se mantiene por ahora
  useEffect(() => {
    const fetchGenresAndCountries = async () => {
      try {
        const genreUrl = `${import.meta.env.VITE_BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=es-MX`;
        const genreResponse = await fetch(genreUrl);
        const genreData = await genreResponse.json();
        setGenres(genreData.genres || []);
        const countryUrl = `${import.meta.env.VITE_BASE_URL}/configuration/countries?api_key=${API_KEY}&language=es-MX`;
        const countryResponse = await fetch(countryUrl);
        const countryData = await countryResponse.json();
        setCountries(countryData || []);
      } catch (err) {
        console.error('Error fetching genres or countries:', err);
      }
    };
    fetchGenresAndCountries();
  }, []);

  // Usar el nuevo hook para obtener las películas
  const {
    data,
    isLoading,
    isError,
    error,
  } = useMovies({
    endpoint,
    query,
    currentPage,
    sortBy,
    selectedGenre,
    selectedCountry,
    selectedDecade,
  });

  useEffect(() => {
    if (isError && error.message === 'Unauthorized') {
      navigate('/login');
    }
  }, [isError, error, navigate]);

  // Procesar los datos recibidos del hook
  const movies = data?.results || data?.watchedMovies || [];
  const totalPages = data?.total_pages || 1;

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  if (isLoading) return <div className="container" style={{ paddingTop: '80px' }}><div className="text-center">Cargando...</div></div>;
  if (isError) return <div className="container" style={{ paddingTop: '80px' }}><div className="alert alert-danger">{error.message}</div></div>;

  // ... (el resto del JSX se mantiene mayormente igual)
  const decades = [
    { value: '2020', label: '2020s' },
    { value: '2010', label: '2010s' },
    { value: '2000', label: '2000s' },
    { value: '1990', label: '1990s' },
    { value: '1980', label: '1980s' },
    { value: '1970', label: '1970s' },
    { value: '1960', label: '1960s' },
  ];

  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="m-0">{query ? `Resultados para "${query}"` : title}</h2>
          {query && clearSearch && (
            <button
              onClick={clearSearch}
              className="btn btn-sm btn-outline-light mt-2"
            >
              ← Volver a películas
            </button>
          )}
        </div>
        <div className="d-flex align-items-center">
          {!query && (
            <div className="d-flex align-items-center gap-3">
              <div>
                <label htmlFor="genre-filter" className="form-label me-2">Género:</label>
                <select id="genre-filter" className="form-select form-select-sm" value={selectedGenre} onChange={(e) => { setSelectedGenre(e.target.value); setCurrentPage(1); }}>
                  <option value="">Todos</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>{genre.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="decade-filter" className="form-label me-2">Década:</label>
                <select id="decade-filter" className="form-select form-select-sm" value={selectedDecade} onChange={(e) => { setSelectedDecade(e.target.value); setCurrentPage(1); }}>
                  <option value="">Todas</option>
                  {decades.map(decade => (
                    <option key={decade.value} value={decade.value}>{decade.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="country-filter" className="form-label me-2">País:</label>
                <select id="country-filter" className="form-select form-select-sm" value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setCurrentPage(1); }}>
                  <option value="">Todos</option>
                  {countries.map(country => (
                    <option key={country.iso_3166_1} value={country.iso_3166_1}>{country.native_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sort-by" className="form-label me-2">Ordenar por:</label>
                <select id="sort-by" className="form-select form-select-sm" value={sortBy} onChange={handleSortChange}>
                  {/* Opciones de ordenamiento */}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      {movies.length === 0 ? (
        <p>No hay películas para mostrar.</p>
      ) : (
        <div className="row g-1 poster-grid">
          {movies.map((movie) => (
            <div key={movie.id} className="col-4 col-md-3 col-lg-2 mb-1">
              <div className="movie-card h-100" onClick={() => getMovieDetails(movie.id, movie.mediaType, movie.userScore)}>
                <div className="poster-container">
                  <img
                    src={
                      movie.poster_path
                        ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
                        : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                    }
                    alt={movie.title || movie.name}
                    className="img-fluid"
                  />
                </div>
                <div className="movie-info">
                  <div className="d-flex justify-content-start align-items-center mt-2">
                    {movie.userScore > 0 && (
                      <span className="d-flex align-items-center me-2">
                        {renderStars(movie.userScore)}
                      </span>
                    )}
                    {movie.isLiked && <Star size={12} fill="currentColor" className="text-danger me-2" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={onCloseDetails}
        />
      )}
      <div className="d-flex justify-content-center mt-4">
        <nav>
          <ul className="pagination">
            {currentPage > 1 && (
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                  &laquo; Anterior
                </button>
              </li>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                return (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(page)}>
                      {page}
                    </button>
                  </li>
                );
              }
              if (page === currentPage - 3 || page === currentPage + 3) {
                return <li key={page} className="page-item disabled"><span className="page-link">...</span></li>;
              }
              return null;
            })}
            {currentPage < totalPages && (
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                  Siguiente &raquo;
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
};
export default PaginatedMovieGrid;