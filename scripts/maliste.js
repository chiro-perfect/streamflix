// maliste.js 
// ===================================================
// CHARGEMENT DE LA PAGE MA LISTE (MISE À JOUR)
// ===================================================
function loadMyListPage() {
    // Cette fonction dépend des fonctions du scrpt.js (getMyList, displayContentCards)
    const list = getMyList();
    const emptySection = document.getElementById('empty-list-section');
    const moviesSection = document.getElementById('movies-list-section');
    const seriesSection = document.getElementById('series-list-section');
    const moviesGrid = document.getElementById('movies-grid');
    const seriesGrid = document.getElementById('series-grid');

    const itemsToDisplay = list.map(item => ({
        id: item.id,
        media_type: item.type, 
        title: item.title,
        name: item.title, 
        poster_path: item.poster_path,
        vote_average: item.vote_average
    }));

    const moviesList = itemsToDisplay.filter(item => item.media_type === 'movie');
    const seriesList = itemsToDisplay.filter(item => item.media_type === 'tv');

    if (list.length === 0) {
        if (emptySection) emptySection.style.display = 'flex'; 
        if (moviesSection) moviesSection.style.display = 'none';
        if (seriesSection) seriesSection.style.display = 'none';
        return;
    } 

    if (emptySection) emptySection.style.display = 'none';

    // 1. Gérer la section Films
    if (moviesList.length > 0) {
        if (moviesSection) moviesSection.style.display = 'block';
        if (moviesGrid) displayContentCards(moviesList, '#movies-grid', true);
    } else {
        if (moviesSection) moviesSection.style.display = 'none';
    }

    // 2. Gérer la section Séries
    if (seriesList.length > 0) {
        if (seriesSection) seriesSection.style.display = 'block';
        if (seriesGrid) displayContentCards(seriesList, '#series-grid', true);
    } else {
        if (seriesSection) seriesSection.style.display = 'none';
    }
}