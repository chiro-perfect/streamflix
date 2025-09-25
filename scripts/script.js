// Fichier : script.js

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================
    // CONFIGURATION TMDB API
    // ===================================================
    const API_KEY = 'e4b90327227c88daac14c0bd0c1f93cd';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
    const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNGI5MDMyNzIyN2M4OGRhYWMxNGMwYmQwYzFmOTNjZCIsIm5iZiI6MTc1ODY0ODMyMS43NDg5OTk4LCJzdWIiOiI2OGQyZDgwMTJhNWU3YzBhNDVjZWNmZWUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.aylEitwtAH0w4XRk8izJNNkF_bet8sxiC9iI-zSdHbU';
    
    const POSTER_SIZE = 'w300'; 

    // Éléments de la Modale
    const detailModalOverlay = document.getElementById('detail-modal-overlay');
    const detailModalContent = document.getElementById('detail-modal');
    // Le bouton de fermeture est maintenant géré dynamiquement car il est recréé
    const closeModalButton = document.getElementById('close-modal'); 
    
    // ===================================================
    // FONCTIONS API
    // ===================================================

    async function apiFetch(url) {
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${BEARER_TOKEN}`
            }
        };
        
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Erreur API : ${response.status}`);
        }
        return response.json();
    }


    // ===================================================
    // CHARGEMENT DES FILMS (LIGNES)
    // ===================================================
    async function fetchMovies(endpoint, containerSelector, isHero = false) {
        try {
            const url = `${BASE_URL}/${endpoint}?language=fr-FR&page=1`;
            const data = await apiFetch(url);
            const movies = data.results;

            if (isHero && movies.length > 0) {
                // Le Hero prend un film au hasard dans le top 10 pour la bannière
                const heroMovie = movies[Math.floor(Math.random() * Math.min(10, movies.length))];
                updateHeroSection(heroMovie);
            } 
            
            displayMovieCards(movies, containerSelector);

        } catch (error) {
            console.error('Erreur lors du chargement des films:', error);
            const container = document.querySelector(containerSelector);
            if (container) {
                container.innerHTML = '<p style="color:red;padding:1rem;">Erreur de chargement des données. Veuillez vérifier le Token API.</p>';
            }
        }
    }


    // ===================================================
    // GESTION DU HERO SECTION
    // ===================================================
    function updateHeroSection(movie) {
        const heroSection = document.querySelector('.hero-section');
        const titleElement = document.querySelector('.hero-title');
        const descriptionElement = document.querySelector('.hero-description');

        const backdropPath = movie.backdrop_path || movie.poster_path;
        if (backdropPath) {
            heroSection.style.backgroundImage = `url('${IMAGE_BASE_URL}/original${backdropPath}')`;
        }
        
        titleElement.textContent = movie.title || movie.name;
        const overview = movie.overview || "Aucune description disponible. Plongez dans l'action, l'aventure et l'émotion.";
        descriptionElement.textContent = overview.substring(0, 200) + (overview.length > 200 ? '...' : '');
        
        const mediaType = movie.media_type || 'movie';
        document.querySelector('.primary-button').onclick = () => showMovieDetails(movie.id, mediaType);
    }

    // ===================================================
    // AFFICHAGE DES CARTES DE FILMS & GESTION DU CLIC
    // ===================================================
    function displayMovieCards(movies, containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = ''; 

        movies.slice(0, 15).forEach(movie => { 
            if (!movie.poster_path) return; 

            // Déduire le type de média
            let mediaType = movie.media_type;
            if (!mediaType) {
                if (containerSelector.includes('tv')) mediaType = 'tv';
                else if (containerSelector.includes('movie')) mediaType = 'movie';
                else mediaType = 'movie'; 
            }
            
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.setAttribute('tabindex', '0'); 
            card.dataset.movieId = movie.id; 
            card.dataset.mediaType = mediaType; 

            const posterUrl = `${IMAGE_BASE_URL}/${POSTER_SIZE}${movie.poster_path}`;
            const title = movie.title || movie.name;

            card.innerHTML = `
                <img src="${posterUrl}" alt="Affiche du film : ${title}">
                <div class="card-title-overlay">${title}</div>
            `;
            
            card.addEventListener('click', () => {
                showMovieDetails(movie.id, mediaType);
            });
            
            container.appendChild(card);
        });
    }

    // ===================================================
    // GESTION DES DÉTAILS DU FILM (MODALE)
    // ===================================================
    async function showMovieDetails(id, type) {
        detailModalOverlay.classList.add('visible');
        detailModalOverlay.classList.remove('hidden');
        detailModalContent.innerHTML = '<button id="close-modal" aria-label="Fermer la fenêtre de détail" class="close-button text-button">✕</button><p id="modal-loading-message">Chargement des détails du film...</p>';

        try {
            // Requête pour obtenir les détails et les crédits
            const url = `${BASE_URL}/${type}/${id}?language=fr-FR&append_to_response=credits`;
            const data = await apiFetch(url);
            
            renderModalContent(data, type);

        } catch (error) {
            console.error(`Erreur lors du chargement des détails du ${type}:`, error);
            document.getElementById('modal-loading-message').textContent = 'Impossible de charger les détails. Veuillez réessayer.';
        }
    }

    function renderModalContent(item, type) {
        // Extraction des données de l'API
        const title = item.title || item.name;
        const releaseDate = (item.release_date || item.first_air_date || 'N/A').split('-')[0];
        const runtime = item.runtime || (item.episode_run_time ? `${item.episode_run_time[0]} min (par épisode)` : null);
        const voteAverage = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
        const posterPath = item.poster_path;
        const overview = item.overview || "Aucune description disponible.";
        const genres = item.genres.map(g => `<span>${g.name}</span>`).join('');
        
        const director = item.credits.crew.find(crew => crew.job === 'Director' || crew.job === 'Creator');
        const cast = item.credits.cast.slice(0, 5).map(c => c.name).join(', ');
        const isMovie = type === 'movie';
        
        // Contenu par défaut (boutons)
        let mediaPlayerContent = `
            <div class="detail-player-area">
                <button class="button primary-button" style="margin-right: 1rem;">▶ Regarder</button>
                <button class="button secondary-button">+ Ma Liste</button>
            </div>
        `;
        
        let modalStyleModifier = ''; // Contrôle la classe CSS de la modale

        // ***************************************************************
        // LOGIQUE D'AFFICHAGE DU LECTEUR DIRECT POUR LES QUATRE FANTASTIQUES
        // ***************************************************************
        if (title.includes('Fantastique') || title.includes('Fantastic Four')) {
            
            // Appliquer le style "mode lecteur" (plus large)
            modalStyleModifier = ' modal-mode-lecteur';
            
            // L'URL MP4 directe trouvée dans le code du lecteur
            const directVideoUrl = "https://m60.uqload.cx/3rfk3vgaovwkq4drdl26fnniamsi2rdxkwps4dexlwplzexqhrmivobyruya/v.mp4";
            
            // Création d'un IFRAME qui contient un lecteur HTML5 minimaliste (via srcdoc)
            // utilisant l'URL MP4 directe.
            const embeddableContent = `
                <div class="video-container">
                    <iframe 
                        title="Lecteur Vidéo StreamFlix"
                        srcdoc='
                            <body style="margin:0; background:#000;">
                                <video 
                                    width="100%" 
                                    height="100%" 
                                    controls 
                                    autoplay 
                                    src="${directVideoUrl}" 
                                    type="video/mp4"
                                    style="width:100%; height:100%; display:block;"
                                ></video>
                            </body>'
                        style="width:100%; height:100%; border:none;"
                        allow="autoplay; fullscreen" 
                        allowfullscreen>
                    </iframe>
                </div>
                <p style="text-align: center; font-size: 0.8rem; color: var(--color-accent); margin-top: 10px;">
                    ▶ Lecture directe du fichier vidéo MP4. (L'accessibilité peut dépendre des serveurs)
                </p>
            `;
            
            // Injection du contenu COMPLET en mode lecteur
            detailModalContent.innerHTML = `
                <button id="close-modal" aria-label="Fermer la fenêtre de détail" class="close-button text-button">✕</button>
                
                <div class="detail-view detail-view-video">
                    ${embeddableContent}
                    
                    <div class="detail-info" style="padding-top: 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1.5rem;">
                        <h2>${title}</h2>
                        <div class="detail-metadata">
                            <span>${voteAverage} ⭐</span>
                            <span>${releaseDate}</span>
                            ${runtime ? `<span>${runtime}</span>` : ''}
                        </div>
                        <p class="detail-overview">${overview}</p>
                        <p><strong>Genres:</strong> <div class="detail-genres">${genres}</div></p>
                        <p><strong>Acteurs principaux:</strong> ${cast}</p>
                    </div>
                </div>
            `;
            
        } else {
            // ***************************************************************
            // AFFICHAGE STANDARD POUR TOUS LES AUTRES FILMS
            // ***************************************************************
            detailModalContent.innerHTML = `
                <button id="close-modal" aria-label="Fermer la fenêtre de détail" class="close-button text-button">✕</button>
                <div class="detail-view">
                    <div class="detail-poster-container">
                        <img src="${IMAGE_BASE_URL}/w500${posterPath}" alt="Affiche détaillée de ${title}" class="detail-poster">
                    </div>
                    <div class="detail-info">
                        ${mediaPlayerContent}
                        <h2>${title}</h2>
                        <div class="detail-metadata">
                            <span>${voteAverage} ⭐</span>
                            <span>${releaseDate}</span>
                            ${runtime ? `<span>${runtime}</span>` : ''}
                        </div>
                        <p class="detail-overview">${overview}</p>
                        
                        <p><strong>Genres:</strong> <div class="detail-genres">${genres}</div></p>
                        <p><strong>${isMovie ? 'Réalisateur' : 'Créateurs'}:</strong> ${director ? director.name : 'N/A'}</p>
                        <p><strong>Acteurs principaux:</strong> ${cast}</p>
                    </div>
                </div>
            `;
        }
        
        // Réattacher l'événement de fermeture car le contenu a été remplacé
        document.getElementById('close-modal').addEventListener('click', hideModal);
        
        // Appliquer/Retirer le style de mode lecteur
        if (modalStyleModifier) {
            detailModalContent.classList.add('modal-mode-lecteur');
        } else {
            detailModalContent.classList.remove('modal-mode-lecteur');
        }
    }
    
    function hideModal() {
        detailModalOverlay.classList.remove('visible');
        // Cache la modale après l'animation de transition
        setTimeout(() => detailModalOverlay.classList.add('hidden'), 400); 
    }

    // Gérer la fermeture de la modale au clic sur l'overlay
    // Si closeModalButton existe déjà, attacher l'événement (même si mieux de l'attacher après le fetch)
    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideModal);
    }
    
    detailModalOverlay.addEventListener('click', (e) => {
        if (e.target === detailModalOverlay) {
            hideModal();
        }
    });


    // ===================================================
    // EXÉCUTION : CHARGEMENT DU CONTENU RICHE
    // ===================================================

    // Le Hero utilise les films populaires pour une bonne image
    fetchMovies('movie/popular', '#row-trending', true); 
    
    // TENDANCES (Mix Films & Séries)
    fetchMovies('trending/all/week', '#row-trending'); 
    
    // FILMS SPÉCIFIQUES
    fetchMovies('discover/movie?with_genres=28', '#row-action'); // Action
    fetchMovies('discover/movie?with_genres=35', '#row-comedy'); // Comédie
    
    // SÉRIES SPÉCIFIQUES
    fetchMovies('discover/tv?with_genres=18', '#row-tv-drama'); // Drama TV
    fetchMovies('discover/tv?with_genres=10765', '#row-tv-scifi'); // Sci-Fi TV
    

    // --- Gestion des Thèmes et du Scroll ---

    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const THEME_STORAGE_KEY = 'streamflix-theme';
    const themes = ['dark', 'light', 'cinema'];
    let currentThemeIndex = 0;

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if(themes.includes(savedTheme)) {
        body.className = `theme-${savedTheme}`;
        currentThemeIndex = themes.indexOf(savedTheme);
    } else {
        body.className = 'theme-dark';
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    }
    
    const toggleTheme = () => {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        const newTheme = themes[currentThemeIndex];
        body.className = `theme-${newTheme}`;
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    themeToggle.addEventListener('click', toggleTheme);
    
    // Header qui se réduit au scrolls
    const header = document.getElementById('main-header');
    const SCROLL_THRESHOLD = 50; 

    const handleScroll = () => {
        if (window.scrollY > SCROLL_THRESHOLD) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
});