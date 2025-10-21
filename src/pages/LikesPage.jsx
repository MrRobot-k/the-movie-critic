import React from 'react';
import PaginatedMovieGrid from '../components/PaginatedMovieGrid';

const LikesPage = (props) => {
  return (
    <PaginatedMovieGrid
      {...props}
      title="Mis Películas con 'Me gusta'"
      endpoint="/api/users/likes"
    />
  );
};

export default LikesPage;
