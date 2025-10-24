import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieDetailsModal from './MovieDetailsModal';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const PaginatedMovieGrid = ({ endpoint = '', title, isAuthenticated, onRateMovie, onToggleLike, onToggleWatchlist, getMovieDetails, selectedMovie, onCloseDetails, query, clearSearch, moviesData }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Valor inicial según el tipo de página
  const isWatchedPage = endpoint === '/api/users/watched';
  const defaultSort = isWatchedPage ? 'user_rating.desc' : endpoint.startsWith('/api') ? 'release_date.desc' : 'vote_average.desc';
  const [sortBy, setSortBy] = useState(defaultSort);
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGenresAndCountries = async () => {
      try {
        // Fetch Genres
        const genreUrl = `${import.meta.env.VITE_BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=es-MX`;
        const genreResponse = await fetch(genreUrl);
        const genreData = await genreResponse.json();
        setGenres(genreData.genres || []);

        // Fetch Countries
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

  const fetchMovies = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    if (!token && endpoint.startsWith('/api')) {
      setError('No autenticado. Por favor, inicia sesión.');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      let allMovies = [];

      if (endpoint.startsWith('/api')) {
        const url = `http://localhost:3000${endpoint}`;
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            navigate('/login');
            throw new Error('Sesión expirada o no válida. Por favor, inicia sesión de nuevo.');
          }
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al obtener las películas.");
        }

        const data = await response.json();

        if (data.hasOwnProperty('watchedMovies')) {
          allMovies = data.watchedMovies.map(item => ({ ...item, id: item.mediaId }));
        } else if (data.hasOwnProperty('likedItems')) {
          allMovies = data.likedItems.map(item => ({ ...item, id: item.mediaId }));
        } else if (data.hasOwnProperty('watchlistedMovies')) {
          allMovies = data.watchlistedMovies.map(item => ({ ...item, id: item.mediaId }));
        }

        allMovies = allMovies.filter(item => item.id && item.mediaType);

        const itemDetailsPromises = allMovies.map(async (item) => {
          const detailUrl = `${import.meta.env.VITE_BASE_URL}/${item.mediaType}/${item.id}?api_key=${API_KEY}&language=es-MX`;
          const detailRes = await fetch(detailUrl);
          if (!detailRes.ok) {
            console.error(`Error fetching details for ${item.mediaType} ${item.id}`);
            return null;
          }
          const detail = await detailRes.json();
          return { ...detail, userScore: item.score, mediaType: item.mediaType };
        });

        let detailedItems = (await Promise.all(itemDetailsPromises)).filter(Boolean);

        // Apply filters
        if (selectedGenre) {
          detailedItems = detailedItems.filter(movie => movie.genres && movie.genres.some(g => g.id == selectedGenre));
        }
        if (selectedCountry) {
          detailedItems = detailedItems.filter(movie => movie.origin_country && movie.origin_country.includes(selectedCountry));
        }
        if (selectedDecade) {
          const startYear = parseInt(selectedDecade);
          const endYear = startYear + 9;
          detailedItems = detailedItems.filter(movie => {
            const releaseDate = movie.release_date || movie.first_air_date;
            if (!releaseDate) return false;
            const releaseYear = new Date(releaseDate).getFullYear();
            return releaseYear >= startYear && releaseYear <= endYear;
          });
        }

        const sortedItems = sortMoviesLocally(detailedItems, sortBy);

        // Calcular paginación local
        const itemsPerPage = 24;
        const totalItems = sortedItems.length;
        const totalPagesCalculated = Math.ceil(totalItems / itemsPerPage);
        setTotalPages(totalPagesCalculated);

        // Obtener solo los items de la página actual
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = sortedItems.slice(startIndex, endIndex);

        setMovies(paginatedItems);

      } else { // TMDB API calls
        // TMDB devuelve 20 resultados por página, pero queremos 24
        // Entonces necesitamos cargar múltiples páginas de TMDB para completar 24 películas
        const moviesPerTmdbPage = 20;
        const desiredMoviesPerPage = 24;

        // Calcular qué páginas de TMDB necesitamos cargar
        const startIndex = (currentPage - 1) * desiredMoviesPerPage;
        const firstTmdbPage = Math.floor(startIndex / moviesPerTmdbPage) + 1;
        const secondTmdbPage = firstTmdbPage + 1;

        let urlParams = `api_key=${API_KEY}&language=es-MX`;

        if (query) {
          urlParams += `&query=${encodeURIComponent(query)}`;
        } else {
          if (sortBy !== 'classics') {
            urlParams += `&sort_by=${sortBy}`;
          }
          if (selectedGenre) {
            urlParams += `&with_genres=${selectedGenre}`;
          }
          if (selectedCountry) {
            urlParams += `&with_origin_country=${selectedCountry}`;
          }
          if (selectedDecade) {
            const startDate = `${selectedDecade}-01-01`;
            const endDate = `${parseInt(selectedDecade) + 9}-12-31`;
            urlParams += `&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}`;
          }
        }

        let url1, url2;
        if (query) {
          url1 = `${import.meta.env.VITE_BASE_URL}/search/multi?${urlParams}&page=${firstTmdbPage}`;
          url2 = `${import.meta.env.VITE_BASE_URL}/search/multi?${urlParams}&page=${secondTmdbPage}`;
        } else if (sortBy === 'classics') {
          url1 = `${import.meta.env.VITE_BASE_URL}${endpoint}?${urlParams}&sort_by=vote_average.desc&vote_count.gte=1000&vote_average.gte=7.5&primary_release_date.lte=2010-12-31&page=${firstTmdbPage}`;
          url2 = `${import.meta.env.VITE_BASE_URL}${endpoint}?${urlParams}&sort_by=vote_average.desc&vote_count.gte=1000&vote_average.gte=7.5&primary_release_date.lte=2010-12-31&page=${secondTmdbPage}`;
        } else {
          url1 = `${import.meta.env.VITE_BASE_URL}${endpoint}?${urlParams}&page=${firstTmdbPage}`;
          url2 = `${import.meta.env.VITE_BASE_URL}${endpoint}?${urlParams}&page=${secondTmdbPage}`;
        }

        const [response1, response2] = await Promise.all([
          fetch(url1),
          fetch(url2)
        ]);

        if (!response1.ok) {
          throw new Error('Error al obtener las películas de TMDB.');
        }

        const data1 = await response1.json();
        const data2 = response2.ok ? await response2.json() : { results: [] };

        // Combinar los resultados de ambas páginas
        const combinedResults = [...data1.results, ...data2.results];

        // Calcular el offset dentro de los resultados combinados
        const offset = startIndex % moviesPerTmdbPage;

        // Extraer exactamente 24 películas desde el offset
        allMovies = combinedResults.slice(offset, offset + desiredMoviesPerPage).map(item => ({
          ...item,
          mediaType: item.media_type || (item.title ? 'movie' : 'tv')
        }));

        // Calcular el total de páginas basado en el total de resultados de TMDB
        const totalTmdbResults = data1.total_results;
        setTotalPages(Math.ceil(totalTmdbResults / desiredMoviesPerPage));
        setMovies(allMovies);
      }

      if (allMovies.length === 0) {
        setMovies([]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error(`Error in PaginatedMovieGrid for endpoint ${endpoint}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortMoviesLocally = (items, sortOption) => {
    const sorted = [...items];

    switch(sortOption) {
      case 'vote_average.desc':
        return sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

      case 'popularity.desc':
        return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      case 'release_date.desc':
        return sorted.sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || '';
          const dateB = b.release_date || b.first_air_date || '';
          return dateB.localeCompare(dateA);
        });

      case 'user_rating.desc':
        return sorted.sort((a, b) => (b.userScore || 0) - (a.userScore || 0));

      case 'title.asc':
        return sorted.sort((a, b) => {
          const titleA = (a.title || a.name || '').toLowerCase();
          const titleB = (b.title || b.name || '').toLowerCase();
          return titleA.localeCompare(titleB);
        });

      default:
        return sorted;
    }
  };

  useEffect(() => {
    if (moviesData) {
      processMoviesData(moviesData);
    } else {
      fetchMovies();
    }
  }, [navigate, currentPage, sortBy, endpoint, query, selectedMovie, selectedGenre, selectedCountry, selectedDecade, moviesData]);

  const processMoviesData = async (data) => {
    setLoading(true);
    setError('');
    try {
      const itemDetailsPromises = data.map(async (item) => {
        const detailUrl = `${import.meta.env.VITE_BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`;
        const detailRes = await fetch(detailUrl);
        if (!detailRes.ok) {
          console.error(`Error fetching details for ${item.mediaType} ${item.mediaId}`);
          return null;
        }
        const detail = await detailRes.json();
        return { ...detail, userScore: item.score, mediaType: item.mediaType };
      });

      let detailedItems = (await Promise.all(itemDetailsPromises)).filter(Boolean);
      // Apply filters, sorting, and pagination as in fetchMovies
      // This part can be extracted to a helper function to avoid repetition
      if (selectedGenre) {
        detailedItems = detailedItems.filter(movie => movie.genres && movie.genres.some(g => g.id == selectedGenre));
      }
      if (selectedCountry) {
        detailedItems = detailedItems.filter(movie => movie.origin_country && movie.origin_country.includes(selectedCountry));
      }
      if (selectedDecade) {
        const startYear = parseInt(selectedDecade);
        const endYear = startYear + 9;
        detailedItems = detailedItems.filter(movie => {
          const releaseDate = movie.release_date || movie.first_air_date;
          if (!releaseDate) return false;
          const releaseYear = new Date(releaseDate).getFullYear();
          return releaseYear >= startYear && releaseYear <= endYear;
        });
      }

      const sortedItems = sortMoviesLocally(detailedItems, sortBy);
      const itemsPerPage = 24;
      const totalItems = sortedItems.length;
      const totalPagesCalculated = Math.ceil(totalItems / itemsPerPage);
      setTotalPages(totalPagesCalculated);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedItems = sortedItems.slice(startIndex, endIndex);
      setMovies(paginatedItems);
    } catch (err) {
      console.error('Error processing movies data:', err);
      setError('Error al procesar las películas.');
    } finally {
      setLoading(false);
    }
  };
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleMovieRated = (mediaId) => {
    if (endpoint === '/api/users/watchlist') {
      setMovies(prevMovies => prevMovies.filter(movie => movie.id !== mediaId));
    }
  };

  if (loading) {
    return <div className="container" style={{ paddingTop: '80px' }}><div className="text-center">Cargando...</div></div>;
  }

  if (error) {
    return <div className="container" style={{ paddingTop: '80px' }}><div className="alert alert-danger">{error}</div></div>;
  }

  // Determinar qué opciones de ordenamiento mostrar según la página
  const isUserDataPage = endpoint.startsWith('/api');
  const isWatchedPageRender = endpoint === '/api/users/watched';
  const isWatchlistPage = endpoint === '/api/users/watchlist';
  const isLikesPage = endpoint === '/api/users/likes';

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
                  {isWatchedPageRender ? (
                    <>
                      <option value="user_rating.desc">Mi Calificación</option>
                      <option value="vote_average.desc">Calificación TMDB</option>
                      <option value="release_date.desc">Fecha de lanzamiento</option>
                      <option value="popularity.desc">Popularidad</option>
                      <option value="title.asc">Título (A-Z)</option>
                    </>
                  ) : isWatchlistPage || isLikesPage ? (
                    <>
                      <option value="release_date.desc">Fecha de lanzamiento</option>
                      <option value="vote_average.desc">Calificación TMDB</option>
                      <option value="popularity.desc">Popularidad</option>
                      <option value="title.asc">Título (A-Z)</option>
                    </>
                  ) : (
                    <>
                      <option value="popularity.desc">Popularidad</option>
                      <option value="vote_average.desc">Calificación</option>
                      <option value="release_date.desc">Fecha de lanzamiento</option>
                      <option value="classics">Clásicos Aclamados</option>
                    </>
                  )}
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
                                          <div className="movie-card" onClick={() => getMovieDetails(movie.id, movie.mediaType, movie.userScore)}>
                <div className="poster-container">
                  <img
                    src={
                      movie.poster_path
                        ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
                        : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                    }
                    alt={movie.title || movie.name}
                  />
                </div>
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

      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={onCloseDetails}
          isAuthenticated={isAuthenticated}
          onRateMovie={onRateMovie}
          onToggleLike={onToggleLike}
          onToggleWatchlist={onToggleWatchlist}
          onMovieRated={handleMovieRated}
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
