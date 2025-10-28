// test comment
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./styles.css";
import AuthenticatedHeader from "./components/AuthenticatedHeader";
import GuestHeader from "./components/GuestHeader";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WatchedPage from "./pages/WatchedPage";
import LikesPage from "./pages/LikesPage";
import WatchlistPage from "./pages/WatchlistPage";
import MyListsPage from "./pages/MyListsPage";
import CreateListPage from "./pages/CreateListPage";
import ViewListPage from "./pages/ViewListPage";
import AllListsPage from "./pages/AllListsPage";
import PersonDetailsPage from "./pages/PersonDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import TopMoviesEditor from './pages/TopMoviesEditor';
import TopDirectorsEditor from './pages/TopDirectorsEditor';
import TopActorsEditor from './pages/TopActorsEditor';
import UserSearchPage from './pages/UserSearchPage';
import MembersPage from './pages/MembersPage';
import { getApiUrl } from "./config/api";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profilePicture, setProfilePicture] = useState(localStorage.getItem('profilePicture') || null);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [currentMovieList, setCurrentMovieList] = useState(null);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const isAuth = !!(token && userId);
      console.log('Auth check:', { 
        isAuth, 
        token: !!token, 
        userId,
        path: location.pathname 
      });
      setIsAuthenticated(isAuth);
    };
    checkAuth();
    const handleStorageChange = () => {
      checkAuth();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]);
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      if (location.pathname !== '/') navigate('/');
    }
  };
  const clearSearch = () => {
    setQuery("");
    setSearchQuery("");
  };
  const getMovieDetails = async (id, mediaType, userScore, list = null, index = -1) => {
    try {
      const effectiveMediaType = mediaType;
      const [detailsRes, creditsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BASE_URL}/${effectiveMediaType}/${id}?api_key=${API_KEY}&language=es-MX`),
        fetch(`${import.meta.env.VITE_BASE_URL}/${effectiveMediaType}/${id}/credits?api_key=${API_KEY}&language=es-MX`),
      ]);
      const details = await detailsRes.json();
      const credits = await creditsRes.json();
      setSelectedMovie({
        ...details,
        director: credits.crew.find((person) => person.job === "Director"),
        cast: credits.cast,
        media_type: effectiveMediaType, // Corrected to media_type
        userScore,
      });
      if (list) {
        setCurrentMovieList(list);
        setCurrentMovieIndex(index);
      } else {
        setCurrentMovieList(null);
        setCurrentMovieIndex(-1);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    }
  };
  const onCloseDetails = () => {
    setSelectedMovie(null);
    setCurrentMovieList(null);
    setCurrentMovieIndex(-1);
  };
  const handleNavigateInModal = (direction) => {
    if (!currentMovieList || currentMovieIndex === -1) return;
    const newIndex = direction === 'next' ? currentMovieIndex + 1 : currentMovieIndex - 1;
    if (newIndex >= 0 && newIndex < currentMovieList.length) {
      const nextMovie = currentMovieList[newIndex];
      getMovieDetails(nextMovie.id, nextMovie.mediaType, nextMovie.userScore, currentMovieList, newIndex);
    }
  };
  useEffect(() => {
    if (selectedMovie) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
  }, [selectedMovie]);
  const onRateMovie = async (mediaId, mediaType, score) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(getApiUrl(`/api/media/${mediaId}/rate`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score, mediaType }),
      });
    } catch (error) {
      console.error("Error al calificar:", error.message);
    }
  };
  const onToggleLike = async (id, mediaType) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(getApiUrl(`/api/media/${id}/like`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mediaType }),
      });
    } catch (error) {
      console.error("Error al alternar Me gusta:", error.message);
    }
  };
  const onToggleWatchlist = async (mediaId, mediaType) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(getApiUrl(`/api/media/${mediaId}/watchlist`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mediaType }),
      });
    } catch (error) {
      console.error("Error al alternar Watchlist:", error.message);
    }
  };
  const modalProps = {
    getMovieDetails,
    selectedMovie,
    onCloseDetails,
    isAuthenticated,
    onRateMovie,
    onToggleLike,
    onToggleWatchlist,
    movieList: currentMovieList,
    currentIndex: currentMovieIndex,
    onNavigate: handleNavigateInModal,
  };
  return (
    <div>
      <header>
        {isAuthenticated ? (
          <AuthenticatedHeader
            query={query}
            setQuery={setQuery}
            handleSearch={handleSearch}
            setIsAuthenticated={setIsAuthenticated}
            profilePicture={profilePicture}
          />
        ) : (
          <GuestHeader />
        )}
      </header>
      <Routes>
        <Route path="/" element={<HomePage {...modalProps} query={searchQuery} clearSearch={clearSearch} />} />
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} setProfilePicture={setProfilePicture} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/visto" element={<WatchedPage {...modalProps} />} />
        <Route path="/likes" element={<LikesPage {...modalProps} />} />
        <Route path="/watchlist" element={<WatchlistPage {...modalProps} />} />
        <Route path="/mis-listas" element={<MyListsPage />} />
        <Route path="/crear-lista" element={<CreateListPage />} />
        <Route path="/editar-lista/:listId" element={<CreateListPage />} />
        <Route path="/listas" element={<AllListsPage />} />
        <Route path="/lista/:listId" element={<ViewListPage {...modalProps} />} />
        <Route path="/person/:personId/:role" element={<PersonDetailsPage {...modalProps} />} />
        <Route path="/profile" element={<ProfilePage {...modalProps} profilePicture={profilePicture} setProfilePicture={setProfilePicture} />} />
        <Route path="/profile/:username" element={<ProfilePage {...modalProps} profilePicture={profilePicture} setProfilePicture={setProfilePicture} />} />
        <Route path="/users/search" element={<UserSearchPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/top-movies-editor" element={<TopMoviesEditor />} />
        <Route path="/top-directors-editor" element={<TopDirectorsEditor />} />
        <Route path="/top-actors-editor" element={<TopActorsEditor />} />
      </Routes>
      <Footer />
    </div>
  );
}