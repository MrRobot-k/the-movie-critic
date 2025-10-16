import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles.css';
import AuthenticatedHeader from './components/AuthenticatedHeader';
import GuestHeader from './components/GuestHeader';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WatchedPage from './pages/WatchedPage';
import LikesPage from './pages/LikesPage';
import WatchlistPage from './pages/WatchlistPage';
const API_KEY = '3f46d222391647fd5bae513ec8dd5ca4';
const BASE_URL = 'https://api.themoviedb.org/3';
export default function App() {
  // --- STATE MANAGEMENT ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const moviesPerPage = 24;
  const apiMoviesPerPage = 20;

  // --- DATA FETCHING ---
  const fetchTopRatedMovies = async (page) => {
    setLoading(true);
    try {
      const startIndex = (page - 1) * moviesPerPage;
      const endIndex = startIndex + moviesPerPage;
      const startApiPage = Math.floor(startIndex / apiMoviesPerPage) + 1;
      const endApiPage = Math.ceil(endIndex / apiMoviesPerPage);

      const apiPromises = [];
      for (let i = startApiPage; i <= endApiPage; i++) {
        apiPromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=vote_average.desc&vote_count.gte=2000&page=${i}`)
        );
      }

      const responses = await Promise.all(apiPromises);
      const data = await Promise.all(responses.map(res => res.json()));

      const allMovies = data.flatMap(d => d.results);
      const totalMovies = data[0].total_results;
      setTotalPages(Math.ceil(totalMovies / moviesPerPage));

      const moviesForPage = allMovies.slice(startIndex % apiMoviesPerPage, (startIndex % apiMoviesPerPage) + moviesPerPage);
      setMovies(moviesForPage);

    } catch (error) {
      console.error('Error fetching top rated movies:', error);
    }
    setLoading(false);
  };

  const searchMovies = async (searchQuery) => {
    if (!searchQuery.trim()) {
      fetchTopRatedMovies(currentPage);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setMovies(data.results || []);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('Error searching movies:', error);
    }
    setLoading(false);
  };

  const getMovieDetails = async (movieId) => {
    try {
      const [detailsRes, creditsRes] = await Promise.all([
        fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-MX`),
        fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=es-MX`)
      ]);
      const details = await detailsRes.json();
      const credits = await creditsRes.json();

      setSelectedMovie({
        ...details,
        director: credits.crew.find(person => person.job === 'Director'),
        cast: credits.cast
      });
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchTopRatedMovies(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (selectedMovie) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [selectedMovie]);

    // --- HANDLERS ---

    const handleSearch = (e) => {

      e.preventDefault();

      setCurrentPage(1);

      searchMovies(query);

    };

    

    const handlePageChange = (newPage) => {

      if (newPage > 0 && newPage <= totalPages) {

        setCurrentPage(newPage);

      }

    };

  

    const onRateMovie = async (movieId, score) => {

      const token = localStorage.getItem('token');

      if (!token) {

        console.error('No hay token de autenticación disponible.');

        return;

      }

  

      try {

        const response = await fetch(`http://localhost:5000/api/movies/${movieId}/rate`, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json',

            'Authorization': `Bearer ${token}`,

          },

          body: JSON.stringify({ score }),

        });

  

        if (!response.ok) {

          const errorData = await response.json();

          throw new Error(errorData.error || 'Error al guardar la calificación.');

        }

  

        // Opcional: Actualizar la UI o mostrar un mensaje de éxito

        console.log(`Película ${movieId} calificada con ${score} estrellas.`);

  

      } catch (error) {

                console.error('Error al calificar la película:', error.message);

              }

            };

        

            const onToggleLike = async (movieId, isLiked) => {

              const token = localStorage.getItem('token');

              if (!token) {

                console.error('No hay token de autenticación disponible.');

                return;

              }

        

              try {

                const response = await fetch(`http://localhost:5000/api/movies/${movieId}/like`, {

                  method: 'POST',

                  headers: {

                    'Content-Type': 'application/json',

                    'Authorization': `Bearer ${token}`,

                  },

                });

        

                if (!response.ok) {

                  const errorData = await response.json();

                  throw new Error(errorData.error || 'Error al alternar el estado de Me gusta.');

                }

        

                console.log(`Película ${movieId} ${isLiked ? 'marcada como Me gusta' : 'eliminada de Me gusta'}.`);

        

              } catch (error) {

                                console.error('Error al alternar Me gusta:', error.message);

                              }

                            };

                

                            const onToggleWatchlist = async (movieId, isWatchlisted) => {

                              const token = localStorage.getItem('token');

                              if (!token) {

                                console.error('No hay token de autenticación disponible.');

                                return;

                              }

                

                              try {

                                const response = await fetch(`http://localhost:5000/api/movies/${movieId}/watchlist`, {

                                  method: 'POST',

                                  headers: {

                                    'Content-Type': 'application/json',

                                    'Authorization': `Bearer ${token}`,

                                  },

                                });

                

                                if (!response.ok) {

                                  const errorData = await response.json();

                                  throw new Error(errorData.error || 'Error al alternar el estado de Watchlist.');

                                }

                

                                console.log(`Película ${movieId} ${isWatchlisted ? 'añadida a la Watchlist' : 'eliminada de la Watchlist'}.`);

                

                              } catch (error) {

                                console.error('Error al alternar Watchlist:', error.message);

                              }

                            };

                

                            return (

                              <div>

                                <header>

                  {isAuthenticated ? (

                    <AuthenticatedHeader query={query} setQuery={setQuery} handleSearch={handleSearch} />

                  ) : (

                    <GuestHeader />

                  )}

                </header>

        

                <Routes>

                  <Route 

                    path="/"

                    element={(

                      <HomePage 

                        movies={movies}

                        loading={loading}

                        currentPage={currentPage}

                        totalPages={totalPages}

                        handlePageChange={handlePageChange}

                        getMovieDetails={getMovieDetails}

                        selectedMovie={selectedMovie}

                        onCloseDetails={() => setSelectedMovie(null)}

                        isAuthenticated={isAuthenticated}

                                                onRateMovie={onRateMovie}

                                                onToggleLike={onToggleLike}

                                                onToggleWatchlist={onToggleWatchlist}

                                              />

                                            )}

                                          />

                                                  <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />

                                                  <Route path="/register" element={<RegisterPage />} />

                                                  <Route path="/visto" element={<WatchedPage />} />

                                                  <Route path="/likes" element={(

                                            <LikesPage

                                              getMovieDetails={getMovieDetails}

                                              selectedMovie={selectedMovie}

                                              onCloseDetails={() => setSelectedMovie(null)}

                                              isAuthenticated={isAuthenticated}

                                              onRateMovie={onRateMovie}

                                              onToggleLike={onToggleLike}

                                                                    onToggleWatchlist={onToggleWatchlist}

                                                                  />

                                                                )} />

                                                                <Route path="/watchlist" element={(

                                                                  <WatchlistPage

                                                                    getMovieDetails={getMovieDetails}

                                                                    selectedMovie={selectedMovie}

                                                                    onCloseDetails={() => setSelectedMovie(null)}

                                                                    isAuthenticated={isAuthenticated}

                                                                    onRateMovie={onRateMovie}

                                                                    onToggleLike={onToggleLike}

                                                                    onToggleWatchlist={onToggleWatchlist}

                                                                  />

                                                                )} />

                                              

                                                              </Routes>

              </div>

            );

          }