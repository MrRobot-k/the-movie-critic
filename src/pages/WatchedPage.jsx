import React from 'react';
import PaginatedMovieGrid from '../components/PaginatedMovieGrid';

const WatchedPage = (props) => {
  return (
    <PaginatedMovieGrid
      {...props}
      title="Mis Películas Vistas"
      endpoint="/api/users/watched"
    />
  );
};

export default WatchedPage;