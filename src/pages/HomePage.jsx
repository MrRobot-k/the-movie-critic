import React from 'react';
import PaginatedMovieGrid from '../components/PaginatedMovieGrid';

const HomePage = (props) => {
  return (
    <PaginatedMovieGrid
      {...props}
      title="Películas y Series"
      endpoint="/discover/movie"
    />
  );
};

export default HomePage;