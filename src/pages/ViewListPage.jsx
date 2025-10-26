import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User as UserIcon, Calendar } from 'lucide-react';
import MovieDetailsModal from '../components/MovieDetailsModal';
import PaginatedListMovies from '../components/PaginatedListMovies';
import { getApiUrl } from '../config/api';
const ViewListPage = ({ getMovieDetails, selectedMovie, onCloseDetails, isAuthenticated, onRateMovie, onToggleLike, onToggleWatchlist, movieList, currentIndex, onNavigate }) => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
      const [userRatings, setUserRatings] = useState([]);
      const [watchedInListCount, setWatchedInListCount] = useState(0);
      const [allLoadedUserRatings, setAllLoadedUserRatings] = useState([]);
      const [allLoadedLikedItems, setAllLoadedLikedItems] = useState([]);
      const [allLoadedWatchedItems, setAllLoadedWatchedItems] = useState([]);
    
      useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          await loadList();
          if (isAuthenticated) {
            const fetchedRatings = await loadWatchedItems(); // Renamed from loadUserRatings
            setAllLoadedUserRatings(fetchedRatings);
            const fetchedLiked = await loadLikedItems();
            setAllLoadedLikedItems(fetchedLiked);
            // Assuming watchedItems are the same as userRatings for now, if not, a separate fetch is needed
            setAllLoadedWatchedItems(fetchedRatings);
          }
          setLoading(false);
        };
        fetchData();
      }, [listId, isAuthenticated]);
    
      useEffect(() => {
        if (list && allLoadedWatchedItems.length > 0) {
          const listMediaIds = list.items.map(item => item.mediaId.toString());
          const watchedMediaIds = new Set(allLoadedWatchedItems.map(rating => rating.mediaId.toString()));
          const count = listMediaIds.filter(id => watchedMediaIds.has(id)).length;
          setWatchedInListCount(count);
        }
      }, [list, allLoadedWatchedItems]);
    
      const loadList = async () => {
        try {
          const response = await fetch(getApiUrl(`/api/lists/${listId}`));
          if (response.ok) {
            const data = await response.json();
            setList(data.list);
          } else setError('Lista no encontrada');
        } catch (error) {
          setError('Error al cargar la lista');
          console.error('Error loading list:', error);
        }
      };
    
      const handleAuthError = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        navigate('/login');
        setError('Tu sesión ha expirado o no es válida. Por favor, inicia sesión de nuevo.');
      };
    
      const loadWatchedItems = async () => {
        const token = localStorage.getItem('token');
        if (!token) return [];
        try {
          const response = await fetch(getApiUrl('/api/users/watched'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUserRatings(data.watchedMovies);
            return data.watchedMovies;
          } else if (response.status === 401 || response.status === 403) handleAuthError();
        } catch (error) {
          console.error('Error loading watched items:', error);
        }
        return [];
      };
    
      const loadLikedItems = async () => {
        const token = localStorage.getItem('token');
        if (!token) return [];
        try {
          const response = await fetch(getApiUrl('/api/users/likes'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            return data.likedItems;
          } else if (response.status === 401 || response.status === 403) handleAuthError();
        } catch (error) {
          console.error('Error loading liked items:', error);
        }
        return [];
      };  const totalMovies = list ? list.items.length : 0;
  const percentageWatched = totalMovies > 0 ? (watchedInListCount / totalMovies) * 100 : 0;
  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '80px' }}>
        <div className="text-center">Cargando...</div>
      </div>
    );
  }
  if (error || !list) {
    return (
      <div className="container" style={{ paddingTop: '80px' }}>
        <div className="alert alert-danger">{error || 'Lista no encontrada'}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    );
  }
  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <div className="mb-5">
        <h1 className="display-5 fw-bold mb-3">{list.name}</h1>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="d-flex align-items-center">
            {list.User.profilePicture ? (
              <img src={getApiUrl(list.User.profilePicture)} alt="Profile" className="rounded-circle me-2" style={{ width: '24px', height: '24px', objectFit: 'cover' }} />
            ) : (
              <img src="/placeholder-profile.svg" alt="Profile" className="rounded-circle me-2" style={{ width: '24px', height: '24px', objectFit: 'cover' }} />
            )}
            <span className="text-light">{list.User.username}</span>
          </div>
          <div className="d-flex align-items-center">
            <Calendar size={20} className="me-2 text-muted" />
            <span className="text-muted">
              {new Date(list.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="badge bg-secondary">{list.items.length} {list.items.length === 1 ? 'película' : 'películas'}</span>
            {list.isNumbered && <span className="badge bg-primary ms-2">Lista Numerada</span>}
          </div>
        </div>
        {list.description && (
          <div className="p-4 rounded" style={{ backgroundColor: '#1e2328' }}>
            <p className="mb-0 text-light">{list.description}</p>
          </div>
        )}
      </div>
      {isAuthenticated && totalMovies > 0 && (
        <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#1e2328' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-light">Has visto {watchedInListCount} de {totalMovies} películas</span>
            <span className="text-light">{percentageWatched.toFixed(0)}%</span>
          </div>
          <div className="progress" style={{ height: '10px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${percentageWatched}%`, backgroundColor: '#00b020' }}
              aria-valuenow={percentageWatched}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      )}
      {list.items && list.items.length > 0 ? (
        <PaginatedListMovies
          listItems={list.items}
          getMovieDetails={getMovieDetails}
          userRatings={allLoadedUserRatings}
          likedItems={allLoadedLikedItems}
          watchedItems={allLoadedWatchedItems}
          isNumbered={list.isNumbered}
        />
      ) : (
        <p>Esta lista no tiene películas.</p>
      )}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={onCloseDetails}
          isAuthenticated={isAuthenticated}
          onRateMovie={onRateMovie}
          onToggleLike={onToggleLike}
          onToggleWatchlist={onToggleWatchlist}
          movieList={movieList}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
export default ViewListPage;