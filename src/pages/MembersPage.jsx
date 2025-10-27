import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import placeholderProfile from '/placeholder-profile.svg';

const MembersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(getApiUrl('/api/users'));
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Miembros</h1>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="list-group">
          {users.map((user) => (
            <Link
              key={user.id}
              to={`/profile/${user.username}`}
              className="list-group-item list-group-item-action"
            >
              <div className="d-flex w-100 justify-content-start align-items-center">
                <img
                  src={user.profilePicture ? getApiUrl(user.profilePicture) : placeholderProfile}
                  alt={`${user.username}'s profile`}
                  className="rounded-circle me-3"
                  width="50"
                  height="50"
                />
                <div>
                  <h5 className="mb-1">{user.username}</h5>
                  <p className="mb-1">{user.slogan}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;
