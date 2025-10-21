import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, GripVertical } from 'lucide-react';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const TopMoviesEditor = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentTopMovies();
  }, []);

  const fetchCurrentTopMovies = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3000/api/users/top-movies', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Obtener detalles de cada película
        const detailedMovies = await Promise.all(
          data.topMovies.map(async (item) => {
            const detailRes = await fetch(`${BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`);
            const detail = await detailRes.json();
            return { 
              ...detail, 
              media_type: item.mediaType, 
              order: item.order 
            };
          })
        );
        detailedMovies.sort((a, b) => a.order - b.order);
        setTopMovies(detailedMovies);
      }
    } catch (error) {
      console.error('Error fetching top movies:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(searchQuery)}&page=1`
      );
      const data = await response.json();
      // Filtrar solo películas
      const movies = data.results.filter(
        item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
      );
      setSearchResults(movies);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToTopMovies = (movie) => {
    if (topMovies.length >= 10) {
      alert('Ya tienes 10 películas en tu Top 10. Elimina una para agregar otra.');
      return;
    }

    if (topMovies.some(m => m.id === movie.id)) {
      alert('Esta película ya está en tu Top 10.');
      return;
    }

    const newMovie = {
      ...movie,
      order: topMovies.length + 1
    };

    setTopMovies([...topMovies, newMovie]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const removeFromTopMovies = (movieId) => {
    const updatedMovies = topMovies
      .filter(movie => movie.id !== movieId)
      .map((movie, index) => ({ ...movie, order: index + 1 }));
    setTopMovies(updatedMovies);
  };

  const moveMovie = (fromIndex, toIndex) => {
    const updatedMovies = [...topMovies];
    const [movedMovie] = updatedMovies.splice(fromIndex, 1);
    updatedMovies.splice(toIndex, 0, movedMovie);
    
    // Actualizar órden
    const reorderedMovies = updatedMovies.map((movie, index) => ({
      ...movie,
      order: index + 1
    }));
    
    setTopMovies(reorderedMovies);
  };

  const saveTopMovies = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    
    try {
      const topMoviesData = topMovies.map(movie => ({
        mediaId: movie.id,
        mediaType: movie.media_type || 'movie',
        order: movie.order
      }));

      const response = await fetch('http://localhost:3000/api/users/top-movies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topMovies: topMoviesData })
      });

      if (response.ok) {
        alert('Top 10 películas guardado exitosamente!');
        navigate('/profile');
      } else {
        alert('Error al guardar el Top 10');
      }
    } catch (error) {
      console.error('Error saving top movies:', error);
      alert('Error al guardar el Top 10');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="d-flex align-items-center mb-4">
        <button 
          className="btn btn-outline-light me-3"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="fw-bold mb-0">Editar Mis 10 Mejores Películas</h1>
      </div>

      {/* Búsqueda */}
      <div className="card mb-4" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar películas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ backgroundColor: '#2c3440', border: '1px solid #454d5d', color: 'white' }}
              />
              <button 
                className="btn btn-primary" 
                type="submit"
                disabled={loading}
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="mt-3">
              <h6 className="text-light mb-3">Resultados de búsqueda:</h6>
              <div className="row g-2">
                {searchResults.map(movie => (
                  <div key={movie.id} className="col-6 col-md-4 col-lg-3">
                    <div className="card" style={{ backgroundColor: '#2c3440', border: '1px solid #454d5d' }}>
                      <img
                        src={`${IMAGE_BASE_URL}/w154${movie.poster_path}`}
                        alt={movie.title || movie.name}
                        className="card-img-top"
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <div className="card-body p-2">
                        <h6 className="card-title text-light small mb-1">
                          {movie.title || movie.name}
                        </h6>
                        <p className="card-text text-muted small mb-1">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 
                           movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : 'N/A'}
                        </p>
                        <button
                          className="btn btn-sm btn-success w-100"
                          onClick={() => addToTopMovies(movie)}
                        >
                          <Plus size={14} className="me-1" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 10 Actual */}
      <div className="card" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
        <div className="card-header">
          <h5 className="mb-0 text-light">Mi Top 10 Películas</h5>
          <p className="text-muted small mb-0">
            {topMovies.length}/10 películas • Arrastra para reordenar
          </p>
        </div>
        <div className="card-body">
          {topMovies.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No hay películas en tu Top 10. Busca y agrega algunas!</p>
            </div>
          ) : (
            <div className="row g-3">
              {topMovies.map((movie, index) => (
                <div key={movie.id} className="col-12">
                  <div 
                    className="d-flex align-items-center p-3 rounded"
                    style={{ backgroundColor: '#2c3440', border: '1px solid #454d5d' }}
                  >
                    <div className="me-3" style={{ cursor: 'grab' }}>
                      <GripVertical size={20} className="text-muted" />
                    </div>
                    <div className="me-3 text-center">
                      <span className="badge bg-primary fs-6">#{index + 1}</span>
                    </div>
                    <img
                      src={movie.poster_path ? `${IMAGE_BASE_URL}/w92${movie.poster_path}` : '/placeholder-poster.svg'}
                      alt={movie.title || movie.name}
                      className="rounded me-3"
                      style={{ width: '60px', height: '90px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="text-light mb-1">{movie.title || movie.name}</h6>
                      <p className="text-muted small mb-0">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 
                         movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : 'N/A'}
                      </p>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeFromTopMovies(movie.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botones de acción */}
          <div className="d-flex justify-content-between mt-4">
            <button
              className="btn btn-outline-light"
              onClick={() => navigate('/profile')}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={saveTopMovies}
              disabled={saving || topMovies.length === 0}
            >
              {saving ? 'Guardando...' : 'Guardar Top 10'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopMoviesEditor;