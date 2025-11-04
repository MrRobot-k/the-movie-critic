import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '../config/api';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const fetchMovies = async ({ endpoint, query, currentPage, sortBy, selectedGenre, selectedCountry, selectedDecade }) => {
  const token = localStorage.getItem('token');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  let url;
  const isApiEndpoint = endpoint.startsWith('/api');

  if (endpoint === '/search/multi') {
    url = getApiUrl(`/api/search?query=${encodeURIComponent(query)}&page=${currentPage}`);
  } else if (isApiEndpoint) {
    url = getApiUrl(endpoint);
  } else {
    let urlParams = `api_key=${API_KEY}&language=es-MX&page=${currentPage}`;
    if (sortBy !== 'classics') urlParams += `&sort_by=${sortBy}`;
    if (selectedGenre) urlParams += `&with_genres=${selectedGenre}`;
    if (selectedCountry) urlParams += `&with_origin_country=${selectedCountry}`;
    if (selectedDecade) {
      const startDate = `${selectedDecade}-01-01`;
      const endDate = `${parseInt(selectedDecade) + 9}-12-31`;
      urlParams += `&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}`;
    }
    url = `${import.meta.env.VITE_BASE_URL}${endpoint}?${urlParams}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Unauthorized');
    }
    const errorData = await response.json();
    throw new Error(errorData.error || "Error al obtener las películas.");
  }

  let data = await response.json();

  // Process data to ensure mediaType is consistently available
  const processItems = (items, defaultMediaType = undefined) => {
    return items.map(item => ({
      ...item,
      mediaType: item.mediaType || item.media_type || defaultMediaType,
    }));
  };

  if (data.results) {
    data.results = processItems(data.results, endpoint === '/discover/movie' ? 'movie' : undefined);
  }
  if (data.watchedMovies) {
    data.watchedMovies = processItems(data.watchedMovies, 'movie'); // Assuming watched movies are always 'movie'
  }

  // If the data is from our custom backend, it needs to be enriched with TMDB details
  if (isApiEndpoint && endpoint !== '/api/search') {
    const itemsToEnrich = data.watchedMovies || data.results || [];
    
    const enrichedItems = await Promise.all(itemsToEnrich.map(async (item) => {
      try {
        const tmdbUrl = `${import.meta.env.VITE_BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`;
        const tmdbResponse = await fetch(tmdbUrl);
        if (!tmdbResponse.ok) return null; // Skip if TMDB fetch fails
        const tmdbDetails = await tmdbResponse.json();

        // Combine TMDB details with our backend data (like userScore)
        return {
          ...tmdbDetails,
          id: item.mediaId, // Ensure the ID from our DB is the primary ID
          mediaType: item.mediaType,
          userScore: item.score, // For watched movies
          isLiked: endpoint === '/api/users/likes' ? true : undefined, // Set isLiked for likes page
          isWatchlisted: endpoint === '/api/users/watchlist' ? true : undefined, // Set isWatchlisted for watchlist page
        };
      } catch (error) {
        console.error(`Error enriching item ${item.mediaId}:`, error);
        return null; // Skip this item on error
      }
    }));

    // Filter out any items that failed to enrich
    const validItems = enrichedItems.filter(item => item !== null);

    // Reconstruct the data object in the expected format
    if (data.watchedMovies) {
      data.watchedMovies = validItems;
    } else {
      data.results = validItems;
    }
  }

  return data;
};

export const useMovies = ({ endpoint, query, currentPage, sortBy, selectedGenre, selectedCountry, selectedDecade }) => {
  return useQuery({
    queryKey: ['movies', { endpoint, query, currentPage, sortBy, selectedGenre, selectedCountry, selectedDecade }],
    queryFn: () => fetchMovies({ endpoint, query, currentPage, sortBy, selectedGenre, selectedCountry, selectedDecade }),
    keepPreviousData: true, // Muy útil para paginación, no muestra un estado de carga al cambiar de página
  });
};
