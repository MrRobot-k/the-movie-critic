import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TopActorsEditor = () => {
  const [actors, setActors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTopActors();
  }, []);

  const fetchUserTopActors = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3000/api/user/top-actors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActors(data);
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
      setSearchResults(data.results || []);
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
      character: actor.character || 'Actor/Actriz',
      order: actors.length
    };

    setActors(prev => [...prev, newActor]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeActor = (actorId) => {
    setActors(prev => prev.filter(actor => actor.id !== actorId));
  };

  const moveActor = (index, direction) => {
    const newActors = [...actors];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < newActors.length) {
      [newActors[index], newActors[newIndex]] = [newActors[newIndex], newActors[index]];
      setActors(newActors);
    }
  };

  const saveTopActors = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3000/api/user/top-actors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ actors: actors.map((actor, index) => ({ ...actor, order: index })) }),
      });

      if (response.ok) {
        alert('Top actores guardado exitosamente!');
        navigate('/profile');
      } else alert('Error al guardar los actores.');
    } catch (error) {
      console.error('Error saving top actors:', error);
      alert('Error al guardar los actores.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Mi Top 10 Actores/Actrices</h1>
          <button
            onClick={() => navigate('/profile')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Volver al Perfil
          </button>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchActors(e.target.value);
            }}
            placeholder="Buscar actores o actrices..."
            className="w-full p-3 bg-gray-700 text-white rounded-lg"
          />
        </div>

        {/* Resultados de búsqueda */}
        {loading && <div className="text-white text-center">Buscando...</div>}
        {searchResults.length > 0 && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-white mb-3">Resultados de búsqueda:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.slice(0, 6).map(actor => (
                <div key={actor.id} className="flex items-center bg-gray-700 p-3 rounded">
                  <img
                    src={actor.profile_path ? `https://image.tmdb.org/t/p/w92${actor.profile_path}` : '/placeholder-profile.svg'}
                    alt={actor.name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                  <span className="text-white flex-grow">{actor.name}</span>
                  <button
                    onClick={() => addActor(actor)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista actual */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Tu Top {actors.length}/10
          </h3>
          
          {actors.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Comienza a agregar actores y actrices a tu top 10.
            </p>
          ) : (
            <div className="space-y-3">
              {actors.map((actor, index) => (
                <div key={actor.id} className="flex items-center bg-gray-700 p-4 rounded">
                  <div className="flex items-center flex-grow">
                    <span className="text-yellow-400 font-bold w-8 text-lg">
                      #{index + 1}
                    </span>
                    <img
                      src={actor.profile_path ? `https://image.tmdb.org/t/p/w92${actor.profile_path}` : '/placeholder-profile.svg'}
                      alt={actor.name}
                      className="w-16 h-16 rounded-full object-cover mx-4"
                    />
                    <div>
                      <h4 className="text-white font-semibold text-lg">{actor.name}</h4>
                      <p className="text-gray-400 text-sm">{actor.character}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => moveActor(index, -1)}
                      disabled={index === 0}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveActor(index, 1)}
                      disabled={index === actors.length - 1}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeActor(actor.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={() => navigate('/profile')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={saveTopActors}
            disabled={actors.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded"
          >
            Guardar Top Actores
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopActorsEditor;