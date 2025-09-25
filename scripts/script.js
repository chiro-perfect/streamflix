// Fichier : script.js

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================
    // CONFIGURATION TMDB API
    // ===================================================
    // ATTENTION : Les clés API et les tokens d'authentification ne doivent JAMAIS
    // être stockés directement dans le code côté client pour une application de production.
    // Cela expose vos clés et pourrait permettre une utilisation abusive.
    // Pour un projet réel, il faudrait utiliser un serveur proxy pour cacher ces informations.
    const API_KEY = 'e4b90327227c88daac14c0bd0c1f93cd';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
    const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNGI5MDMyNzIyN2M4OGRhYWMxNGMwYmQwYzFmOTNjZCIsIm5iZiI6MTc1ODY0ODMyMS43NDg5OTk4LCJzdWIiOiI2OGQyZDgwMTJhNWU3YzBhNDVjZWNmZWUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.aylEitwtAH0w4XRk8izJNNkF_bet8sxiC9iI-zSdHbU';
    
    const POSTER_SIZE = 'w300'; 

    // Éléments de la Modale
    const detailModalOverlay = document.getElementById('detail-modal-overlay');
    const detailModalContent = document.getElementById('detail-modal');
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
    // CHARGEMENT DES FILMS (LIGNES/GRILLE)
    // ===================================================
    async function fetchContent(endpoint, containerSelector, isHero = false) {
        try {
            // Simplification de la logique de pagination : on charge toujours la première page
            const url = `${BASE_URL}/${endpoint}?language=fr-FR&page=1`;
            const data = await apiFetch(url);
            const content = data.results;

            if (isHero && content.length > 0) {
                const heroItem = content[Math.floor(Math.random() * Math.min(10, content.length))];
                updateHeroSection(heroItem);
            } 
            
            if (!isHero || containerSelector.startsWith('#row-')) {
                displayContentCards(content, containerSelector);
            }

        } catch (error) {
            console.error('Erreur lors du chargement des contenus:', error);
            const container = document.querySelector(containerSelector);
            if (container) {
                container.innerHTML = '<p class="error-message">Erreur de chargement des données. Veuillez vérifier le Token API.</p>';
            }
        }
    }

// ===================================================
// GESTION DU HERO SECTION
// ===================================================
function updateHeroSection(item) {
    const heroSection = document.querySelector('.hero-section');
    const titleElement = document.querySelector('.hero-title');
    const descriptionElement = document.querySelector('.hero-description');

    if (!heroSection) {
        console.warn("Avertissement: L'élément DOM '.hero-section' est introuvable. Skip Hero update.");
        return; 
    }
    
    const backdropPath = item.backdrop_path || item.poster_path;
    if (backdropPath) {
        heroSection.style.backgroundImage = `url('${IMAGE_BASE_URL}/original${backdropPath}')`;
    }
    
    titleElement.textContent = item.title || item.name;
    
    const overview = item.overview || "Aucune description disponible. Plongez dans l'action, l'aventure et l'émotion.";
    
    if (descriptionElement) {
        descriptionElement.textContent = overview.substring(0, 200) + (overview.length > 200 ? '...' : '');
    }
    
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const primaryButton = document.querySelector('.primary-button');
    if (primaryButton) {
        primaryButton.onclick = () => showContentDetails(item.id, mediaType);
    }
}

    // ===================================================
    // AFFICHAGE DES CARTES & GESTION DU CLIC
    // ===================================================
    function displayContentCards(items, containerSelector, clearContainer = true) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        if (clearContainer) {
            container.innerHTML = '';
        }
        
        // Limite le nombre de films si l'attribut data-limit est présent
        const limit = container.dataset.limit ? parseInt(container.dataset.limit) : null;
        const itemsToDisplay = limit ? items.slice(0, limit) : items;

        itemsToDisplay.forEach(item => {
            if (!item.poster_path) return; 

            // La logique pour déterminer mediaType est un peu fragile.
            // Il est préférable de s'assurer que l'API renvoie ce type d'information
            // de manière fiable, par exemple en utilisant des endpoints spécifiques.
            let mediaType = item.media_type || (item.title ? 'movie' : 'tv');

            const card = document.createElement('div');
            card.className = 'movie-card';
            card.setAttribute('tabindex', '0'); 
            card.dataset.itemId = item.id; 
            card.dataset.mediaType = mediaType; 

            const posterUrl = `${IMAGE_BASE_URL}/${POSTER_SIZE}${item.poster_path}`;
            const title = item.title || item.name;

            // Utiliser innerHTML peut être risqué si les données ne sont pas sécurisées.
            // Ici, comme les titres proviennent d'une API de confiance, le risque est faible.
            card.innerHTML = `
                <img src="${posterUrl}" alt="Affiche de: ${title}">
                <div class="card-title-overlay">${title}</div>
            `;
            
            card.addEventListener('click', () => {
                showContentDetails(item.id, mediaType);
            });
            
            container.appendChild(card);
        });
    }

    // ===================================================
    // GESTION DES DÉTAILS (MODALE)
    // ===================================================
    async function showContentDetails(id, type) {
        detailModalOverlay.classList.add('visible');
        detailModalOverlay.classList.remove('hidden');
        detailModalContent.innerHTML = '<button id="close-modal" aria-label="Fermer la fenêtre de détail" class="close-button text-button">✕</button><p id="modal-loading-message">Chargement des détails...</p>';

        try {
            const url = `${BASE_URL}/${type}/${id}?language=fr-FR&append_to_response=credits`;
            const data = await apiFetch(url);
            renderModalContent(data, type);
        } catch (error) {
            console.error(`Erreur lors du chargement des détails du ${type}:`, error);
            document.getElementById('modal-loading-message').textContent = 'Impossible de charger les détails. Veuillez réessayer.';
        }
    }

    function renderModalContent(item, type) {
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
        
        let mediaPlayerContent = `
            <div class="detail-player-area">
                <button class="button primary-button" style="margin-right: 1rem;">▶ Regarder</button>
                <button class="button secondary-button">+ Ma Liste</button>
            </div>
        `;
        
        let modalStyleModifier = ''; 

        // ATTENTION : Cette logique est très spécifique et difficile à maintenir.
        // La vidéo est codée en dur pour un titre précis. Si le titre change ou
        // si vous voulez ajouter d'autres films avec des vidéos, cela ne fonctionnera plus.
        // Il serait préférable d'utiliser l'API TMDB pour trouver des vidéos/trailers,
        // même si ces vidéos ne sont pas les films complets eux-mêmes.
        if (title.includes('Fantastique') || title.includes('Fantastic Four')) {
            modalStyleModifier = ' modal-mode-lecteur';
            const directVideoUrl = "https://m60.uqload.cx/3rfk3vgaovwkq4drdl26fnniamsi2rdxkwps4dexlwplzexqhrmivobyruya/v.mp4";
            
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
            // AFFICHAGE STANDARD POUR TOUS LES AUTRES CONTENUS
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
        
        // La gestion de la fermeture de la modale est faite ici, ce qui est une bonne approche.
        document.getElementById('close-modal').addEventListener('click', hideModal);
        
        if (modalStyleModifier) {
            detailModalContent.classList.add('modal-mode-lecteur');
        } else {
            detailModalContent.classList.remove('modal-mode-lecteur');
        }
    }
    
    function hideModal() {
        detailModalOverlay.classList.remove('visible');
        setTimeout(() => detailModalOverlay.classList.add('hidden'), 400); 
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideModal);
    }
    
    detailModalOverlay.addEventListener('click', (e) => {
        if (e.target === detailModalOverlay) {
            hideModal();
        }
    });


// ===================================================
// GESTION DES FILTRES ET DE LA RECHERCHE
// ===================================================
let searchTimeout;

function setupFilters(contentType) {
    const searchBar = document.getElementById('search-bar');
    const genreFilter = document.getElementById('genre-filter');

    // NOUVELLE VERIFICATION : Si un élément essentiel manque, on s'arrête.
    if (!searchBar || !genreFilter) {
        console.error(`Erreur: Les éléments 'search-bar' ou 'genre-filter' sont introuvables. Le filtrage et la recherche ne seront pas activés pour ${contentType}.`);
        return; 
    }

    // Populate the genre filter dropdown
    fetchGenres(contentType, genreFilter); // <--- Le code s'arrête souvent ici s'il y a une erreur API

    // Event listener for genre change
    genreFilter.addEventListener('change', () => {
        const selectedGenreId = genreFilter.value;
        if (selectedGenreId) {
            const endpoint = `discover/${contentType}?with_genres=${selectedGenreId}`;
            fetchContent(endpoint, '#content-grid');
        } else {
            // If "All Genres" is selected, reload the default content
            const defaultEndpoint = contentType === 'movie' ? 'movie/now_playing' : 'tv/on_the_air';
            fetchContent(defaultEndpoint, '#content-grid');
        }
    });

    // Event listener for search bar with debounce
    searchBar.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        searchTimeout = setTimeout(() => {
            if (query.trim() !== '') {
                const endpoint = `search/${contentType}?query=${encodeURIComponent(query)}`;
                fetchContent(endpoint, '#content-grid');
            } else {
                // If search bar is empty, reload default content
                const defaultEndpoint = contentType === 'movie' ? 'movie/now_playing' : 'tv/on_the_air';
                fetchContent(defaultEndpoint, '#content-grid');
            }
        }, 500); // Debounce time in ms
    });
}

async function fetchGenres(contentType, dropdownElement) {
    try {
        const url = `${BASE_URL}/genre/${contentType}/list?language=fr-FR`;
        const data = await apiFetch(url);
        
        dropdownElement.innerHTML = '<option value="">Tous les genres</option>';
        data.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            dropdownElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des genres:', error);
    }
}


// ===================================================
// EXÉCUTION : CHARGEMENT DU CONTENU RICHE
// ===================================================

const path = window.location.pathname;

if (path.includes('/series.html')) {
    // Page SERIES
    document.getElementById('page-title').textContent = 'Séries';
    setupFilters('tv');
    fetchContent('tv/top_rated', '#row-top-series'); 
    fetchContent('tv/on_the_air', '#content-grid');

} else if (path.includes('/movies.html')) {
    // Page FILMS
    document.getElementById('page-title').textContent = 'Films';
    setupFilters('movie');
    fetchContent('movie/top_rated', '#row-top-movies'); 
    fetchContent('movie/now_playing', '#content-grid');
    
} else {
    // Page ACCUEIL (index.html)
    fetchContent('trending/all/week', '#row-trending', true); 
    fetchContent('discover/movie?with_genres=28', '#row-action'); 
    fetchContent('discover/movie?with_genres=35', '#row-comedy'); 
    fetchContent('discover/tv?with_genres=18', '#row-tv-drama'); 
    fetchContent('discover/tv?with_genres=10765', '#row-tv-scifi'); 
}

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
