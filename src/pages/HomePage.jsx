import React from 'react';
import PaginatedMovieGrid from '../components/PaginatedMovieGrid';

const HomePage = (props) => {
  if (props.query) {
    return (
      <div>
        <div className="container my-4">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Resultados de la búsqueda</h2>
            <button className="btn btn-secondary" onClick={props.clearSearch}>
              Limpiar búsqueda
            </button>
          </div>
        </div>
        <PaginatedMovieGrid
          {...props}
          key={props.query} 
          title=""
          endpoint="/search/multi"
          query={props.query}
        />
      </div>
    );
  }

  return (
    <PaginatedMovieGrid
      {...props}
      title="Descubrir nuevas películas"
      endpoint="/discover/movie"
    />
  );
};

export default HomePage;