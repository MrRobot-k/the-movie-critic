import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const TopDirectorsEditor = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topDirectors, setTopDirectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentTopDirectors();
  }, []);

  const fetchCurrentTopDirectors = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}/top-directors`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Obtener detalles de cada director y normalizar el ID
        const detailedDirectors = await Promise.all(
          data.topDirectors.map(async (item) => {
            const detailRes = await fetch(`${BASE_URL}/person/${item.personId}?api_key=${API_KEY}&language=es-MX`);
            const detail = await detailRes.json();
            return { 
              ...detail,
              id: item.personId, // Normalizar a 'id'
              order: item.order 
            };
          })
        );
        detailedDirectors.sort((a, b) => a.order - b.order);
        setTopDirectors(detailedDirectors);
      }
    } catch (error) {
      console.error('Error fetching top directors:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/search/person?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(searchQuery)}&page=1`
      );
      const data = await response.json();
      // Filtrar solo directores con foto
      const directors = data.results.filter(
        person => person.known_for_department === 'Directing' && person.profile_path
      );
      setSearchResults(directors);
    } catch (error) {
      console.error('Error searching directors:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToTopDirectors = (director) => {
    if (topDirectors.length >= 10) {
      alert('Ya tienes 10 directores en tu Top 10. Elimina uno para agregar otro.');
      return;
    }

    if (topDirectors.some(d => d.id === director.id)) {
      alert('Este director ya está en tu Top 10.');
      return;
    }

    const newDirector = {
      ...director,
      order: topDirectors.length + 1
    };

    setTopDirectors([...topDirectors, newDirector]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const removeFromTopDirectors = (directorId) => {
    const updatedDirectors = topDirectors
      .filter(director => director.id !== directorId)
      .map((director, index) => ({ ...director, order: index + 1 }));
    setTopDirectors(updatedDirectors);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(topDirectors);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedDirectors = items.map((director, index) => ({
      ...director,
      order: index + 1
    }));

    setTopDirectors(reorderedDirectors);
  };

  const saveTopDirectors = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    
    try {
      const topDirectorsData = topDirectors.map((director, index) => ({
        personId: director.id,
        order: index + 1,
      }));

      const response = await fetch('http://localhost:3000/api/users/top-directors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topDirectors: topDirectorsData })
      });

      if (response.ok) {
        alert('Top 10 directores guardado exitosamente!');
        navigate('/profile');
      } else {
        alert('Error al guardar el Top 10');
      }
    } catch (error) {
      console.error('Error saving top directors:', error);
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
        <h1 className="fw-bold mb-0">Editar Mis 10 Mejores Directores</h1>
      </div>

      {/* Búsqueda */}
      <div className="card mb-4" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar directores..."
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
                {searchResults.map(director => (
                  <div key={director.id} className="col-6 col-md-4 col-lg-3">
                    <div className="card text-center" style={{ backgroundColor: '#2c3440', border: '1px solid #454d5d' }}>
                      <img
                        src={`${IMAGE_BASE_URL}/w185${director.profile_path}`}
                        alt={director.name}
                        className="card-img-top rounded-circle mx-auto mt-3"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                      <div className="card-body">
                        <h6 className="card-title text-light small mb-1">
                          {director.name}
                        </h6>
                        <p className="card-text text-muted small mb-2">
                          {director.known_for_department}
                        </p>
                        <button
                          className="btn btn-sm btn-success w-100"
                          onClick={() => addToTopDirectors(director)}
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
          <h5 className="mb-0 text-light">Mi Top 10 Directores</h5>
          <p className="text-muted small mb-0">
            {topDirectors.length}/10 directores • Arrastra para reordenar
          </p>
        </div>
        <div className="card-body">
          {topDirectors.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No hay directores en tu Top 10. Busca y agrega algunos!</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="topDirectors">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {topDirectors.map((director, index) => (
                      <Draggable key={director.id} draggableId={String(director.id)} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="d-flex align-items-center p-3 rounded mb-2"
                            style={{ 
                              backgroundColor: '#2c3440', 
                              border: '1px solid #454d5d',
                              ...provided.draggableProps.style
                            }}
                          >
                            <div className="me-3" style={{ cursor: 'grab' }}>
                              <GripVertical size={20} className="text-muted" />
                            </div>
                            <div className="me-3 text-center">
                              <span className="badge bg-primary fs-6">#{index + 1}</span>
                            </div>
                            <img
                              src={director.profile_path ? `${IMAGE_BASE_URL}/w92${director.profile_path}` : '/placeholder-profile.svg'}
                              alt={director.name}
                              className="rounded-circle me-3"
                              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            />
                            <div className="flex-grow-1">
                              <h6 className="text-light mb-1">{director.name}</h6>
                              <p className="text-muted small mb-0">
                                {director.known_for_department}
                              </p>
                            </div>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeFromTopDirectors(director.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
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
              onClick={saveTopDirectors}
              disabled={saving || topDirectors.length === 0}
            >
              {saving ? 'Guardando...' : 'Guardar Top 10'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopDirectorsEditor;