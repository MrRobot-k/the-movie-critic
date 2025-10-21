import React from 'react';
import PaginatedMovieGrid from '../components/PaginatedMovieGrid';

const WatchlistPage = (props) => {
  return (
    <PaginatedMovieGrid
      {...props}
      title="Mi Watchlist"
      endpoint="/api/users/watchlist"
    />
  );
};

export default WatchlistPage;