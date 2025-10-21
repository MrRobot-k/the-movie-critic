import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const AddToListModal = ({ isOpen, onClose, mediaId, mediaType, onAddToList }) => {
  const [userLists, setUserLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUserLists();
    }
  }, [isOpen]);

  const fetchUserLists = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3000/api/users/lists', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserLists(data.lists || []);
      }
    } catch (err) {
      console.error('Error fetching user lists:', err);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setError('El nombre de la lista es requerido.');
      return;
    }

    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3000/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDescription.trim(),
          items: [{ mediaId, mediaType }]
        }),
      });

      if (response.ok) {
        setNewListName('');
        setNewListDescription('');
        setShowCreateForm(false);
        await fetchUserLists();
        onAddToList();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear la lista.');
      }
    } catch (err) {
      console.error('Error creating list:', err);
      setError('Error de red al crear la lista.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToExistingList = async (listId) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      // Primero obtener la lista actual
      const listResponse = await fetch(`http://localhost:3000/api/lists/${listId}`);
      if (!listResponse.ok) {
        throw new Error('No se pudo obtener la lista.');
      }

      const listData = await listResponse.json();
      const currentItems = listData.list.items || [];

      // Verificar si la película ya está en la lista
      const alreadyInList = currentItems.some(item => 
        item.mediaId === mediaId && item.mediaType === mediaType
      );

      if (alreadyInList) {
        setError('Esta película/serie ya está en la lista.');
        setLoading(false);
        return;
      }

      // Agregar la nueva película a la lista
      const updatedItems = [
        ...currentItems,
        { mediaId, mediaType, order: currentItems.length + 1 }
      ];

      const updateResponse = await fetch(`http://localhost:3000/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: listData.list.name,
          description: listData.list.description,
          isNumbered: listData.list.isNumbered,
          items: updatedItems
        }),
      });

      if (updateResponse.ok) {
        onAddToList();
      } else {
        const errorData = await updateResponse.json();
        setError(errorData.error || 'Error al agregar a la lista.');
      }
    } catch (err) {
      console.error('Error adding to list:', err);
      setError('Error de red al agregar a la lista.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async (listId) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      // Obtener la lista actual
      const listResponse = await fetch(`http://localhost:3000/api/lists/${listId}`);
      if (!listResponse.ok) {
        throw new Error('No se pudo obtener la lista.');
      }

      const listData = await listResponse.json();
      const currentItems = listData.list.items || [];

      // Filtrar la película de la lista
      const updatedItems = currentItems.filter(item => 
        !(item.mediaId === mediaId && item.mediaType === mediaType)
      );

      const updateResponse = await fetch(`http://localhost:3000/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: listData.list.name,
          description: listData.list.description,
          isNumbered: listData.list.isNumbered,
          items: updatedItems
        }),
      });

      if (updateResponse.ok) {
        await fetchUserLists();
        onAddToList();
      } else {
        const errorData = await updateResponse.json();
        setError(errorData.error || 'Error al remover de la lista.');
      }
    } catch (err) {
      console.error('Error removing from list:', err);
      setError('Error de red al remover de la lista.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-dark" onClick={onClose}>
      <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'transparent' }}>
        <div className="modal-dialog modal-dialog-centered modal-md" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content modal-content-custom">
            <div className="modal-header border-secondary">
              <h5 className="modal-title text-light">Agregar a Lista</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Formulario para crear nueva lista */}
              {showCreateForm ? (
                <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#1e2328' }}>
                  <h6 className="text-light mb-3">Crear Nueva Lista</h6>
                  <div className="mb-3">
                    <label className="form-label text-light">Nombre de la lista *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Mi lista de favoritas"
                      style={{ backgroundColor: '#2c3440', color: '#fff', border: '1px solid #454d5d' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-light">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="Descripción opcional..."
                      style={{ backgroundColor: '#2c3440', color: '#fff', border: '1px solid #454d5d' }}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={handleCreateList}
                      disabled={loading}
                    >
                      {loading ? 'Creando...' : 'Crear Lista'}
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => {
                        setShowCreateForm(false);
                        setError('');
                      }}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn btn-outline-primary w-100 mb-4"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus size={16} className="me-2" />
                  Crear Nueva Lista
                </button>
              )}

              {/* Listas existentes */}
              <h6 className="text-light mb-3">Tus Listas</h6>
              {userLists.length === 0 ? (
                <p className="text-muted text-center">No tienes listas creadas.</p>
              ) : (
                <div className="list-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {userLists.map(list => {
                    const isInList = list.items?.some(item => 
                      item.mediaId === mediaId && item.mediaType === mediaType
                    );

                    return (
                      <div key={list.id} className="card mb-2" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
                        <div className="card-body py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="card-title mb-0 text-light">{list.name}</h6>
                              <small className="text-muted">
                                {list.items?.length || 0} películas • {list.description || 'Sin descripción'}
                              </small>
                            </div>
                            <div>
                              {isInList ? (
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleRemoveFromList(list.id)}
                                  disabled={loading}
                                  title="Remover de la lista"
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <button className="btn btn-outline-success btn-sm" onClick={() => handleAddToExistingList(list.id)} disabled={loading} title="Agregar a la lista"><Plus size={14} /></button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;