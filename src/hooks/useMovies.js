import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '../config/api';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const fetchMovies = async ({ endpoint, query, currentPage, sortBy, selectedGenre, selectedCountry, selectedDecade }) => {
  const token = localStorage.getItem('token');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  let url;
  if (endpoint === '/search/multi') {
    url = getApiUrl(`/api/search?query=${encodeURIComponent(query)}&page=${currentPage}`);
  } else if (endpoint.startsWith('/api')) {
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
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      // No podemos usar useNavigate aquí, así que lanzamos un error específico
      throw new Error('Unauthorized');
    }
    const errorData = await response.json();
    throw new Error(errorData.error || "Error al obtener las películas.");
  }

  const data = await response.json();

  // La lógica de procesamiento complejo que estaba en el componente se moverá aquí
  // Por ahora, devolvemos los datos crudos para simplificar el primer paso
  return data;
};

export const useMovies = ({ endpoint, query, currentPage, sortBy, selectedGenre, selectedCountry, selectedDecade }) => {
  return useQuery({
    queryKey: ['movies', { endpoint, query, currentPage, sortBy, selectedGenre, selectedCountry, selectedDecade }],
    queryFn: () => fetchMovies({ endpoint, query, currentPage, sortBy, selectedGenre, selectedCountry, selectedDecade }),
    keepPreviousData: true, // Muy útil para paginación, no muestra un estado de carga al cambiar de página
  });
};
