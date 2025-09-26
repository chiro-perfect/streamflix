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
    const closeModalButton = document.getElementById('close-modal'); 
    
    // ===================================================
    // GESTION "MA LISTE" (LOCAL STORAGE)
    // ===================================================
    const MY_LIST_STORAGE_KEY = 'streamflix-my-list';

    function getMyList() {
        try {
            const list = localStorage.getItem(MY_LIST_STORAGE_KEY);
            return list ? JSON.parse(list) : [];
        } catch (e) {
            console.error("Erreur lors de la lecture de Ma Liste dans localStorage", e);
            return [];
        }
    }

    function saveMyList(list) {
        try {
            localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de Ma Liste dans localStorage", e);
        }
    }

    /**
     * Ajoute ou retire un élément de Ma Liste et met à jour le bouton de la modale.
     */
    function toggleMyListItem(item) {
        const list = getMyList();
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        
        // Nous enregistrons un objet simplifié
        const itemToSave = {
            id: item.id,
            type: type,
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average
        };
        
        const index = list.findIndex(i => i.id === itemToSave.id && i.type === itemToSave.type);

        if (index === -1) {
            // Ajouter l'élément
            list.push(itemToSave);
            showToast(`'${itemToSave.title}' a été ajouté à Ma Liste !`);
        } else {
            // Retirer l'élément
            list.splice(index, 1);
            showToast(`'${itemToSave.title}' a été retiré de Ma Liste.`);
        }

        saveMyList(list);
        updateMyListButtonState(itemToSave.id, itemToSave.type);
        
        // Si nous sommes sur la page Ma Liste, rafraîchissons l'affichage
        if (window.location.pathname.includes('/maliste.html')) {
            loadMyListPage();
        }
    }

    /**
     * Met à jour l'état visuel du bouton 'Ma Liste' dans la modale.
     */
    function updateMyListButtonState(id, type) {
        const list = getMyList();
        const isItemInList = list.some(i => i.id === id && i.type === type);
        const myListButton = detailModalContent.querySelector('.my-list-button');
        
        if (myListButton) {
            myListButton.textContent = isItemInList ? '✓ Ma Liste' : '+ Ma Liste';
            myListButton.className = `button ${isItemInList ? 'tertiary-button' : 'secondary-button'} my-list-button`;
        }
    }

    // Fonction de notification "Toast" (remplace alert())
    function showToast(message) {
        let toast = document.getElementById('custom-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'custom-toast';
            // Styles minimalistes pour l'affichage (idéalement à mettre dans base.css)
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(229, 9, 20, 0.9)'; // Utilisation de l'accent (Netflix Red pour bien accentuée la couleur de netflix et du coup pouvoir bien voir le message)
            toast.style.color = '#fff';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '25px';
            toast.style.zIndex = '10000';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out';
            toast.style.pointerEvents = 'none';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.classList.remove('hide', 'show');
        toast.style.opacity = '1';
        
        // Cacher après 3 secondes
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }
    
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
        
        // Si Ma Liste est vide et qu'on est sur la page Ma Liste, n'affiche rien.
        if (window.location.pathname.includes('/maliste.html') && itemsToDisplay.length === 0) {
             container.innerHTML = '<p id="empty-list-message">Votre liste est vide. Ajoutez des films ou séries pour les retrouver ici !</p>';
             return;
        }

        itemsToDisplay.forEach(item => {
            if (!item.poster_path) return; 

            // La logique pour déterminer mediaType est un peu fragile.
            // Utilisons item.media_type si disponible, sinon devinons.
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
        
        // --- LOGIQUE MA LISTE ---
        const isItemInList = getMyList().some(i => i.id === item.id && i.type === type);
        const myListButtonText = isItemInList ? '✓ Ma Liste' : '+ Ma Liste';
        const myListButtonClass = isItemInList ? 'tertiary-button' : 'secondary-button';
        // -------------------------
        
        let mediaPlayerContent = `
            <div class="detail-player-area">
                <button class="button primary-button" style="margin-right: 1rem;">▶ Regarder</button>
                <button class="button ${myListButtonClass} my-list-button">${myListButtonText}</button>
            </div>
        `;
         {
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
        
        // --- AJOUT DU LISTENER POUR LE BOUTON MA LISTE ---
        const myListButton = detailModalContent.querySelector('.my-list-button');
        if (myListButton) {
            myListButton.addEventListener('click', () => {
                toggleMyListItem(item);
            });
        }
        
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
// CHARGEMENT DE LA PAGE MA LISTE
// ===================================================
function loadMyListPage() {
    const list = getMyList();
    const containerSelector = '#content-grid';

    if (list.length === 0) {
        const container = document.querySelector(containerSelector);
        if (container) {
             container.innerHTML = '<p id="empty-list-message">Votre liste est vide. Ajoutez des films ou séries pour les retrouver ici !</p>';
        }
    } else {
        // Mappe les données simplifiées de localStorage à la structure attendue par displayContentCards
        const itemsToDisplay = list.map(item => ({
            id: item.id,
            media_type: item.type,
            title: item.title,
            name: item.title, // Pour les séries, name sera utilisé comme fallback
            poster_path: item.poster_path,
            vote_average: item.vote_average
        }));

        displayContentCards(itemsToDisplay, containerSelector);
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
    
} else if (path.includes('/maliste.html')) {
    // Page MA LISTE
    document.getElementById('page-title').textContent = 'Ma Liste';
    loadMyListPage();

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
