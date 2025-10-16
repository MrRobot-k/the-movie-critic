import React, { useState, useEffect } from 'react';
import MovieDetailsModal from '../components/MovieDetailsModal'; // Import the modal component
import { Star, Heart } from 'lucide-react'; // Importar Heart

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const HomePage = ({ 
  movies, 
  loading, 
  currentPage, 
  totalPages, 
  handlePageChange, 
  getMovieDetails, 
  selectedMovie, 
  onCloseDetails,
  isAuthenticated, // Nueva prop
  onRateMovie, // Nueva prop
  onToggleLike // Nueva prop
}) => {
  return (
    <>
      <main className="container" style={{ paddingTop: '80px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="m-0">Películas Mejor Valoradas</h2>
          <nav>
            <ul className="pagination m-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Anterior</button>
              </li>
              <li className="page-item">
                <span className="page-link">{currentPage} de {totalPages}</span>
              </li>
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Siguiente</button>
              </li>
            </ul>
          </nav>
        </div>

        {loading ? (
          <div className="text-center">Cargando...</div>
        ) : (
          <div className="row g-1 poster-grid">
            {movies.map((movie) => (
              <div key={movie.id} className="col-4 col-md-3 col-lg-2 mb-1">
                <div className="movie-card" onClick={() => getMovieDetails(movie.id)}>
                  <img
                    src={
                      movie.poster_path
                        ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
                        : 'https://via.placeholder.com/342x513?text=No+Poster'
                    }
                    alt={movie.title}
                    className="img-fluid rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-3 my-4 app-footer">
        <p className="text-center">Datos de películas de <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDb</a></p>
        <p className="text-center">Hecho con ❤️ por un cinéfilo</p>
      </footer>

      <MovieDetailsModal 
        movie={selectedMovie} 
        onClose={onCloseDetails}
        isAuthenticated={isAuthenticated} // Pasar la prop
        onRateMovie={onRateMovie} // Pasar la prop
        onToggleLike={onToggleLike} // Pasar la prop
        onToggleWatchlist={onToggleWatchlist} // Pasar la nueva prop
      />
    </>
  );
};

export default HomePage;