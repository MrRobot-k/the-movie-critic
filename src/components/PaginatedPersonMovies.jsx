import React, { useState, useEffect, useMemo } from 'react';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const ITEMS_PER_PAGE = 24; // Adjusted to match main page density

const PaginatedPersonMovies = ({ movies, getMovieDetails }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('release_date_desc');

  const sortedMovies = useMemo(() => {
    const sorted = [...movies].filter(m => m.poster_path).sort((a, b) => {
      switch (sortOrder) {
        case 'release_date_asc':
          return new Date(a.release_date) - new Date(b.release_date);
        case 'popularity_desc':
          return b.popularity - a.popularity;
        case 'popularity_asc':
          return a.popularity - b.popularity;
        case 'vote_average.desc':
          return b.vote_average - a.vote_average;
        case 'vote_average_asc':
          return a.vote_average - b.vote_average;
        case 'release_date_desc':
        default:
          return new Date(b.release_date) - new Date(a.release_date);
      }
    });
    return sorted;
  }, [movies, sortOrder]);

  const totalPages = Math.ceil(sortedMovies.length / ITEMS_PER_PAGE);
  const paginatedMovies = sortedMovies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const [detailedMovies, setDetailedMovies] = useState([]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      const detailed = await Promise.all(
        paginatedMovies.map(async (movie) => {
          const res = await fetch(`${import.meta.env.VITE_BASE_URL}/movie/${movie.id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=es-MX`);
          if (!res.ok) return movie; // Return original movie if fetch fails
          const details = await res.json();
          return { ...movie, ...details };
        })
      );
      setDetailedMovies(detailed);
    };

    if (paginatedMovies.length > 0) {
      fetchMovieDetails();
    }
  }, [paginatedMovies]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-4">
        <select className="form-select w-auto" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="release_date_desc">Fecha de lanzamiento (desc)</option>
          <option value="release_date_asc">Fecha de lanzamiento (asc)</option>
          <option value="popularity_desc">Popularidad (desc)</option>
          <option value="popularity_asc">Popularidad (asc)</option>
          <option value="vote_average.desc">Puntuación (desc)</option>
          <option value="vote_average.asc">Puntuación (asc)</option>
        </select>
      </div>

      {detailedMovies.length === 0 ? (
        <p>No hay películas para mostrar.</p>
      ) : (
        <div className="row g-1 poster-grid">
          {detailedMovies.map((movie, index) => (
            <div key={movie.credit_id || movie.id} className="col-4 col-md-3 col-lg-2 mb-1">
              <div className="movie-card" onClick={() => getMovieDetails(movie.id, movie.media_type, null, sortedMovies, (currentPage - 1) * ITEMS_PER_PAGE + index)}>
                <img
                  src={`${IMAGE_BASE_URL}/w342${movie.poster_path}`}
                  alt={movie.title || movie.name}
                  className="img-fluid rounded"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Anterior</button>
            </li>
            {[...Array(totalPages).keys()].map(num => {
               if (num + 1 === 1 || num + 1 === totalPages || (num + 1 >= currentPage - 2 && num + 1 <= currentPage + 2)) {
                return (
                  <li key={num + 1} className={`page-item ${currentPage === num + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(num + 1)}>{num + 1}</button>
                  </li>
                );
              }
              if (num + 1 === currentPage - 3 || num + 1 === currentPage + 3) {
                return <li key={num + 1} className="page-item disabled"><span className="page-link">...</span></li>;
              }
              return null;
            })}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Siguiente</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default PaginatedPersonMovies;
