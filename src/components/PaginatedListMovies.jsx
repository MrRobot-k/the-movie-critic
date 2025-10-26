import React, { useState, useEffect, useMemo } from 'react';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const ITEMS_PER_PAGE = 24;

const PaginatedListMovies = ({ listItems, getMovieDetails, userRatings = [], isNumbered = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('custom'); // Default to custom order from list
  const [fullMovieListDetails, setFullMovieListDetails] = useState([]); // Stores all fetched movie details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect to fetch all movie details when listItems changes
  useEffect(() => {
    const fetchAllMovieDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const ratingsMap = new Map(userRatings.map(r => [`${r.mediaId}-${r.mediaType}`, r.score]));

        const movieDetailsPromises = listItems.map(async (item) => {
          const detailRes = await fetch(
            `${BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`
          );
          if (!detailRes.ok) throw new Error(`Failed to fetch details for ${item.mediaId}`);
          const detail = await detailRes.json();
          const userScore = ratingsMap.get(`${item.mediaId}-${item.mediaType}`) || 0;
          return { ...detail, media_type: item.mediaType, id: item.mediaId, userScore, listOrder: item.order };
        });
        const fetchedMovies = await Promise.all(movieDetailsPromises);
        setFullMovieListDetails(fetchedMovies);
      } catch (err) {
        setError(err.message);
        setFullMovieListDetails([]);
      } finally {
        setLoading(false);
      }
    };

    if (listItems && listItems.length > 0) {
      fetchAllMovieDetails();
    } else {
      setFullMovieListDetails([]);
      setLoading(false);
    }
  }, [listItems, userRatings]); // Re-fetch all details when the listItems prop changes

  // Memoize the sorted full movie list based on sortOrder
  const sortedMovies = useMemo(() => {
    const sorted = [...fullMovieListDetails];
    switch (sortOrder) {
      case 'release_date.desc':
        sorted.sort((a, b) => (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''));
        break;
      case 'release_date.asc':
        sorted.sort((a, b) => (a.release_date || a.first_air_date || '').localeCompare(b.release_date || b.first_air_date || ''));
        break;
      case 'vote_average.desc':
        sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'title.asc':
        sorted.sort((a, b) => (a.title || a.name || '').toLowerCase().localeCompare((b.title || b.name || '').toLowerCase()));
        break;
      case 'custom':
      default:
        // Original order is preserved by default if no sorting is applied
        // The fullMovieListDetails are already in the original list order
        break;
    }
    return sorted;
  }, [fullMovieListDetails, sortOrder]);

  const totalPages = Math.ceil(sortedMovies.length / ITEMS_PER_PAGE);
  const paginatedMovies = sortedMovies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1); // Reset to first page on sort change
  };

  if (loading) return <div className="text-center py-5">Cargando películas...</div>;
  if (error) return <div className="alert alert-danger">Error: {error}</div>;

  return (
    <div>
      <div className="d-flex justify-content-end mb-4">
        <select className="form-select w-auto" value={sortOrder} onChange={handleSortChange}>
          <option value="custom">Orden de la lista</option>
          <option value="release_date.desc">Fecha de lanzamiento (Nuevas primero)</option>
          <option value="release_date.asc">Fecha de lanzamiento (Antiguas primero)</option>
          <option value="vote_average.desc">Calificación (Mejor a Peor)</option>
          <option value="title.asc">Título (A-Z)</option>
        </select>
      </div>

      {paginatedMovies.length === 0 ? (
        <p>No hay películas en esta lista.</p>
      ) : (
        <div className="row g-1 poster-grid">
          {paginatedMovies.map((movie, index) => (
            <div key={`${movie.id}-${movie.media_type}`} className="col-4 col-md-3 col-lg-2 mb-1">
              <div className="movie-card" onClick={() => getMovieDetails(movie.id, movie.media_type, movie.userScore, sortedMovies, (currentPage - 1) * ITEMS_PER_PAGE + index)}>
                <div className="poster-container">
                  <img
                    src={movie.poster_path ? `${IMAGE_BASE_URL}/w342${movie.poster_path}` : '/placeholder-poster.svg'}
                    alt={movie.title || movie.name}
                  />
                  {isNumbered && (
                    <div className="position-absolute top-0 start-0 bg-dark text-white px-2 py-1 rounded-end" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      #{movie.listOrder}
                    </div>
                  )}
                </div>
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

export default PaginatedListMovies;
