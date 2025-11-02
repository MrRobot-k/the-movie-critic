import React, { useState, useEffect, useMemo } from 'react';
import { Star, Heart, Eye } from 'lucide-react';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const ITEMS_PER_PAGE = 24;

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

const PaginatedListMovies = ({ listItems, getMovieDetails, userRatings = [], likedItems = [], watchedItems = [], isNumbered = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('custom'); // Default to custom order from list
  const [baseMovieDetails, setBaseMovieDetails] = useState([]); // Stores movie details from TMDB
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Step 1: Fetch base movie details only when the list itself changes.
  useEffect(() => {
    const fetchAllMovieDetails = async () => {
      if (!listItems || listItems.length === 0) {
        setBaseMovieDetails([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const movieDetailsPromises = listItems.map(async (item) => {
          const detailRes = await fetch(
            `${BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`
          );
          if (!detailRes.ok) return null; // Skip if fetch fails
          const detail = await detailRes.json();
          return { ...detail, media_type: item.mediaType, id: item.mediaId, listOrder: item.order };
        });
        const fetchedMovies = (await Promise.all(movieDetailsPromises)).filter(Boolean); // Filter out nulls
        setBaseMovieDetails(fetchedMovies);
      } catch (err) {
        setError(err.message);
        setBaseMovieDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMovieDetails();
  }, [listItems]); // Only depends on listItems

  // Step 2: Enrich movie details with user data using useMemo to prevent re-calculation on every render.
  const fullMovieListDetails = useMemo(() => {
    const ratingsMap = new Map(userRatings.map(r => [`${r.mediaId}-${r.mediaType}`, r.score]));
    const likedMap = new Set(likedItems.map(item => `${item.mediaId}-${item.mediaType}`));
    const watchedMap = new Set(watchedItems.map(item => `${item.mediaId}-${item.mediaType}`));

    return baseMovieDetails.map(movie => ({
      ...movie,
      userScore: ratingsMap.get(`${movie.id}-${movie.media_type}`) || 0,
      isLiked: likedMap.has(`${movie.id}-${movie.media_type}`),
      isWatched: watchedMap.has(`${movie.id}-${movie.media_type}`),
    }));
  }, [baseMovieDetails, userRatings, likedItems, watchedItems]);

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
