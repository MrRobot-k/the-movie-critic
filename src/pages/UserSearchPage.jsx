import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const UserSearchPage = () => {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const query = searchParams.get('q');

  useEffect(() => {
    if (query) {
      const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
          const response = await fetch(`http://localhost:3000/api/users/search?q=${encodeURIComponent(query)}`);
          if (response.ok) {
            const data = await response.json();
            setUsers(data);
          } else {
            setError('Error al buscar usuarios.');
          }
        } catch (err) {
          setError('Error de red al buscar usuarios.');
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [query]);

  return (
    <div className="container my-5">
      <h1 className="fw-bold mb-4">Resultados de búsqueda para "{query}"</h1>
      {loading && <p>Buscando...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {users.length > 0 ? (
        <div className="list-group">
          {users.map(user => (
            <Link key={user.id} to={`/profile/${user.id}`} className="list-group-item list-group-item-action d-flex align-items-center">
              <img
                src={user.profilePicture ? `http://localhost:3000${user.profilePicture}` : '/placeholder-profile.svg'}
                alt={user.username}
                className="rounded-circle me-3"
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
              />
              <span className="fw-bold">{user.username}</span>
            </Link>
          ))}
        </div>
      ) : (
        !loading && <p>No se encontraron usuarios.</p>
      )}
    </div>
  );
};

export default UserSearchPage;
