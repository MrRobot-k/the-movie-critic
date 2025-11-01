import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Film, User } from 'lucide-react';
import { getApiUrl } from '../config/api';
const API_KEY = '3f46d222391647fd5bae513ec8dd5ca4';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const AllListsPage = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [listsWithPosters, setListsWithPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    loadAllLists();
  }, []);
  const loadAllLists = async () => {
    try {
      const response = await fetch(getApiUrl('/api/lists'));
      if (response.ok) {
        const data = await response.json();
        setLists(data.lists);
        const listsWithPostersPromises = data.lists.map(async (list) => {
          const items = list.items.slice(0, 4);
          const postersPromises = items.map(async (item) => {
            try {
              const detailRes = await fetch(
                `${import.meta.env.VITE_BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`
              );
              const detail = await detailRes.json();
              return detail.poster_path;
            } catch {
              return null;
            }
          });
          const posters = await Promise.all(postersPromises);
          return { ...list, posters: posters.filter(p => p) };
        });
        const listsWithPostersData = await Promise.all(listsWithPostersPromises);
        setListsWithPosters(listsWithPostersData);
      } else setError('Error al cargar las listas');
    } catch (error) {
      setError('Error al cargar las listas');
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) return (
      <div className="container" style={{ paddingTop: '80px' }}>
        <div className="text-center">Cargando...</div>
      </div>
    );
  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Todas las Listas</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {listsWithPosters.length === 0 ? (
        <div className="text-center py-5">
          <Film size={64} className="text-muted mb-3" />
          <h4>No hay listas para mostrar.</h4>
        </div>
      ) : (
        <div className="row">
          {listsWithPosters.map((list) => (
            <div key={list.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100" style={{ backgroundColor: '#1e2328', border: '1px solid #454d5d' }}>
                <div className="card-img-top" style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  {list.posters && list.posters.length > 0 ? (
                    <div className="d-flex h-100">
                      {list.posters.slice(0, 4).map((poster, idx) => (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            backgroundImage: `url(${IMAGE_BASE_URL}/w342${poster})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 bg-dark">
                      <Film size={48} className="text-muted" />
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <Link
                    to={`/lista/${list.id}`}
                    className="text-decoration-none"
                  >
                    <h5 className="card-title text-light mb-2">{list.name}</h5>
                  </Link>
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-muted small">{list.User.username}</span>
                  </div>
                  {list.description && (
                    <p className="card-text text-muted small">
                      {list.description.length > 100
                        ? `${list.description.substring(0, 100)}...`
                        : list.description}
                    </p>
                  )}
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <div>
                      <small className="text-muted">
                        {list.items.length} {list.items.length === 1 ? 'película' : 'películas'}
                      </small>
                      {list.isNumbered && (
                        <span className="badge bg-primary ms-2">Numerada</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-top border-secondary">
                  <small className="text-muted">
                    Creada el {new Date(list.createdAt).toLocaleDateString('es-ES')}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default AllListsPage;