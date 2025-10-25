
import React from 'react';
const Footer = () => {
  return (
    <footer className="app-footer mt-5">
      <div className="container">
        <div className="row">
          <div className="col-md-6 mb-3">
            <h5 className="text-white">The Movie Critic</h5>
            <p className="mb-2">
              Tu plataforma para descubrir, calificar y organizar películas y series.
            </p>
            <p className="small">
              Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB API</a>
            </p>
          </div>
          <div className="col-md-3 mb-3">
            <h6 className="text-white mb-3">Enlaces</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="/">Inicio</a>
              </li>
              <li className="mb-2">
                <a href="/visto">Visto</a>
              </li>
              <li className="mb-2">
                <a href="/watchlist">Watchlist</a>
              </li>
              <li className="mb-2">
                <a href="/likes">Likes</a>
              </li>
            </ul>
          </div>
          <div className="col-md-3 mb-3">
            <h6 className="text-white mb-3">Información</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="https://www.themoviedb.org/terms-of-use" target="_blank" rel="noopener noreferrer">
                  Términos de Uso
                </a>
              </li>
              <li className="mb-2">
                <a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Política de Privacidad
                </a>
              </li>
              <li className="mb-2">
                <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
                  TMDB
                </a>
              </li>
            </ul>
          </div>
        </div>
        <hr className="border-secondary my-4" />
        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-0 small">
              &copy; {new Date().getFullYear()} The Movie Critic. Todos los derechos reservados.
            </p>
            <p className="mb-0 small mt-2">
              Este producto utiliza la API de TMDB pero no está avalado ni certificado por TMDB.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;