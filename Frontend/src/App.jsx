import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
const TMDB_API_URL = "https://api.themoviedb.org/3";

const tmdbOptions = {
  headers: {
    accept: "application/json",
  },
};

const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  18: "Drama",
  14: "Fantasy",
  27: "Horror",
  878: "Sci-Fi",
  53: "Thriller",
  10749: "Romance",
  9648: "Mystery",
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [watchMovie, setWatchMovie] = useState(null);
  const [myList, setMyList] = useState([]);
  const [showMyList, setShowMyList] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

useEffect(() => {
  if (!search.trim()) {
    setSearchResults([]);
    return;
  }

  const searchMovies = async () => {
    try {
      const response = await fetch(
        `${TMDB_API_URL}/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(search)}`,
        tmdbOptions
      );

      const data = await response.json();
      console.log("Search Query:", search);
      console.log("Search Results:", data.results);

      const formattedResults = data.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.slice(0, 4) || "N/A",
        genre: movie.genre_ids?.map((id) => genreMap[id]).filter(Boolean).join(", ") || "Movie",
        rating: movie.vote_average?.toFixed(1) || "N/A",
        category: "Search",
        description: movie.overview,
        image: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "",
          backdrop: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
          : "",
        trailer: "",
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Search API Error:", error);
    }
  };

  searchMovies();
}, [search]);
  useEffect(() => {
    const savedList = localStorage.getItem("myNetflixList");

    if (savedList) {
      setMyList(JSON.parse(savedList));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("myNetflixList", JSON.stringify(myList));
  }, [myList]);

  const addToMyList = (movie) => {
    const alreadyAdded = myList.some(
      (item) => item.title === movie.title
    );

    if (!alreadyAdded) {
      setMyList([...myList, movie]);
    }
  };

  const removeFromMyList = (movie) => {
  setMyList(
    myList.filter((item) => item.title !== movie.title)
  );
};
 useEffect(() => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  const fetchMovies = async () => {
  setLoading(true);
  setError("");
    try {
      const requests = [
        fetch(
          `${TMDB_API_URL}/trending/movie/week?api_key=${apiKey}`,
          tmdbOptions
        ),
        fetch(
          `${TMDB_API_URL}/movie/popular?api_key=${apiKey}`,
          tmdbOptions
        ),
        fetch(
          `${TMDB_API_URL}/discover/movie?api_key=${apiKey}&with_genres=28`,
          tmdbOptions
        ),
        fetch(
          `${TMDB_API_URL}/discover/movie?api_key=${apiKey}&with_genres=878`,
          tmdbOptions
        ),
      ];

      const responses = await Promise.allSettled(requests);

      const data = await Promise.all(
  responses.map((response) =>
    response.status === "fulfilled"
      ? response.value.json()
      : { results: [] }
  )
);

      const categories = [
        "Trending Now",
        "Popular Movies",
        "Action Movies",
        "Sci-Fi Movies",
      ];

      const allMovies = data.flatMap((result, index) =>
        result.results.map((movie) => ({
          title: movie.title,
          id: movie.id,
          year: movie.release_date?.slice(0, 4) || "N/A",
          genre: movie.genre_ids?.map((id) => genreMap[id]).filter(Boolean).join(", ") || "Movie",
          rating: movie.vote_average?.toFixed(1) || "N/A",
          category: categories[index],
          description: movie.overview,
          image: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "",
            backdrop: movie.backdrop_path
           ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
           : "",
          trailer: "",
        }))
      );

      setMovies(allMovies);
      setLoading(false);
      setHeroMovie({
  title: "Stranger Things",
  year: "2016",
  genre: "Drama, Sci-Fi",
  rating: "8.6",
  description:
    "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
  backdrop:
    "https://image.tmdb.org/t/p/original/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
});
    } catch (error) {
      console.error("TMDB API Error:", error);
      setError("Something went wrong. Please try again.");
    }
  };

  fetchMovies();
}, []);
useEffect(() => {
  const fetchTVShows = async () => {
    setLoading(true);
    setError("");

    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;

      // Fetch multiple pages so the TV Shows page contains several rows.
      const pages = [1, 2, 3, 4];
      const responses = await Promise.allSettled(
        pages.map((page) =>
          fetch(
            `${TMDB_API_URL}/tv/popular?api_key=${apiKey}&page=${page}`,
            tmdbOptions
          )
        )
      );

      const pageData = await Promise.all(
        responses.map(async (result) => {
          if (result.status !== "fulfilled" || !result.value.ok) {
            return { results: [] };
          }
          return result.value.json();
        })
      );

      const allShows = pageData.flatMap((data) => data.results || []);
      const uniqueShows = Array.from(
        new Map(allShows.map((show) => [show.id, show])).values()
      ).filter((show) => show.poster_path);

      const formattedShows = uniqueShows.map((show) => ({
        id: show.id,
        mediaType: "tv",
        title: show.name,
        year: show.first_air_date?.slice(0, 4) || "N/A",
        genre: "TV Show",
        rating: show.vote_average?.toFixed(1) || "N/A",
        description: show.overview || "No description available.",
        image: show.poster_path
          ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
          : "",
        backdrop: show.backdrop_path
          ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
          : "",
      }));

      setTvShows(formattedShows);
    } catch (error) {
      console.error("TV Shows API Error:", error);
      setError("Unable to load TV Shows. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  fetchTVShows();
}, []);

// Automatically rotate the home hero through trending movies every 5 seconds.
useEffect(() => {
  const carouselMovies = movies.filter((movie) => movie.category === "Trending Now");
  if (!carouselMovies.length) return;

  setHeroMovie(carouselMovies[heroIndex % carouselMovies.length]);
  const timer = window.setInterval(() => {
    setHeroIndex((current) => (current + 1) % carouselMovies.length);
  }, 5000);

  return () => window.clearInterval(timer);
}, [movies, heroIndex]);

  const isInMyList = (movie) => {
    return myList.some(
      (item) => item.title === movie.title
    );
  };
const playMovie = async (movie) => {
  try {
    const response = await fetch(
      `${TMDB_API_URL}/${movie.mediaType === "tv" ? "tv" : "movie"}/${movie.id}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
      tmdbOptions
    );

    const data = await response.json();

    const trailer = data.results.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official === true
    );

    const anyTrailer = data.results.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer"
    );

    setWatchMovie({
      ...movie,
      trailer: (trailer || anyTrailer)?.key || "",
    });
  } catch (error) {
    console.error("Trailer API Error:", error);
    setWatchMovie(movie);
  }
};
const playHero = async () => {
  if (heroMovie?.id) {
    await playMovie({ ...heroMovie, mediaType: heroMovie.mediaType || "movie" });
    return;
  }
  try {
    const response = await fetch(
      `${TMDB_API_URL}/tv/66732/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
      tmdbOptions
    );

    const data = await response.json();

    const trailer = data.results.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer"
    );

    setWatchMovie({
      title: "Stranger Things",
      year: "2022",
      genre: "Drama, Sci-Fi",
      rating: "8.7",
      description:
        "When a young boy disappears, his friends discover a mysterious world filled with secrets, danger and supernatural events.",
      trailer: trailer?.key || "",
    });
  } catch (error) {
    console.error("Hero Trailer Error:", error);
  }
};

const openHeroDetails = async () => {
  if (heroMovie?.id) {
    setSelectedMovie(heroMovie);
    return;
  }
  try {
    const response = await fetch(
      `${TMDB_API_URL}/tv/66732?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
      tmdbOptions
    );

    const data = await response.json();

    setSelectedMovie({
      id: data.id,
      title: data.name,
      year: data.first_air_date?.slice(0, 4) || "N/A",
      genre: "Drama, Sci-Fi",
      rating: data.vote_average?.toFixed(1) || "N/A",
      description: data.overview,
      image: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : "",
      trailer: "",
    });
  } catch (error) {
    console.error("Hero Details Error:", error);
  }
};
  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  // WATCH PAGE
  if (watchMovie) {
    return (
      <div className="watch-page">
        <button className="back-btn" onClick={() => setWatchMovie(null)}>← Back</button>
        <h1>{watchMovie.title}</h1>
        <p className="watch-subtitle">Official Trailer</p>
        <div className="video-container">
          {watchMovie.trailer ? (
            <iframe
              src={`https://www.youtube.com/embed/${watchMovie.trailer}?autoplay=1`}
              title={`${watchMovie.title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <p className="no-results">Trailer unavailable for this title.</p>
          )}
        </div>
        <div className="watch-info">
          <h2>{watchMovie.title}</h2>
          <p>{watchMovie.year} • {watchMovie.genre} • ⭐ {watchMovie.rating}</p>
          <p>{watchMovie.description}</p>
        </div>
      </div>
    );
  }

  // DETAILS PAGE
  if (selectedMovie) {
    return (
      <div className="details-page">
        <button className="back-btn" onClick={() => setSelectedMovie(null)}>← Back</button>
        <div className="details-content">
          <img className="details-poster" src={selectedMovie.image} alt={selectedMovie.title} />
          <div className="details-info">
            <p className="details-label">{selectedMovie.mediaType === "tv" ? "TV SHOW" : "MOVIE"}</p>
            <h1>{selectedMovie.title}</h1>
            <div className="movie-meta">
              <span>{selectedMovie.year}</span><span>•</span><span>{selectedMovie.genre}</span><span>•</span><span>⭐ {selectedMovie.rating}</span>
            </div>
            <p className="details-description">{selectedMovie.description}</p>
            <div className="buttons">
              <button className="play-btn" onClick={() => playMovie(selectedMovie)}>▶ Play Trailer</button>
              {isInMyList(selectedMovie) ? (
                <button className="info-btn" onClick={() => removeFromMyList(selectedMovie)}>✓ Added</button>
              ) : (
                <button className="info-btn" onClick={() => addToMyList(selectedMovie)}>+ Add to My List</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const isHomePage = currentPath === "/";
  const isMoviesPage = currentPath === "/movies";
  const isTVPage = currentPath === "/tv-shows";
  const isMyListPage = currentPath === "/my-list";

  const renderMovieCards = (items, grid = false) => (
    <div className={grid ? "tv-show-grid" : "movie-row"}>
      {items.map((movie) => (
        <div className="movie-card" key={`${movie.mediaType || "movie"}-${movie.id ?? movie.title}`} onClick={() => setSelectedMovie(movie)}>
          <img src={movie.image} alt={movie.title} />
          <div className="movie-info">
            <h3>{movie.title}</h3>
            <p>{movie.year} • {movie.genre} • ⭐ {movie.rating}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="app">
      <nav className="navbar">
        <Link className="logo" to="/" onClick={() => setSearch("")}>MINI NETFLIX</Link>
        <div className="nav-links">
          <span onClick={() => { setSearch(""); navigate("/"); }}>Home</span>
          <span onClick={() => { setSearch(""); navigate("/movies"); }}>Movies</span>
          <span onClick={() => { setSearch(""); navigate("/tv-shows"); }}>TV Shows</span>
          <span onClick={() => { setSearch(""); navigate("/my-list"); }}>My List ({myList.length})</span>
        </div>
        <input
          type="text"
          placeholder="Search movies..."
          className="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value.trim()) navigate("/movies");
          }}
        />
      </nav>

      {search.trim() ? (
        <section className="movie-section">
          <h2>Search Results for "{search}"</h2>
          {searchResults.length === 0 ? (
            <p className="no-results">No movies found 😕</p>
          ) : renderMovieCards(searchResults)}
        </section>
      ) : isHomePage ? (
        <>
          <section className="hero" style={{
            backgroundImage: heroMovie?.backdrop
              ? `linear-gradient(to right, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.75) 35%, rgba(0, 0, 0, 0.25) 75%, rgba(0, 0, 0, 0.9) 100%), url("${heroMovie.backdrop}")`
              : undefined,
          }}>
            <div className="hero-content">
              <p className="featured">MINI NETFLIX FEATURED</p>
              <h2>{heroMovie?.title || "Stranger Things"}</h2>
              <div className="hero-meta"><span>{heroMovie?.year || "2022"}</span><span>•</span><span>{heroMovie?.genre || "Drama, Sci-Fi"}</span></div>
              <p className="description">{heroMovie?.description || "Discover amazing movies and stories."}</p>
              <div className="buttons">
                <button className="play-btn" onClick={playHero}>▶ Play</button>
                <button className="info-btn" onClick={openHeroDetails}>ⓘ More Info</button>
              </div>
            </div>
          </section>
          <section className="movie-section">
            {loading && <div className="loading-message">Loading...</div>}
            {error && <div className="error-message">{error}</div>}
            <h2>Trending Now</h2>
            {renderMovieCards(movies.filter((movie) => movie.category === "Trending Now"))}
            <h2>Popular Movies</h2>
            {renderMovieCards(movies.filter((movie) => movie.category === "Popular Movies"))}
            <h2>Action Movies</h2>
            {renderMovieCards(movies.filter((movie) => movie.category === "Action Movies"))}
            <h2>Sci-Fi Movies</h2>
            {renderMovieCards(movies.filter((movie) => movie.category === "Sci-Fi Movies"))}
            <h2>Popular TV Shows</h2>
            {renderMovieCards(tvShows.map((show) => ({ ...show, mediaType: "tv" })))}
          </section>
        </>
      ) : isMoviesPage ? (
        <section className="movie-section">
          <h1>Movies</h1>
          {loading && <div className="loading-message">Loading...</div>}
          {error && <div className="error-message">{error}</div>}
          {["Trending Now", "Popular Movies", "Action Movies", "Sci-Fi Movies"].map((category) => {
            const categoryMovies = movies.filter((movie) => movie.category === category);
            return (
              <div className="category-row" key={category}>
                <h2>{category}</h2>
                {categoryMovies.length ? renderMovieCards(categoryMovies) : <p className="no-results">No movies available.</p>}
              </div>
            );
          })}
        </section>
      ) : isTVPage ? (
        <section className="movie-section tv-shows-page">
          <h1>TV Shows</h1>
          <h2>Popular TV Shows</h2>
          {loading && <div className="loading-message">Loading TV shows...</div>}
          {error && <div className="error-message">{error}</div>}
          {!loading && tvShows.length === 0 ? (
            <p className="no-results">No TV shows available right now.</p>
          ) : (
            <div className="tv-show-grid">
              {tvShows.map((show) => (
                <div
                  className="movie-card"
                  key={`tv-${show.id}`}
                  onClick={() => setSelectedMovie({ ...show, mediaType: "tv" })}
                >
                  <img src={show.image} alt={show.title} loading="lazy" />
                  <div className="movie-info">
                    <h3>{show.title}</h3>
                    <p>{show.year} • TV Show • ⭐ {show.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : isMyListPage ? (
        <section className="movie-section my-list-page">
          <h1>❤️ My List</h1>
          {myList.length === 0 ? <p className="no-results">Your list is empty. Add some movies! 🎬</p> : renderMovieCards(myList)}
        </section>
      ) : (
        <section className="movie-section">
          <h1>Page not found</h1>
          <Link to="/">Return Home</Link>
        </section>
      )}
    </div>
  );
}

export default App;
