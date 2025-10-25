import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { getApiUrl } from '../config/api';

const TopActorsEditor = () => {
  const [actors, setActors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTopActors();
  }, []);

  const fetchUserTopActors = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    try {
      const response = await fetch(getApiUrl(`/api/users/${userId}/top-actors`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const normalizedActors = data.map(actor => ({
          ...actor,
          id: actor.actorId || actor.id,
        }));
        normalizedActors.sort((a, b) => a.order - b.order);
        setActors(normalizedActors);
      }
    } catch (error) {
      console.error('Error fetching top actors:', error);
    }
  };

  const searchActors = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=es-MX`
      );
      const data = await response.json();
      const actorResults = data.results.filter(
        person => person.known_for_department === 'Acting' && person.profile_path
      );
      setSearchResults(actorResults);
    } catch (error) {
      console.error('Error searching actors:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActor = (actor) => {
    if (actors.length >= 10) {
      alert('Solo puedes tener hasta 10 actores en tu top.');
      return;
    }

    if (actors.find(a => a.id === actor.id)) {
      alert('Este actor ya está en tu lista.');
      return;
    }

    const newActor = {
      id: actor.id,
      name: actor.name,
      profile_path: actor.profile_path,
      known_for_department: actor.known_for_department || 'Acting',
      order: actors.length + 1
    };

    setActors(prev => [...prev, newActor]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeActor = (actorId) => {
    setActors(prev => prev.filter(actor => actor.id !== actorId).map((actor, index) => ({ ...actor, order: index + 1 })));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(actors);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedActors = items.map((actor, index) => ({
      ...actor,
      order: index + 1
    }));

    setActors(reorderedActors);
  };

  const saveTopActors = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No estás autenticado');
      setSaving(false);
      return;
    }

    try {
      const actorsData = actors.map((actor, index) => ({
        actorId: actor.id,
        name: actor.name,
        profile_path: actor.profile_path,
        order: index + 1,
      }));

      const response = await fetch(getApiUrl('/api/users/top-actors'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ actors: actorsData }),
      });

      if (response.ok) {
        alert('Top actores guardado exitosamente!');
        navigate('/profile');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Error al guardar los actores: ${errorData.error || errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error saving top actors:', error);
      alert('Error al guardar los actores.');
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
        <h1 className="fw-bold mb-0">Editar Mis 10 Mejores Actores/Actrices</h1>
      </div>

      <div className="card mb-4" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
        <div className="card-body">
          <form onSubmit={(e) => { e.preventDefault(); searchActors(searchTerm); }}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar actores o actrices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: '#2c3440', border: '1px solid #454d5d', color: 'white' }}
              />
              <button className="btn btn-primary" type="submit" disabled={loading}>
                <Search size={20} />
              </button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-3">
              <h6 className="text-light mb-3">Resultados de búsqueda:</h6>
              <div className="row g-2">
                {searchResults.map(actor => (
                  <div key={actor.id} className="col-6 col-md-4 col-lg-3">
                    <div className="card text-center" style={{ backgroundColor: '#2c3440', border: '1px solid #454d5d' }}>
                      <img
                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : '/placeholder-profile.svg'}
                        alt={actor.name}
                        className="card-img-top rounded-circle mx-auto mt-3"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                      <div className="card-body">
                        <h6 className="card-title text-light small mb-1">{actor.name}</h6>
                        <button className="btn btn-sm btn-success w-100" onClick={() => addActor(actor)}>
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

      <div className="card" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
        <div className="card-header">
          <h5 className="mb-0 text-light">Mi Top 10 Actores/Actrices</h5>
          <p className="text-muted small mb-0">{actors.length}/10 actores • Arrastra para reordenar</p>
        </div>
        <div className="card-body">
          {actors.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No hay actores en tu Top 10. Busca y agrega algunos!</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="topActors">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {actors.map((actor, index) => (
                      <Draggable key={actor.id} draggableId={String(actor.id)} index={index}>
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
                              src={actor.profile_path ? `https://image.tmdb.org/t/p/w92${actor.profile_path}` : '/placeholder-profile.svg'}
                              alt={actor.name}
                              className="rounded-circle me-3"
                              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            />
                            <div className="flex-grow-1">
                              <h6 className="text-light mb-1">{actor.name}</h6>
                            </div>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => removeActor(actor.id)}>
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

          <div className="d-flex justify-content-between mt-4">
            <button className="btn btn-outline-light" onClick={() => navigate('/profile')}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={saveTopActors} disabled={saving || actors.length === 0}>
              {saving ? 'Guardando...' : 'Guardar Top 10'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopActorsEditor;