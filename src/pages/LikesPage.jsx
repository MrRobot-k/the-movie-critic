import React from 'react';
import PaginatedMovieGrid from '../components/PaginatedMovieGrid';

const LikesPage = ({ 
  isAuthenticated, 
  getMovieDetails, 
  selectedMovie, 
  onCloseDetails, 
  onRateMovie, 
  onToggleLike, 
  onToggleWatchlist 
}) => {
  return (
    <PaginatedMovieGrid
      title="Mis Películas con 'Me gusta'"
      endpoint="/api/users/likes"
      isAuthenticated={isAuthenticated}
      getMovieDetails={getMovieDetails}
      selectedMovie={selectedMovie}
      onCloseDetails={onCloseDetails}
      onRateMovie={onRateMovie}
      onToggleLike={onToggleLike}
      onToggleWatchlist={onToggleWatchlist}
    />
  );
};

export default LikesPage;