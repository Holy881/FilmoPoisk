// watch.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (существующие) ---
    const watchPageContainer = document.querySelector('.watch-page-container');
    const bgImage = document.querySelector('.anime_background_image_image');
    const posterImage = document.querySelector('.poster-image');
    const titleElement = document.querySelector('.anime_central_body_title');
    const statusElement = document.querySelector('.meta-status');
    const typeElement = document.querySelector('.meta-type');
    const episodesElement = document.querySelector('.meta-episodes');
    const yearElement = document.querySelector('.meta-year');
    const ageRatingElement = document.querySelector('.meta-age-rating');
    const descriptionElement = document.querySelector('.anime_central_body_description');
    const infoListContainer = document.querySelector('.anime_info_list');
    const ratingBadge = document.getElementById('rating-badge');
    const watchNowMainBtn = document.getElementById('watch-now-main-btn');
    const addToCatalogBtn = document.getElementById('add-to-catalog-btn');
    const catalogCategoryDropdown = document.getElementById('catalog-category-dropdown');
    const tabsContainer = document.querySelector('.anime_additional_information_block_header');
    const tabPanesContainer = document.querySelector('.tab-content-watch');

    const seasonsEpisodesTabButton = document.getElementById('seasons-episodes-tab-button');
    const seasonsEpisodesTabPane = document.getElementById('tab-seasons-episodes');

    const stillsTabPane = document.getElementById('tab-stills');
    const backdropsTabPane = document.getElementById('tab-backdrops');
    const postersTabPane = document.getElementById('tab-posters');
    const videosGrid = document.getElementById('videos-grid');
    const lightboxModal = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseButton = document.querySelector('.lightbox-close-button');
    const userProfileLink = document.getElementById('user-profile-link');
    const userProfileIconContainer = document.getElementById('user-profile-icon-container');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
    const dropdownUsernameDisplay = document.getElementById('dropdown-username-display');
    const dropdownProfileButton = document.getElementById('dropdown-profile-button');
    const dropdownLogoutButton = document.getElementById('dropdown-logout-button');
    const DEFAULT_AVATAR_PATH = '/images/default-avatar.png';
    const userRatingContainer = document.getElementById('user-rating-widget-container');

    const newCommentForm = document.getElementById('new-comment-form');
    const commentTextarea = document.getElementById('comment-textarea');
    const commentsListContainer = document.getElementById('comments-list');
    const commentsLoadingPlaceholder = document.querySelector('.comments-loading-placeholder');
    const commentsPaginationContainer = document.createElement('div');
    commentsPaginationContainer.className = 'comments-pagination';

    // --- Kinobox Player Modal Elements (НОВЫЕ) ---
    const playerModal = document.getElementById('kinobox-player-modal'); // Должен быть в HTML
    const playerModalContent = playerModal?.querySelector('.player-modal-content');
    const kinoboxPlayerTarget = document.getElementById('kinobox-player-target'); // div внутри player-modal-content
    const playerModalCloseBtn = playerModal?.querySelector('.player-modal-close');
    let kinoboxExternalScript = null; // Для отслеживания динамически добавленного скрипта Kinobox

    // --- Constants and Variables (существующие) ---
    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
    const POSTER_SIZE_CARD = 'w342';
    const SEASON_POSTER_SIZE = 'w154';
    const EPISODE_STILL_SIZE = 'w300';
    const MAX_POSTERS_BACKDROPS_TOTAL = 50;
    const MAX_STILLS_TOTAL = 50;
    const ITEMS_PER_DUAL_SHELF_ROW = 25;
    const COMMENTS_PER_PAGE = 10;

    let currentUserData = null;
    let currentTmdbId = null;
    let currentMediaType = null;
    let currentItemData = null;
    let currentCommentsPage = 1;
    let currentSelectedSeasonNumber = null;


    // --- User Profile & Navbar Logic (существующий код без изменений) ---
    function setDefaultUserIcon() {
        if (!userProfileIconContainer) return;
        userProfileIconContainer.innerHTML = '<i class="fas fa-user"></i>';
        if (dropdownUsernameDisplay) dropdownUsernameDisplay.textContent = 'Гость';
    }

    async function updateUserProfileDisplay() {
        if (!userProfileIconContainer) {
            setDefaultUserIcon();
            if (profileDropdownMenu) profileDropdownMenu.classList.remove('active');
            return;
        }
        const userId = localStorage.getItem('userId');
        if (userId) {
            try {
                const response = await fetch(`/api/user/${userId}`);
                if (!response.ok) {
                    localStorage.removeItem('userId');
                    currentUserData = null;
                    setDefaultUserIcon();
                    if (profileDropdownMenu) profileDropdownMenu.classList.remove('active');
                    return;
                }
                currentUserData = await response.json();
                if (dropdownUsernameDisplay) dropdownUsernameDisplay.textContent = currentUserData?.username || 'Пользователь';
                if (userProfileIconContainer) {
                    if (currentUserData?.avatar && currentUserData.avatar !== DEFAULT_AVATAR_PATH) {
                        const avatarImg = document.createElement('img');
                        avatarImg.src = currentUserData.avatar.startsWith('/') ? currentUserData.avatar : `/${currentUserData.avatar}`;
                        avatarImg.alt = 'Аватар';
                        avatarImg.className = 'navbar-avatar';
                        avatarImg.onerror = () => { if (userProfileIconContainer) userProfileIconContainer.innerHTML = '<i class="fas fa-user"></i>'; };
                        userProfileIconContainer.innerHTML = '';
                        userProfileIconContainer.appendChild(avatarImg);
                    } else {
                        userProfileIconContainer.innerHTML = '<i class="fas fa-user"></i>';
                    }
                }
            } catch (error) {
                console.error("Ошибка при обновлении профиля:", error);
                localStorage.removeItem('userId');
                currentUserData = null;
                setDefaultUserIcon();
                if (profileDropdownMenu) profileDropdownMenu.classList.remove('active');
            }
        } else {
            currentUserData = null;
            setDefaultUserIcon();
            if (profileDropdownMenu) profileDropdownMenu.classList.remove('active');
        }
    }

    if (userProfileLink) {
        userProfileLink.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const userId = localStorage.getItem('userId');
            if (userId) {
                if (profileDropdownMenu) {
                    profileDropdownMenu.classList.toggle('active');
                    if (profileDropdownMenu.classList.contains('active')) {
                        if (dropdownUsernameDisplay && (!currentUserData || dropdownUsernameDisplay.textContent === 'Загрузка...' || dropdownUsernameDisplay.textContent === 'Гость')) {
                            dropdownUsernameDisplay.textContent = currentUserData?.username || 'Загрузка...';
                            updateUserProfileDisplay();
                        } else if (dropdownUsernameDisplay && currentUserData) {
                            dropdownUsernameDisplay.textContent = currentUserData.username;
                        }
                    }
                }
            } else {
                window.location.href = '/auth';
            }
        });
    }
    if (dropdownProfileButton) {
        dropdownProfileButton.addEventListener('click', () => {
            window.location.href = '/profile';
            if (profileDropdownMenu) profileDropdownMenu.classList.remove('active');
        });
    }
    if (dropdownLogoutButton) {
        dropdownLogoutButton.addEventListener('click', () => {
            localStorage.removeItem('userId');
            currentUserData = null;
            window.location.reload();
        });
    }
    document.addEventListener('click', (event) => {
        if (profileDropdownMenu?.classList.contains('active') &&
            !profileDropdownMenu.contains(event.target) &&
            !(userProfileLink && userProfileLink.contains(event.target))) {
            profileDropdownMenu.classList.remove('active');
        }
        if (catalogCategoryDropdown?.classList.contains('active') &&
            !(addToCatalogBtn && addToCatalogBtn.contains(event.target)) &&
            !catalogCategoryDropdown.contains(event.target)) {
            catalogCategoryDropdown.classList.remove('active');
        }
        document.querySelectorAll('.search-modal-sidebar .custom-dropdown.open').forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('open');
            }
        });
    });

    // --- Search Modal Logic (существующий код без изменений) ---
    const POSTER_SIZE_SEARCH = 'w154';
    const EXCLUDED_TV_GENRE_IDS = [10767, 10764, 10763, 10766];
    let searchTimeout;
    let allMovieGenresMap = new Map();
    let allTvGenresMap = new Map();
    const newSearchButton = document.getElementById('search-button');
    const newSearchModal = document.getElementById('search-modal');
    const searchInput = newSearchModal?.querySelector('.search-modal-input');
    const searchResultsContainer = newSearchModal?.querySelector('.search-modal-main');
    const initialPlaceholder = searchResultsContainer?.querySelector('.search-results-placeholder');
    const loadingIndicator = searchResultsContainer?.querySelector('.search-loading-indicator');
    const genreDropdownMovieElement = newSearchModal?.querySelector('.custom-dropdown[data-dropdown-id="genres-movie"]');
    const genreDropdownMovieMenuElement = genreDropdownMovieElement?.querySelector('.dropdown-menu');
    const typeFilterCheckboxes = newSearchModal?.querySelectorAll('input[name="type_filter"]');
    const typeDropdownElement = newSearchModal?.querySelector('.custom-dropdown[data-dropdown-id="type"]');
    const yearFromInput = newSearchModal?.querySelector('.year-input[placeholder="от"]');
    const yearToInput = newSearchModal?.querySelector('.year-input[placeholder="до"]');
    const ratingFromInput = newSearchModal?.querySelector('.rating-input[placeholder="от"]');
    const ratingToInput = newSearchModal?.querySelector('.rating-input[placeholder="до"]');
    const resetFiltersButton = newSearchModal?.querySelector('.reset-filters-button');

    async function fetchGenresFromServer(type) { try { const response = await fetch(`/api/tmdb/genres/${type}?language=ru-RU`); if (!response.ok) throw new Error(`HTTP ${response.status}`); return (await response.json()) || []; } catch (error) { console.error(`Ошибка жанров ${type}:`, error); return []; } }
    async function populateGenreDropdown(menu, genresData, type, map) { if (!menu) return; menu.querySelector('.genres-loading-placeholder')?.remove(); menu.innerHTML = ''; map.clear(); const genres = Array.isArray(genresData) ? genresData : (genresData.genres || []); if (!Array.isArray(genres)) { console.warn(`Жанры ${type} не массив:`, genres); return; } genres.forEach(g => { if (typeof g.id !== 'number' || typeof g.name !== 'string') return; map.set(g.id, g.name); const label = document.createElement('label'); const cb = Object.assign(document.createElement('input'), { type: 'checkbox', name: 'genre_filter', value: String(g.id) }); cb.dataset.genreName = g.name; cb.addEventListener('change', () => { updateToggleTextForGenres(menu.closest('.custom-dropdown')); triggerSearch(); }); label.append(cb, ` ${g.name}`); menu.appendChild(label); }); }
    async function loadAndPopulateAllGenres() { const [movieGenres, tvGenres] = await Promise.all([fetchGenresFromServer('movie'), fetchGenresFromServer('tv')]); populateGenreDropdown(genreDropdownMovieMenuElement, movieGenres, 'movie', allMovieGenresMap); allTvGenresMap.clear(); (Array.isArray(tvGenres) ? tvGenres : (tvGenres.genres || [])).forEach(g => { if (typeof g.id === 'number' && typeof g.name === 'string') allTvGenresMap.set(g.id, g.name); }); updateToggleTextForGenres(genreDropdownMovieElement); }
    function getSelectedGenreIds() { return Array.from(genreDropdownMovieMenuElement?.querySelectorAll('input:checked') || []).map(cb => cb.value); }
    function triggerSearch() { const query = searchInput?.value.trim() || ""; const sGenres = getSelectedGenreIds(), yF = yearFromInput?.value.trim(), yT = yearToInput?.value.trim(), rF = ratingFromInput?.value.trim(), rT = ratingToInput?.value.trim(); const activeMediaCb = document.querySelector('input[name="type_filter"]:checked'), activeMedia = activeMediaCb ? activeMediaCb.value : null; if (query || sGenres.length || yF || yT || rF || rT || activeMedia) { clearTimeout(searchTimeout); if (loadingIndicator) loadingIndicator.style.display = 'flex'; if (initialPlaceholder) initialPlaceholder.style.display = 'none'; clearSearchResults(false); searchTimeout = setTimeout(() => performSearch(query, activeMedia, sGenres, yF, yT, rF, rT), 350); } else { clearSearchResults(true); if (initialPlaceholder) initialPlaceholder.style.display = 'flex'; if (loadingIndicator) loadingIndicator.style.display = 'none'; } }
    async function performSearch(query, mediaType, selGenreIds, yF, yT, rF, rT) { if (loadingIndicator) loadingIndicator.style.display = 'flex'; if (initialPlaceholder) initialPlaceholder.style.display = 'none'; const params = new URLSearchParams({ language: 'ru-RU', page: 1 }); if (query) params.append('query', query); let reqMT = mediaType; if (!query && !mediaType && (selGenreIds.length || yF || yT || rF || rT)) reqMT = 'movie'; else if (query && !mediaType) reqMT = 'multi'; if (reqMT) params.append('media_type', reqMT); if (selGenreIds?.length) params.append('genres', selGenreIds.join(',')); if (yF) params.append('year_from', yF); if (yT) params.append('year_to', yT); if (rF) params.append('rating_from', rF); if (rT) params.append('rating_to', rT); try { const response = await fetch(`/api/tmdb/search?${params.toString()}`); if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || `HTTP ${response.status}`); } displayResults((await response.json()).results || [], params.get('media_type') || (query ? 'multi' : 'movie')); } catch (error) { console.error('Ошибка поиска:', error); displayError(error.message); } finally { if (loadingIndicator) loadingIndicator.style.display = 'none'; } }
    function displayResults(items, searchCtx) { clearSearchResults(false); if (!searchResultsContainer) return; const grid = document.createElement('div'); grid.className = 'search-results-grid'; if (!items || items.length === 0) { const hasFilters = searchInput?.value.trim() || getSelectedGenreIds().length || yearFromInput?.value.trim() || yearToInput?.value.trim() || ratingFromInput?.value.trim() || ratingToInput?.value.trim() || document.querySelector('input[name="type_filter"]:checked'); if (hasFilters) grid.innerHTML = '<p class="no-results">По вашему запросу ничего не найдено.</p>'; else if (initialPlaceholder) initialPlaceholder.style.display = 'flex'; } else { items.forEach((item, idx) => { let mt = item.media_type || (searchCtx !== 'multi' ? searchCtx : (item.title ? 'movie' : 'tv')); if (mt === 'person') return; const title = item.title || item.name, year = item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : 'N/A'; const poster = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_SEARCH}${item.poster_path}` : '/images/default-poster.jpg'; let overview = item.overview || 'Описание отсутствует.'; if (overview.length > 100) overview = overview.substring(0, 97) + '...'; const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A'; const gMap = mt === 'tv' ? allTvGenresMap : allMovieGenresMap; let gNames = item.genre_ids?.map(id => gMap.get(parseInt(id, 10))).filter(Boolean).join(', ') || 'Жанры не указаны'; if (gNames === 'Жанры не указаны' && item.genre_ids?.length && gMap.size === 0) gNames = 'Загрузка жанров...'; const el = document.createElement('div'); el.className = 'search-result-item'; el.dataset.year = String(year); el.dataset.rating = String(rating); el.dataset.mediaType = mt; el.dataset.genreIds = item.genre_ids?.join(',') || ''; el.innerHTML = ` <img src="${poster}" alt="${title}" class="search-result-poster" onerror="this.onerror=null;this.src='/images/error.png';"> <div class="search-result-details"> <div class="search-result-main-info"> <h3 class="search-result-title">${title}</h3> <p class="search-result-meta"> <span class="search-result-year">${year}</span> <span class="search-result-type">${mt === 'movie' ? 'Фильм' : (mt === 'tv' ? 'Сериал' : '')}</span> <span class="search-result-rating"><i class="fas fa-star"></i> ${rating}</span> </p><p class="search-result-genres">${gNames}</p></div> <p class="search-result-overview">${overview}</p> <a href="watch.html?tmdbId=${item.id}&type=${mt}" class="action-button search-result-watch-btn"><i class="fas fa-play"></i> Смотреть</a></div>`; grid.appendChild(el); requestAnimationFrame(() => setTimeout(() => el.classList.add('visible'), idx * 50)); }); } searchResultsContainer.querySelector('.search-results-grid')?.remove(); searchResultsContainer.appendChild(grid); applyClientSideFilters(); }
    function displayError(msg) { clearSearchResults(false); if (!searchResultsContainer) return; const errEl = document.createElement('p'); errEl.className = 'search-error-message'; errEl.textContent = `Ошибка: ${msg}`; searchResultsContainer.querySelector('.search-results-grid')?.remove(); searchResultsContainer.appendChild(errEl); if (loadingIndicator) loadingIndicator.style.display = 'none'; if (initialPlaceholder) initialPlaceholder.style.display = 'none'; }
    function clearSearchResults(showPlaceholder = true) { if (!searchResultsContainer) return; searchResultsContainer.querySelector('.search-results-grid')?.remove(); searchResultsContainer.querySelector('.search-error-message')?.remove(); searchResultsContainer.querySelector('.no-results-client-message')?.remove(); if (initialPlaceholder) initialPlaceholder.style.display = showPlaceholder ? 'flex' : 'none'; }
    function applyClientSideFilters() { if (!searchResultsContainer) return; const selGIds = getSelectedGenreIds(), yF = yearFromInput?.value ? parseInt(yearFromInput.value) : null, yT = yearToInput?.value ? parseInt(yearToInput.value) : null; const rF = ratingFromInput?.value ? parseFloat(ratingFromInput.value) : null, rT = ratingToInput?.value ? parseFloat(ratingToInput.value) : null; const selMT = document.querySelector('input[name="type_filter"]:checked')?.value; const items = searchResultsContainer.querySelectorAll('.search-result-item'); let visibleCount = 0; searchResultsContainer.querySelector('.no-results-client-message')?.remove(); if (items.length === 0) return; items.forEach(item => { let matches = true; const iY = item.dataset.year && !isNaN(parseInt(item.dataset.year)) ? parseInt(item.dataset.year) : null; const iR = item.dataset.rating && !isNaN(parseFloat(item.dataset.rating)) ? parseFloat(item.dataset.rating) : null; const iMT = item.dataset.mediaType, iGIds = item.dataset.genreIds ? item.dataset.genreIds.split(',').filter(Boolean).map(Number) : []; if (iMT === 'tv' && iGIds.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))) matches = false; if (matches && selMT && iMT !== selMT) matches = false; if (matches && selGIds.length && !selGIds.every(sgid => iGIds.includes(parseInt(sgid)))) matches = false; if (matches && iY !== null) { if ((yF && iY < yF) || (yT && iY > yT)) matches = false; } else if (matches && (yF || yT)) { matches = false; } if (matches && iR !== null) { if ((rF && iR < rF) || (rT && iR > rT)) matches = false; } else if (matches && (rF || rT)) { matches = false; } item.style.display = matches ? 'flex' : 'none'; if (matches) visibleCount++; }); if (visibleCount === 0 && items.length > 0) { searchResultsContainer.querySelector('.no-results')?.remove(); const noResMsg = Object.assign(document.createElement('p'), { className: 'no-results-client-message', textContent: 'По вашему запросу и выбранным фильтрам ничего не найдено.', style: "text-align:center;color:#A0A0A0;font-size:1.1em;padding:30px 15px;" }); (searchResultsContainer.querySelector('.search-results-grid') || searchResultsContainer).after(noResMsg); if(initialPlaceholder) initialPlaceholder.style.display = 'none'; } }
    function updateToggleTextForDropdown(ddEl, defTxt) { if (!ddEl) return; const txtEl = ddEl.querySelector('.dropdown-toggle span'); if (!txtEl) return; const selCbs = Array.from(ddEl.querySelectorAll('.dropdown-menu input:checked')); const selTxts = selCbs.map(cb => cb.dataset.genreName || cb.labels[0].textContent.trim() || cb.value); if (selTxts.length) { const maxN = ddEl.dataset.dropdownId === "genres-movie" ? 2 : 1; txtEl.textContent = selTxts.length <= maxN ? selTxts.join(', ') : `${selTxts.length} выбрано`; } else txtEl.textContent = defTxt; }
    function updateToggleTextForGenres(ddEl) { if (!ddEl) return; const menu = ddEl.querySelector('.dropdown-menu'), span = ddEl.querySelector('.dropdown-toggle span'); if (!span) return; if (menu?.querySelector('.genres-loading-placeholder')) span.textContent = "Загрузка жанров..."; else if (menu?.querySelectorAll('label').length === 0 && !menu?.querySelector('.genres-loading-placeholder')) span.textContent = "Жанры не найдены"; else updateToggleTextForDropdown(ddEl, "Выберите жанр(ы)"); }
    if (newSearchButton && newSearchModal) { const openSearch = () => { newSearchModal.classList.add('active'); document.body.style.overflow = 'hidden'; if (allMovieGenresMap.size === 0) loadAndPopulateAllGenres(); }; const closeSearch = () => { newSearchModal.classList.remove('active'); document.body.style.overflow = ''; }; newSearchButton.addEventListener('click', (e) => { e.preventDefault(); openSearch(); }); newSearchModal.addEventListener('click', (e) => { if (e.target === newSearchModal) closeSearch(); }); document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && newSearchModal.classList.contains('active')) closeSearch(); }); }
    if (searchInput) { searchInput.addEventListener('input', triggerSearch); }
    [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(i => { i?.addEventListener('input', triggerSearch); i?.addEventListener('change', triggerSearch); });
    typeFilterCheckboxes?.forEach(cb => cb.addEventListener('change', () => { if (cb.checked) typeFilterCheckboxes.forEach(other => { if (other !== cb) other.checked = false; }); updateToggleTextForDropdown(typeDropdownElement, "Выберите тип"); triggerSearch(); }));
    if (resetFiltersButton) { resetFiltersButton.addEventListener('click', () => { if (searchInput) searchInput.value = ''; typeFilterCheckboxes?.forEach(c => c.checked = false); if (typeDropdownElement) updateToggleTextForDropdown(typeDropdownElement, "Выберите тип"); genreDropdownMovieMenuElement?.querySelectorAll('input').forEach(c => c.checked = false); if (genreDropdownMovieElement) updateToggleTextForGenres(genreDropdownMovieElement);[yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(ip => { if (ip) ip.value = ''; }); clearSearchResults(true); if (initialPlaceholder) initialPlaceholder.style.display = 'flex'; if (loadingIndicator) loadingIndicator.style.display = 'none'; }); }
    if (newSearchModal) { const obs = new MutationObserver(m => m.forEach(mu => { if (mu.attributeName === 'class' && newSearchModal.classList.contains('active') && allMovieGenresMap.size === 0) { loadAndPopulateAllGenres(); } })); obs.observe(newSearchModal, { attributes: true }); }
    document.querySelectorAll('.search-modal-sidebar .custom-dropdown').forEach(dd => { dd.querySelector('.dropdown-toggle')?.addEventListener('click', e => { e.stopPropagation(); const isOpen = dd.classList.contains('open'); document.querySelectorAll('.search-modal-sidebar .custom-dropdown.open').forEach(odd => { if (odd !== dd) odd.classList.remove('open'); }); dd.classList.toggle('open', !isOpen); if (!isOpen && dd.dataset.dropdownId === 'genres-movie' && genreDropdownMovieMenuElement && !genreDropdownMovieMenuElement.children.length && !genreDropdownMovieMenuElement.querySelector('.genres-loading-placeholder')) { const p = Object.assign(document.createElement('p'), { className: 'genres-loading-placeholder', textContent: 'Загрузка жанров...', style: "padding:8px 10px;color:#A0A0A0;font-size:0.9em;font-style:italic;" }); genreDropdownMovieMenuElement.appendChild(p); loadAndPopulateAllGenres(); } }); });
    document.querySelectorAll('.number-input-container').forEach(c => { const i = c.querySelector('input[type="number"]'), uA = c.querySelector('.up-arrow'), dA = c.querySelector('.down-arrow'); if (i && uA && dA) { uA.addEventListener('click', () => { i.stepUp(); i.dispatchEvent(new Event('input', { bubbles: true })); }); dA.addEventListener('click', () => { i.stepDown(); i.dispatchEvent(new Event('input', { bubbles: true })); }); } });

    // --- Lightbox Logic (существующий код без изменений) ---
    function openLightbox(imageSrc) { if (!lightboxModal || !lightboxImage) return; lightboxImage.src = imageSrc; lightboxModal.classList.add('active'); requestAnimationFrame(() => { if (lightboxImage) lightboxImage.style.opacity = '1'; if (lightboxImage) lightboxImage.style.transform = 'scale(1)'; }); document.body.style.overflow = 'hidden'; }
    function closeLightbox() { if (!lightboxModal || !lightboxImage) return; lightboxImage.style.opacity = '0'; lightboxImage.style.transform = 'scale(0.8)'; setTimeout(() => { lightboxModal.classList.remove('active'); document.body.style.overflow = ''; lightboxImage.src = ''; }, 300); }
    if (lightboxCloseButton) { lightboxCloseButton.addEventListener('click', closeLightbox); }
    if (lightboxModal) { lightboxModal.addEventListener('click', (event) => { if (event.target === lightboxModal) { closeLightbox(); } }); }
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) { closeLightbox(); } });

    // --- Shelf and Tile Creation (существующий код без изменений) ---
    function createShelfElement(id, titleText, isEmptyShelf = false) { const shelfSection = document.createElement('section'); shelfSection.className = 'movie-shelf'; if (isEmptyShelf) shelfSection.classList.add('empty-shelf-placeholder'); shelfSection.id = id; if (titleText) { const title = document.createElement('h2'); title.textContent = titleText; shelfSection.appendChild(title); } const gridWrapper = document.createElement('div'); gridWrapper.className = 'shelf-grid-wrapper'; const controls = document.createElement('div'); controls.className = 'shelf-controls'; controls.innerHTML = ` <button class="shelf-arrow prev-arrow" aria-label="Предыдущие"><i class="fas fa-chevron-left"></i></button> <button class="shelf-arrow next-arrow" aria-label="Следующие"><i class="fas fa-chevron-right"></i></button> `; gridWrapper.appendChild(controls); const grid = document.createElement('div'); grid.className = 'shelf-grid'; gridWrapper.appendChild(grid); shelfSection.appendChild(gridWrapper); const prevArrow = controls.querySelector('.prev-arrow'); const nextArrow = controls.querySelector('.next-arrow'); if (grid && prevArrow && nextArrow) { const getScrollAmount = () => (grid.querySelector('.movie-tile, .media-item, .still-item')?.offsetWidth || grid.clientWidth * 0.8) + (parseFloat(getComputedStyle(grid).gap) || 15); prevArrow.addEventListener('click', () => grid.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' })); nextArrow.addEventListener('click', () => grid.scrollBy({ left: getScrollAmount(), behavior: 'smooth' })); const updateShelfControlsVisibility = () => { requestAnimationFrame(() => { const scrollLeft = Math.round(grid.scrollLeft); const scrollWidth = grid.scrollWidth; const clientWidth = grid.clientWidth; if (grid.children.length === 0) { prevArrow.classList.remove('visible'); nextArrow.classList.remove('visible'); gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll'); return; } const canScrollLeft = scrollLeft > 1; const canScrollRight = (scrollWidth - clientWidth - scrollLeft) > 1; prevArrow.classList.toggle('visible', canScrollLeft); nextArrow.classList.toggle('visible', canScrollRight); gridWrapper.classList.toggle('has-prev-scroll', canScrollLeft); gridWrapper.classList.toggle('has-next-scroll', canScrollRight); }); }; const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { setTimeout(() => updateShelfControlsVisibility(), 200); } else { prevArrow.classList.remove('visible'); nextArrow.classList.remove('visible'); gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll'); } }); }, { threshold: 0.01 }); observer.observe(shelfSection); grid.addEventListener('scroll', updateShelfControlsVisibility, { passive: true }); window.addEventListener('resize', updateShelfControlsVisibility, { passive: true }); setTimeout(() => updateShelfControlsVisibility(), 300); } return shelfSection; }
    function applyTileRatingStyles(targetElement, ratingValue) { if (!targetElement) return; const rating = parseFloat(ratingValue); targetElement.classList.remove('rating-red', 'rating-gray', 'rating-green', 'rating-none'); targetElement.style.backgroundColor = ''; if (isNaN(rating) || rating === 0) { targetElement.textContent = '–'; targetElement.classList.add('rating-none'); } else { targetElement.textContent = `★ ${rating.toFixed(1)}`; if (rating < 5) targetElement.classList.add('rating-red'); else if (rating < 7) targetElement.classList.add('rating-gray'); else targetElement.classList.add('rating-green'); } }
    function createMovieTileForTabs(movie) { const tile = document.createElement('a'); tile.className = 'movie-tile'; tile.href = `watch.html?tmdbId=${movie.id}&type=${movie.media_type || currentMediaType}`; const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_CARD}${movie.poster_path}` : '/images/default-poster.jpg'; const ratingElement = document.createElement('span'); ratingElement.className = 'movie-rating rating-display-badge'; applyTileRatingStyles(ratingElement, movie.vote_average); let overviewText = movie.overview || 'Описание отсутствует.'; if (overviewText.length > 100) { overviewText = overviewText.substring(0, 97) + '...'; } tile.innerHTML = ` <img src="${posterUrl}" alt="${movie.title || movie.name}" class="movie-poster-img" loading="lazy" onerror="this.onerror=null;this.src='/images/error.png';"> <div class="movie-hover-details"> <h3>${movie.title || movie.name}</h3> <p>${overviewText}</p> </div> `; tile.insertBefore(ratingElement, tile.firstChild); return tile; }
    function renderItemsToGrid(gridElement, items, itemType, countLimit) { if (!gridElement || !items) return; gridElement.innerHTML = ''; const itemsToDisplay = items.slice(0, countLimit); itemsToDisplay.forEach(itemData => { let element; const commonImgSrc = itemData.file_path || itemData.poster_path; if (itemType === 'still' || itemType === 'backdrop' || itemType === 'poster') { element = document.createElement('div'); element.className = `${itemType}-item media-item`; let finalSmallImgSrc = `${TMDB_IMAGE_BASE_URL}w780${commonImgSrc}`; if (itemType === 'poster') { finalSmallImgSrc = `${TMDB_IMAGE_BASE_URL}w342${commonImgSrc}`; } else if (itemType === 'still') { finalSmallImgSrc = `${TMDB_IMAGE_BASE_URL}w500${commonImgSrc}`; } const largeImgSrc = `${TMDB_IMAGE_BASE_URL}original${commonImgSrc}`; element.innerHTML = `<img src="${finalSmallImgSrc}" alt="${itemType}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/780x439/1A1A1A/555555?text=Error'; this.alt='Ошибка загрузки';">`; element.addEventListener('click', () => openLightbox(largeImgSrc)); } else { element = createMovieTileForTabs(itemData); } if(element) gridElement.appendChild(element); }); }
    function createDualShelfForTab(tabPaneElement, allItems, itemType, totalItemLimit) { if (!tabPaneElement) return; tabPaneElement.innerHTML = ''; if (!allItems || allItems.length === 0) { const emptyMsgEl = Object.assign(document.createElement('p'), { className: 'empty-tab-message', textContent: `Нет данных для отображения (${itemType}).`, style: 'display:block; text-align:center; padding: 20px; color: #A0A0A0;' }); tabPaneElement.appendChild(emptyMsgEl); return; } const itemsForShelf1 = allItems.slice(0, Math.ceil(totalItemLimit / 2)); const itemsForShelf2 = allItems.slice(Math.ceil(totalItemLimit / 2), totalItemLimit); if (itemsForShelf1.length > 0) { const shelf1 = createShelfElement(`${itemType}-shelf-1`, null); tabPaneElement.appendChild(shelf1); renderItemsToGrid(shelf1.querySelector('.shelf-grid'), itemsForShelf1, itemType, ITEMS_PER_DUAL_SHELF_ROW); } if (itemsForShelf2.length > 0) { const shelf2 = createShelfElement(`${itemType}-shelf-2`, null); tabPaneElement.appendChild(shelf2); renderItemsToGrid(shelf2.querySelector('.shelf-grid'), itemsForShelf2, itemType, ITEMS_PER_DUAL_SHELF_ROW); } if (itemsForShelf1.length === 0 && itemsForShelf2.length === 0 && allItems.length > 0) { const shelfSingle = createShelfElement(`${itemType}-shelf-single`, null); tabPaneElement.appendChild(shelfSingle); renderItemsToGrid(shelfSingle.querySelector('.shelf-grid'), allItems, itemType, ITEMS_PER_DUAL_SHELF_ROW * 2); } }
    function applyRatingStyles(targetElement, ratingValue) { if (!targetElement) return; const rating = parseFloat(ratingValue); targetElement.classList.remove('rating-red', 'rating-gray', 'rating-green', 'rating-none'); targetElement.style.backgroundColor = ''; if (isNaN(rating) || rating === 0 || rating < 1) { targetElement.textContent = '–'; targetElement.classList.add('rating-none'); } else { targetElement.textContent = `${rating.toFixed(1)}`; if (rating < 5) targetElement.classList.add('rating-red'); else if (rating < 7) targetElement.classList.add('rating-gray'); else targetElement.classList.add('rating-green'); } }
    function showToastNotification(message, isError = false, duration = 3000) { const toast = document.getElementById('toast-notification'); const toastMessage = document.getElementById('toast-notification-message'); if (!toast || !toastMessage) return; toastMessage.textContent = message; toast.className = 'toast-notification'; toast.classList.add(isError ? 'error' : 'success'); toast.classList.add('active'); if (toast.toastTimeout) { clearTimeout(toast.toastTimeout); } toast.toastTimeout = setTimeout(() => toast.classList.remove('active'), duration); }
    function getNamesList(array, limit = 5) { if (!array || array.length === 0) return 'N/A'; return array.slice(0, limit).map(item => item.name).join(', ') + (array.length > limit ? ' и др.' : ''); }
    async function getItemListStatus(userId, tmdbId, mediaType) { if (!userId || !tmdbId || !mediaType) return null; try { const response = await fetch(`/api/user/${userId}/lists?tmdb_id=${tmdbId}&media_type=${mediaType}`); if (response.ok) { return await response.json(); } return null; } catch (error) { console.error('Ошибка при запросе статуса элемента списка:', error); return null; } }
    function updateListCategoryDropdownCheckmarks() { if (!catalogCategoryDropdown || !currentItemData) return; catalogCategoryDropdown.querySelectorAll('button').forEach(button => { const existingCheckmark = button.querySelector('.list-category-checkmark'); if (existingCheckmark) existingCheckmark.remove(); const checkmarkContainer = document.createElement('span'); checkmarkContainer.className = 'list-category-checkmark'; if (currentItemData.userListCategory && button.dataset.category === currentItemData.userListCategory) { const checkmark = document.createElement('i'); checkmark.className = 'fas fa-check'; checkmarkContainer.appendChild(checkmark); } else { checkmarkContainer.innerHTML = ' '; } button.prepend(checkmarkContainer); }); }
    async function fetchStillsForEpisode(tvId, seasonNumber, episodeNumber) { try { const response = await fetch(`/api/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/images`); if (!response.ok) { if (response.status !== 404) { console.warn(`Не удалось загрузить кадры для S${seasonNumber}E${episodeNumber}, статус: ${response.status}`); } return []; } return await response.json(); } catch (error) { console.error('Сетевая ошибка при запросе кадров:', error); return []; } }
    function renderStills(stillsData, targetPaneElement) { createDualShelfForTab(targetPaneElement, stillsData, 'still', MAX_STILLS_TOTAL); }
    function renderBackdrops(backdropsData, targetPaneElement) { createDualShelfForTab(targetPaneElement, backdropsData, 'backdrop', MAX_POSTERS_BACKDROPS_TOTAL); }
    function renderPosters(postersData, targetPaneElement) { createDualShelfForTab(targetPaneElement, postersData, 'poster', MAX_POSTERS_BACKDROPS_TOTAL); }
    function renderSingleShelf(shelfElement, moviesData, itemType = 'movie') { if (!shelfElement) return; const grid = shelfElement.querySelector('.shelf-grid'); if (!grid) { console.error("Grid not found in shelf:", shelfElement); return; } grid.innerHTML = ''; if (!moviesData || moviesData.length === 0) { return; } moviesData.forEach(movie => { grid.appendChild(createMovieTileForTabs(movie)); }); const gridWrapper = shelfElement.querySelector('.shelf-grid-wrapper'); const prevArrow = shelfElement.querySelector('.prev-arrow'); const nextArrow = shelfElement.querySelector('.next-arrow'); if (gridWrapper && prevArrow && nextArrow) { setTimeout(() => { const scrollLeft = Math.round(grid.scrollLeft); const scrollWidth = grid.scrollWidth; const clientWidth = grid.clientWidth; if (grid.children.length === 0) { prevArrow.classList.remove('visible'); nextArrow.classList.remove('visible'); gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll'); return; } const canScrollLeft = scrollLeft > 1; const canScrollRight = (scrollWidth - clientWidth - scrollLeft) > 1; prevArrow.classList.toggle('visible', canScrollLeft); nextArrow.classList.toggle('visible', canScrollRight); gridWrapper.classList.toggle('has-prev-scroll', canScrollLeft); gridWrapper.classList.toggle('has-next-scroll', canScrollRight); }, 100); } }
    async function saveUserRating(rating) { const userId = localStorage.getItem('userId'); if (!userId || !currentItemData) { showToastNotification('Не удалось сохранить оценку. Пользователь не найден или данные фильма не загружены.', true); return; } const { id: tmdb_id, media_type, title, name, poster_path, userListCategory } = currentItemData; const categoryToSend = userListCategory || 'Просмотрено'; const dataToSend = { tmdb_id: parseInt(tmdb_id, 10), media_type: media_type, category: categoryToSend, title: title || name, poster_path: poster_path, rating: rating }; try { const response = await fetch(`/api/user/${userId}/lists`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) }); const result = await response.json(); if (response.ok) { showToastNotification(rating ? `Ваша оценка ${rating} сохранена!` : 'Оценка сброшена.', false); currentItemData.userRating = rating; if (!currentItemData.userListCategory && rating) { currentItemData.userListCategory = categoryToSend; updateListCategoryDropdownCheckmarks(); } createRatingWidget(rating); } else { showToastNotification(`Ошибка: ${result.error || 'Не удалось сохранить оценку.'}`, true); } } catch (error) { console.error('Сетевая ошибка при сохранении оценки:', error); showToastNotification('Сетевая ошибка при сохранении оценки.', true); } }
    function createRatingWidget(currentUserRating = null) { if (!userRatingContainer) return; const userId = localStorage.getItem('userId'); userRatingContainer.innerHTML = ''; const widget = document.createElement('div'); widget.className = 'user-rating-widget'; if (currentUserRating) { if (currentUserRating >= 7) widget.classList.add('rated-green'); else if (currentUserRating >= 5) widget.classList.add('rated-gray'); else widget.classList.add('rated-red'); } if (!userId) { userRatingContainer.classList.add('disabled'); widget.setAttribute('title', 'Войдите, чтобы оценить'); const mainContent = document.createElement('div'); mainContent.className = 'widget-main-content'; mainContent.innerHTML = `<i class="far fa-star main-star-icon"></i> <span class="rate-text">Оценить</span>`; widget.appendChild(mainContent); userRatingContainer.appendChild(widget); return; } userRatingContainer.classList.remove('disabled'); const mainContent = document.createElement('div'); mainContent.className = 'widget-main-content'; const mainStarIcon = document.createElement('i'); mainStarIcon.className = 'main-star-icon'; const rateTextSpan = document.createElement('span'); if (currentUserRating) { mainStarIcon.classList.add('fas', 'fa-star'); rateTextSpan.className = 'user-rating-value'; rateTextSpan.textContent = currentUserRating; } else { mainStarIcon.classList.add('far', 'fa-star'); rateTextSpan.className = 'rate-text'; rateTextSpan.textContent = 'Оценить'; } mainContent.appendChild(mainStarIcon); mainContent.appendChild(rateTextSpan); const starsFlyout = document.createElement('div'); starsFlyout.className = 'rating-stars-flyout'; for (let i = 1; i <= 10; i++) { const star = document.createElement('i'); star.className = 'fas fa-star flyout-star'; star.dataset.value = i; if (currentUserRating && i <= currentUserRating) { star.classList.add('selected'); } starsFlyout.appendChild(star); } widget.appendChild(mainContent); widget.appendChild(starsFlyout); userRatingContainer.appendChild(widget); const allFlyoutStars = starsFlyout.querySelectorAll('.flyout-star'); starsFlyout.addEventListener('mouseover', (event) => { if (event.target.classList.contains('flyout-star')) { const hoverValue = parseInt(event.target.dataset.value, 10); allFlyoutStars.forEach((star) => { star.classList.toggle('hovered', parseInt(star.dataset.value, 10) <= hoverValue); }); } }); starsFlyout.addEventListener('mouseout', () => { allFlyoutStars.forEach(star => { star.classList.remove('hovered'); }); }); starsFlyout.addEventListener('click', (event) => { if (event.target.classList.contains('flyout-star')) { const ratingValue = parseInt(event.target.dataset.value, 10); if (currentUserRating === ratingValue) { saveUserRating(null); } else { saveUserRating(ratingValue); } } }); }

    // --- Функции для Комментариев (существующий код без изменений) ---
    function createCommentElement(comment, currentUserId) {
        const commentItemElement = document.createElement('div');
        commentItemElement.className = 'comment-item';
        commentItemElement.dataset.commentId = comment.id;

        const commentMainElement = document.createElement('div');
        commentMainElement.className = 'comment-main';

        const commentDate = new Date(comment.created_at).toLocaleString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const updatedAtDate = comment.updated_at && (new Date(comment.updated_at) > new Date(comment.created_at))
            ? new Date(comment.updated_at).toLocaleString('ru-RU', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })
            : null;

        const avatarSrc = (comment.avatar && comment.avatar !== DEFAULT_AVATAR_PATH)
            ? (comment.avatar.startsWith('/') ? comment.avatar : `/${comment.avatar}`)
            : DEFAULT_AVATAR_PATH;

        let editDeleteButtons = '';
        if (currentUserId && comment.user_id === currentUserId) {
            editDeleteButtons = `
                <button class="action-button edit-comment-btn" data-comment-id="${comment.id}"><i class="fas fa-edit"></i></button>
                <button class="action-button delete-comment-btn" data-comment-id="${comment.id}"><i class="fas fa-trash"></i></button>
            `;
        }

        const userVote = comment.user_vote;

        commentMainElement.innerHTML = `
            <div class="comment-author-avatar">
                <img src="${avatarSrc}" alt="Аватар пользователя ${comment.username || 'Аноним'}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR_PATH}';">
            </div>
            <div class="comment-content-wrapper">
                <div class="comment-header">
                    <span class="comment-author-name">${comment.username || 'Аноним'}</span>
                    <span class="comment-date">${commentDate}</span>
                    ${updatedAtDate ? `<span class="comment-updated-date">(изм. ${updatedAtDate})</span>` : ''}
                </div>
                <p class="comment-text">${comment.content.replace(/\n/g, '<br>')}</p>
                <div class="comment-actions">
                    <button class="action-button reply-button" data-comment-id="${comment.id}">Ответить</button>
                    <div class="comment-votes">
                        <button class="vote-btn upvote-btn ${userVote === 1 ? 'active' : ''}" data-vote-type="1" data-comment-id="${comment.id}">
                            <i class="fas fa-arrow-up"></i> <span class="upvote-count">${comment.upvotes || 0}</span>
                        </button>
                        <button class="vote-btn downvote-btn ${userVote === -1 ? 'active' : ''}" data-vote-type="-1" data-comment-id="${comment.id}">
                            <i class="fas fa-arrow-down"></i> <span class="downvote-count">${comment.downvotes || 0}</span>
                        </button>
                    </div>
                    <div class="comment-owner-actions">
                        ${editDeleteButtons}
                    </div>
                </div>
            </div>
        `;
        commentItemElement.appendChild(commentMainElement);

        if (comment.children && comment.children.length > 0) {
            const childrenContainerElement = document.createElement('div');
            childrenContainerElement.className = 'comment-children-container';
            comment.children.forEach(childComment => {
                childrenContainerElement.appendChild(createCommentElement(childComment, currentUserData ? currentUserData.id : null));
            });
            commentItemElement.appendChild(childrenContainerElement);
        }
        return commentItemElement;
    }

    async function loadComments(page = 1) {
        if (!currentTmdbId || !currentMediaType || !commentsListContainer) return;
        currentCommentsPage = page;
        if (commentsLoadingPlaceholder) commentsLoadingPlaceholder.style.display = 'block';
        commentsListContainer.innerHTML = '';
        if (commentsPaginationContainer) commentsPaginationContainer.innerHTML = '';
        const userId = localStorage.getItem('userId');
        const url = `/api/comments/${currentMediaType}/${currentTmdbId}?page=${page}&limit=${COMMENTS_PER_PAGE}${userId ? `&userId=${userId}` : ''}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Не удалось загрузить комментарии (статус: ${response.status})`);
            const data = await response.json();
            if (commentsLoadingPlaceholder) commentsLoadingPlaceholder.style.display = 'none';
            if (data.comments.length === 0 && page === 1) {
                commentsListContainer.innerHTML = '<p class="no-comments-message">Комментариев пока нет. Будьте первым!</p>';
            } else {
                data.comments.forEach(comment => {
                    commentsListContainer.appendChild(createCommentElement(comment, currentUserData ? currentUserData.id : null));
                });
                renderPaginationControls(data.currentPage, data.totalPages);
            }
        } catch (error) {
            console.error("Ошибка загрузки комментариев:", error);
            if (commentsLoadingPlaceholder) commentsLoadingPlaceholder.style.display = 'none';
            commentsListContainer.innerHTML = `<p class="comments-error-message">Ошибка загрузки комментариев: ${error.message}</p>`;
        }
    }

    function renderPaginationControls(currentPage, totalPages) {
        if (!commentsPaginationContainer || totalPages <= 1) {
            if(commentsPaginationContainer) commentsPaginationContainer.innerHTML = '';
            return;
        }
        commentsPaginationContainer.innerHTML = '';
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Назад';
        prevButton.className = 'action-button pagination-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => loadComments(currentPage - 1));
        commentsPaginationContainer.appendChild(prevButton);
        const pageInfo = document.createElement('span');
        pageInfo.className = 'pagination-info';
        pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
        commentsPaginationContainer.appendChild(pageInfo);
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Вперед';
        nextButton.className = 'action-button pagination-btn';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => loadComments(currentPage + 1));
        commentsPaginationContainer.appendChild(nextButton);
        if (!commentsListContainer.nextElementSibling || !commentsListContainer.nextElementSibling.classList.contains('comments-pagination')) {
            commentsListContainer.insertAdjacentElement('afterend', commentsPaginationContainer);
        }
    }

    if (newCommentForm) {
        newCommentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const content = commentTextarea.value.trim();
            const userId = localStorage.getItem('userId');
            if (!content) { showToastNotification('Комментарий не может быть пустым', true); return; }
            if (!userId) { showToastNotification('Для отправки комментария необходимо авторизоваться', true); return; }
            if (!currentTmdbId || !currentMediaType) { showToastNotification('Ошибка: ID фильма или тип не определены.', true); return; }
            const parentIdInput = newCommentForm.querySelector('input[name="parent_id"]');
            const parent_id = parentIdInput ? parentIdInput.value : null;
            const editingCommentIdInput = newCommentForm.querySelector('input[name="editing_comment_id"]');
            const editing_comment_id = editingCommentIdInput ? editingCommentIdInput.value : null;
            const requestMethod = editing_comment_id ? 'PUT' : 'POST';
            const requestUrl = editing_comment_id ? `/api/comments/${editing_comment_id}` : '/api/comments';
            const body = { userId: userId, content: content };
            if (!editing_comment_id) {
                body.tmdb_id = currentTmdbId;
                body.media_type = currentMediaType;
                body.parent_id = parent_id;
            }
            try {
                const response = await fetch(requestUrl, {
                    method: requestMethod,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await response.json();
                if (response.ok) {
                    if (editing_comment_id) {
                        const commentElement = commentsListContainer.querySelector(`.comment-item[data-comment-id="${editing_comment_id}"] .comment-text`);
                        if (commentElement) commentElement.innerHTML = result.content.replace(/\n/g, '<br>');
                        const updatedDateElement = commentsListContainer.querySelector(`.comment-item[data-comment-id="${editing_comment_id}"] .comment-updated-date`);
                        if(updatedDateElement) {
                             updatedDateElement.textContent = `(изм. ${new Date(result.updated_at).toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`;
                        } else {
                            const header = commentsListContainer.querySelector(`.comment-item[data-comment-id="${editing_comment_id}"] .comment-header`);
                            if(header) {
                                const newUpdatedDateEl = document.createElement('span');
                                newUpdatedDateEl.className = 'comment-updated-date';
                                newUpdatedDateEl.textContent = `(изм. ${new Date(result.updated_at).toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`;
                                header.appendChild(newUpdatedDateEl);
                            }
                        }
                        showToastNotification('Комментарий успешно обновлен!', false);
                    } else {
                        loadComments(parent_id ? currentCommentsPage : 1);
                        showToastNotification('Комментарий успешно добавлен!', false);
                    }
                    commentTextarea.value = '';
                    if (parentIdInput) parentIdInput.remove();
                    if (editingCommentIdInput) editingCommentIdInput.remove();
                    newCommentForm.removeAttribute('data-editing');
                } else {
                    showToastNotification(result.error || 'Произошла ошибка', true);
                }
            } catch (error) {
                console.error("Сетевая ошибка:", error);
                showToastNotification('Сетевая ошибка.', true);
            }
        });
    }

    if (commentsListContainer) {
        commentsListContainer.addEventListener('click', async (event) => {
            const target = event.target;
            const userId = localStorage.getItem('userId');
            if (target.closest('.vote-btn')) {
                if (!userId) { showToastNotification('Для голосования необходимо авторизоваться.', true); return; }
                const voteButton = target.closest('.vote-btn');
                const commentId = voteButton.dataset.commentId;
                const voteType = parseInt(voteButton.dataset.voteType);
                const effectiveVoteType = voteButton.classList.contains('active') ? 0 : voteType;
                try {
                    const response = await fetch(`/api/comments/${commentId}/vote`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: userId, voteType: effectiveVoteType })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        const commentVotesElement = voteButton.closest('.comment-votes');
                        if (commentVotesElement) {
                            commentVotesElement.querySelector('.upvote-count').textContent = result.upvotes;
                            commentVotesElement.querySelector('.downvote-count').textContent = result.downvotes;
                            const upvoteBtn = commentVotesElement.querySelector('.upvote-btn');
                            const downvoteBtn = commentVotesElement.querySelector('.downvote-btn');
                            upvoteBtn.classList.remove('active');
                            downvoteBtn.classList.remove('active');
                            if (result.userVote === 1) upvoteBtn.classList.add('active');
                            if (result.userVote === -1) downvoteBtn.classList.add('active');
                        }
                    } else {
                        showToastNotification(result.error || 'Ошибка голосования.', true);
                    }
                } catch (error) {
                    showToastNotification('Сетевая ошибка при голосовании.', true);
                }
            }
            if (target.classList.contains('reply-button')) {
                const commentId = target.dataset.commentId;
                const commentMainElement = target.closest('.comment-main');
                if (!commentMainElement) return;
                const commentItemElement = commentMainElement.parentElement;
                const existingReplyForm = commentItemElement.querySelector('.reply-form-container');
                if (existingReplyForm) {
                    existingReplyForm.remove();
                    return;
                }
                const replyFormContainer = document.createElement('div');
                replyFormContainer.className = 'reply-form-container';
                const replyTextarea = document.createElement('textarea');
                replyTextarea.placeholder = 'Написать ответ...';
                replyTextarea.required = true;
                const replySubmitButton = document.createElement('button');
                replySubmitButton.type = 'button';
                replySubmitButton.className = 'action-button';
                replySubmitButton.textContent = 'Отправить ответ';
                replyFormContainer.appendChild(replyTextarea);
                replyFormContainer.appendChild(replySubmitButton);
                commentMainElement.insertAdjacentElement('afterend', replyFormContainer);
                replyTextarea.focus();
                replySubmitButton.addEventListener('click', async () => {
                    const content = replyTextarea.value.trim();
                    if (!content) { showToastNotification('Ответ не может быть пустым', true); return; }
                    if (!userId) { showToastNotification('Для ответа необходимо авторизоваться', true); return; }
                    const currentParentIdInput = newCommentForm.querySelector('input[name="parent_id"]');
                    if (currentParentIdInput) currentParentIdInput.remove();
                    const hiddenParentIdInput = document.createElement('input');
                    hiddenParentIdInput.type = 'hidden';
                    hiddenParentIdInput.name = 'parent_id';
                    hiddenParentIdInput.value = commentId;
                    newCommentForm.appendChild(hiddenParentIdInput);
                    commentTextarea.value = content;
                    newCommentForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    replyFormContainer.remove();
                });
            }
            if (target.closest('.edit-comment-btn')) {
                if (!userId) { showToastNotification('Для редактирования необходимо авторизоваться.', true); return; }
                const editButton = target.closest('.edit-comment-btn');
                const commentId = editButton.dataset.commentId;
                const commentItem = editButton.closest('.comment-item');
                const commentTextElement = commentItem.querySelector('.comment-text');
                commentTextarea.value = commentTextElement.innerHTML.replace(/<br\s*\/?>/gi, "\n");
                newCommentForm.querySelector('input[name="parent_id"]')?.remove();
                newCommentForm.querySelector('input[name="editing_comment_id"]')?.remove();
                const editingInput = document.createElement('input');
                editingInput.type = 'hidden';
                editingInput.name = 'editing_comment_id';
                editingInput.value = commentId;
                newCommentForm.appendChild(editingInput);
                newCommentForm.setAttribute('data-editing', 'true');
                commentTextarea.focus();
                window.scrollTo({ top: newCommentForm.offsetTop - 100, behavior: 'smooth' });
            }
            if (target.closest('.delete-comment-btn')) {
                if (!userId) { showToastNotification('Для удаления необходимо авторизоваться.', true); return; }
                const deleteButton = target.closest('.delete-comment-btn');
                const commentId = deleteButton.dataset.commentId;
                try {
                    const response = await fetch(`/api/comments/${commentId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: userId })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showToastNotification(result.message, false);
                        const commentElement = deleteButton.closest('.comment-item');
                        if (commentElement) commentElement.remove();
                        if (commentsListContainer.children.length === 0) {
                            loadComments(currentCommentsPage > 1 ? currentCommentsPage -1 : 1);
                        }
                    } else {
                        showToastNotification(result.error || 'Ошибка удаления.', true);
                    }
                } catch (error) {
                    showToastNotification('Сетевая ошибка при удалении.', true);
                }
            }
        });
    }

    // --- Seasons and Episodes Tab Logic (измененный код для вызова openPlayerModal) ---
    function renderSeasonsAndEpisodesTab(seasonsData) {
        if (!seasonsEpisodesTabPane) return;
        const layoutContainer = seasonsEpisodesTabPane.querySelector('.seasons-episodes-layout');
        if (!layoutContainer) return;
        const seasonsListPanel = layoutContainer.querySelector('.seasons-list-panel');
        const episodesListPanel = layoutContainer.querySelector('.episodes-list-panel');
        if (!seasonsListPanel || !episodesListPanel) return;
        seasonsListPanel.innerHTML = '';
        episodesListPanel.innerHTML = '<p class="select-season-placeholder" style="text-align: center; padding: 20px; color: #A0A0A0;">Выберите сезон для просмотра серий.</p>';
        episodesListPanel.classList.remove('active');
        currentSelectedSeasonNumber = null;
        if (!seasonsData || seasonsData.length === 0) {
            seasonsListPanel.innerHTML = '<p class="no-seasons-message">Информация о сезонах отсутствует.</p>';
            return;
        }
        const displayableSeasons = seasonsData.filter(season => season.season_number !== 0 || (season.season_number === 0 && season.episodes && season.episodes.length > 0));
        displayableSeasons.forEach(season => {
            if (season.season_number === 0 && (!season.episodes || season.episodes.length === 0)) {
                return;
            }
            const seasonItem = document.createElement('div');
            seasonItem.className = 'season-item';
            seasonItem.dataset.seasonNumber = season.season_number;
            const posterPath = season.poster_path ? `${TMDB_IMAGE_BASE_URL}${SEASON_POSTER_SIZE}${season.poster_path}` : 'https://placehold.co/154x231/1A1A1A/555555?text=Нет+постера';
            const airYear = season.air_date ? new Date(season.air_date).getFullYear() : 'N/A';
            const episodeCount = season.episode_count || (season.episodes ? season.episodes.length : 0);
            seasonItem.innerHTML = `
                <img src="${posterPath}" alt="Постер ${season.name}" class="season-item-poster" onerror="this.onerror=null;this.src='https://placehold.co/80x120/1A1A1A/555555?text=Нет+фото';">
                <div class="season-item-info">
                    <h4 class="season-item-title">${season.name} (${airYear})</h4>
                    <p class="season-item-meta">${episodeCount} серий</p>
                    <p class="season-item-overview">${season.overview || 'Описание сезона отсутствует.'}</p>
                </div>
            `;
            seasonItem.addEventListener('click', () => {
                const currentActiveSeason = seasonsListPanel.querySelector('.season-item.active');
                if (currentActiveSeason) {
                    currentActiveSeason.classList.remove('active');
                }
                seasonItem.classList.add('active');
                currentSelectedSeasonNumber = season.season_number;
                renderEpisodes(season.episodes || [], episodesListPanel, season.season_number);
                episodesListPanel.classList.add('active');
            });
            seasonsListPanel.appendChild(seasonItem);
        });
         if (seasonsListPanel.children.length === 0) {
            seasonsListPanel.innerHTML = '<p class="no-seasons-message">Информация о сезонах отсутствует.</p>';
        }
    }

    function renderEpisodes(episodesData, episodesPanelElement, seasonNumber) {
        episodesPanelElement.innerHTML = '';
        if (!episodesData || episodesData.length === 0) {
            episodesPanelElement.innerHTML = '<p class="no-episodes-message">В этом сезоне нет информации о сериях.</p>';
            return;
        }
        episodesData.forEach(episode => {
            const episodeItem = document.createElement('div');
            episodeItem.className = 'episode-item';
            episodeItem.dataset.episodeName = episode.name || `Серия ${episode.episode_number}`;
            episodeItem.dataset.episodeNumber = episode.episode_number;
            episodeItem.dataset.seasonNumber = seasonNumber; // Используем camelCase для JS, но dataset преобразует в data-season-number
            const stillPath = episode.still_path ? `${TMDB_IMAGE_BASE_URL}${EPISODE_STILL_SIZE}${episode.still_path}` : 'https://placehold.co/300x169/1A1A1A/555555?text=Нет+кадра';
            const airDate = episode.air_date ? new Date(episode.air_date).toLocaleDateString('ru-RU') : 'N/A';
            const runtime = episode.runtime ? `${episode.runtime} мин.` : 'N/A';
            episodeItem.innerHTML = `
                <img src="${stillPath}" alt="Кадр ${episode.name}" class="episode-item-still" onerror="this.onerror=null;this.src='https://placehold.co/178x100/1A1A1A/555555?text=Нет+фото';">
                <div class="episode-item-details">
                    <h5 class="episode-item-title">S${seasonNumber} E${episode.episode_number}: ${episode.name || 'Без названия'}</h5>
                    <p class="episode-item-meta">Дата выхода: ${airDate} | Длительность: ${runtime}</p>
                    <p class="episode-item-overview">${episode.overview || 'Описание серии отсутствует.'}</p>
                    </div>
            `;
            episodeItem.addEventListener('click', () => {
                // При клике на эпизод открываем модальное окно с плеером Kinobox
                // Передаем TMDB ID текущего сериала. Kinobox сам должен обработать выбор сезона/серии,
                // если он загружен с ID сериала. Если Kinobox поддерживает прямую ссылку на эпизод через опции kbox,
                // то можно передать seasonNumber и episode.episode_number в openPlayerModal.
                // Судя по вашей документации, опции kbox не включают явную передачу сезона/эпизода.
                if (currentTmdbId) {
                    openPlayerModal(currentTmdbId); // Открываем плеер для всего сериала/фильма
                } else {
                    showToastNotification('Не удалось определить ID контента для просмотра.', true);
                }
            });
            episodesPanelElement.appendChild(episodeItem);
        });
    }

    // --- Инициализация страницы (существующий код без изменений) ---
    async function fetchAndDisplayDetails(tmdbId, mediaType) {
        currentTmdbId = tmdbId;
        currentMediaType = mediaType;
        try {
            const response = await fetch(`/api/tmdb/details/${mediaType}/${tmdbId}?append_to_response=images,videos,credits,similar,recommendations,release_dates,content_ratings,all_season_details`);
            if (!response.ok) { throw new Error('Не удалось загрузить данные о контенте.'); }
            const data = await response.json();
            currentItemData = { ...data, media_type: mediaType, userListCategory: null, userRating: null };
            document.title = `${currentItemData.title || currentItemData.name} - ФильмоПОИСК`;
            if (bgImage) { const newBgSrc = currentItemData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}original${currentItemData.backdrop_path}` : '/images/no_image.png'; bgImage.onerror = function() { this.onerror = null; this.src = 'https://placehold.co/1920x1080/0D0D0D/333333?text=Error+Loading+Background'; this.alt = 'Ошибка загрузки фона'; }; bgImage.src = newBgSrc; }
            if (posterImage) { const newPosterSrc = currentItemData.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${currentItemData.poster_path}` : '/images/default-poster.jpg'; posterImage.onerror = function() { this.onerror = null; this.src = 'https://placehold.co/500x750/1A1A1A/555555?text=Error+Loading+Poster'; this.alt = 'Ошибка загрузки постера'; }; posterImage.src = newPosterSrc; }
            if (titleElement) titleElement.textContent = currentItemData.title || currentItemData.name;
            if (statusElement) statusElement.textContent = currentItemData.status === 'Released' ? 'Вышел' : (currentItemData.status || 'Неизвестно');
            if (typeElement) typeElement.textContent = mediaType === 'movie' ? 'Фильм' : 'Сериал';
            if (episodesElement) episodesElement.textContent = mediaType === 'tv' ? `${currentItemData.number_of_episodes || 'N/A'} эп.` : '';
            const releaseYear = currentItemData.release_date || currentItemData.first_air_date;
            if (yearElement) yearElement.textContent = releaseYear ? new Date(releaseYear).getFullYear() : 'N/A';
            if (ageRatingElement) { let itemAgeRatingText = 'N/A'; if (currentItemData.content_ratings?.results) { const ruRating = currentItemData.content_ratings.results.find(r => r.iso_3166_1 === 'RU'); if (ruRating?.rating) itemAgeRatingText = ruRating.rating; } else if (currentItemData.release_dates?.results) { const ruRelease = currentItemData.release_dates.results.find(r => r.iso_3166_1 === 'RU'); if (ruRelease?.release_dates?.length > 0) { const cert = ruRelease.release_dates.find(rd => rd.certification && rd.certification !== ""); if (cert) itemAgeRatingText = cert.certification; } } ageRatingElement.textContent = itemAgeRatingText; }
            if (descriptionElement) descriptionElement.textContent = currentItemData.overview || 'Описание отсутствует.';
            if (ratingBadge) applyRatingStyles(ratingBadge, currentItemData.vote_average);
            if (infoListContainer) { infoListContainer.innerHTML = ''; const detailsMap = { "original_title": { label: "Оригинальное название", value: currentItemData.original_title || currentItemData.original_name }, "studios": { label: "Студия", value: currentItemData.production_companies?.map(c => c.name).join(', ') }, "status": { label: "Статус", value: currentItemData.status === 'Released' ? 'Вышел' : (currentItemData.status || 'Неизвестно') }, "number_of_episodes": { label: "Количество эпизодов", value: mediaType === 'tv' ? currentItemData.number_of_episodes : null }, "first_air_date": { label: "Год выпуска", value: releaseYear ? new Date(releaseYear).getFullYear() : 'N/A' }, "genres": { label: "Жанры", value: currentItemData.genres?.map(g => g.name).join(', ') }, "countries": { label: "Страна производства", value: currentItemData.production_countries?.map(c => c.name).join(', ') }, "runtime": { label: "Длительность", value: mediaType === 'tv' ? `${currentItemData.episode_run_time?.[0] || 'N/A'} мин.` : `${currentItemData.runtime || 'N/A'} мин.` }, "actors": { label: "Актеры", value: getNamesList(currentItemData.credits?.cast, 10) }, "directors": { label: "Режиссеры", value: getNamesList(currentItemData.credits?.crew?.filter(p => p.job === "Director"), 5) }, "producers": { label: "Продюсеры", value: getNamesList(currentItemData.credits?.crew?.filter(p => p.department === "Production" && (p.job === "Producer" || p.job === "Executive Producer")), 5) }, }; for (const key in detailsMap) { const item = detailsMap[key]; if (item.value && item.value !== 'N/A' && String(item.value).trim() !== '' && item.value !== 0) { const infoEl = document.createElement('div'); infoEl.className = 'anime_info_el'; infoEl.innerHTML = `<span class="anime_info_el_key">${item.label}</span><span class="anime_info_el_value">${item.value}</span>`; infoListContainer.appendChild(infoEl); } } }
            const userId = localStorage.getItem('userId'); if (userId) { const listItemData = await getItemListStatus(userId, currentItemData.id, currentItemData.media_type); if (listItemData) { currentItemData.userListCategory = listItemData.category; currentItemData.userRating = listItemData.rating; } } createRatingWidget(currentItemData.userRating); updateListCategoryDropdownCheckmarks();
            if (mediaType === 'tv' && seasonsEpisodesTabButton) {
                seasonsEpisodesTabButton.style.display = 'block';
                if (currentItemData.all_season_details) {
                    renderSeasonsAndEpisodesTab(currentItemData.all_season_details);
                } else {
                     const seasonsListPanel = seasonsEpisodesTabPane?.querySelector('.seasons-list-panel');
                     if(seasonsListPanel) seasonsListPanel.innerHTML = '<p class="no-seasons-message">Подробная информация о сезонах не найдена.</p>';
                }
            } else if (seasonsEpisodesTabButton) {
                seasonsEpisodesTabButton.style.display = 'none';
            }
            const stillsTabButton = document.querySelector('.tab-button-watch[data-tab-target="#tab-stills"]'); if (mediaType === 'tv' && stillsTabButton && stillsTabPane) { stillsTabButton.style.display = 'block'; stillsTabPane.innerHTML = '<div class="search-loading-indicator" style="display:flex; justify-content:center; padding:20px;"></div>'; if (currentItemData.all_season_details && currentItemData.all_season_details.length > 0) { const maxEpisodesToFetchStillsFrom = 20; let episodesWithDetails = []; currentItemData.all_season_details.forEach(season => { if (season.episodes && season.episodes.length > 0) { episodesWithDetails.push(...season.episodes.map(ep => ({...ep, season_number: season.season_number}))); } }); for (let i = episodesWithDetails.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [episodesWithDetails[i], episodesWithDetails[j]] = [episodesWithDetails[j], episodesWithDetails[i]]; } const episodesToFetch = episodesWithDetails.slice(0, maxEpisodesToFetchStillsFrom); if (episodesToFetch.length > 0) { const stillPromises = episodesToFetch.map(episode => fetchStillsForEpisode(tmdbId, episode.season_number, episode.episode_number)); const results = await Promise.all(stillPromises); renderStills(results.flat(), stillsTabPane); } else { renderStills([], stillsTabPane); } } else { renderStills([], stillsTabPane); } } else if (stillsTabButton) { stillsTabButton.style.display = 'none'; if(stillsTabPane) stillsTabPane.innerHTML = ''; }
            if (backdropsTabPane) { if (currentItemData.images?.backdrops && currentItemData.images.backdrops.length > 0) { renderBackdrops(currentItemData.images.backdrops, backdropsTabPane); } else { backdropsTabPane.innerHTML = '<p class="empty-tab-message">Задники отсутствуют.</p>'; } }
            if (postersTabPane) { if (currentItemData.images?.posters && currentItemData.images.posters.length > 0) { renderPosters(currentItemData.images.posters, postersTabPane); } else { postersTabPane.innerHTML = '<p class="empty-tab-message">Постеры отсутствуют.</p>'; } }
            if (videosGrid) { videosGrid.innerHTML = ''; const trailers = currentItemData.videos?.results?.filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || []; if (trailers.length > 0) { trailers.slice(0, 12).forEach(video => { const videoEl = document.createElement('div'); videoEl.className = 'video-item media-item'; videoEl.innerHTML = ` <img src="https://i.ytimg.com/vi/${video.key}/mqdefault.jpg" alt="${video.name}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/320x180/1A1A1A/555555?text=No+Trailer+Thumb'; this.alt='Нет превью трейлера';"> <div class="play-icon"><i class="fas fa-play"></i></div> `; videoEl.addEventListener('click', () => { window.open(`https://www.youtube.com/watch?v=${video.key}`, '_blank'); }); videosGrid.appendChild(videoEl); }); } else { videosGrid.innerHTML = '<p class="empty-tab-message">Трейлеры отсутствуют.</p>'; } }
            const similarTab = document.getElementById('tab-similar'); const recommendationsTab = document.getElementById('tab-recommendations');
            if (similarTab) { similarTab.innerHTML = ''; if (currentItemData.similar?.results?.length > 0) { const shelf = createShelfElement('similar-shelf', '', false); similarTab.appendChild(shelf); renderSingleShelf(shelf, currentItemData.similar.results.map(item => ({ ...item, id: item.id, media_type: item.media_type || mediaType, title: item.title, name: item.name, poster_path: item.poster_path, overview: item.overview, vote_average: item.vote_average }))); } else { similarTab.innerHTML = '<p class="empty-tab-message">Похожих не найдено.</p>'; } }
            if (recommendationsTab) { recommendationsTab.innerHTML = ''; if (currentItemData.recommendations?.results?.length > 0) { const shelf = createShelfElement('recommendations-shelf', '', false); recommendationsTab.appendChild(shelf); renderSingleShelf(shelf, currentItemData.recommendations.results.map(item => ({ ...item, id: item.id, media_type: item.media_type || mediaType, title: item.title, name: item.name, poster_path: item.poster_path, overview: item.overview, vote_average: item.vote_average }))); } else { recommendationsTab.innerHTML = '<p class="empty-tab-message">Рекомендаций не найдено.</p>'; } }
            loadComments(1);
        } catch (error) {
            console.error("Ошибка при загрузке деталей:", error);
            if (watchPageContainer) watchPageContainer.innerHTML = `<h1>Ошибка загрузки. Пожалуйста, попробуйте позже.</h1><p>${error.message}</p>`;
        }
    }

    // --- ВОССТАНОВЛЕННЫЙ КОД ДЛЯ КНОПКИ "ДОБАВИТЬ В СПИСОК" (существующий код без изменений) ---
    if (addToCatalogBtn && catalogCategoryDropdown) {
        addToCatalogBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            const userId = localStorage.getItem('userId');
            if (!userId) {
                showToastNotification('Для добавления в список необходимо авторизоваться.', true);
                return;
            }
            if (!currentItemData) {
                showToastNotification('Данные о фильме/сериале не загружены.', true);
                return;
            }
            const listItemData = await getItemListStatus(userId, currentItemData.id, currentItemData.media_type);
            if (listItemData) {
                currentItemData.userListCategory = listItemData.category;
                if (typeof listItemData.rating !== 'undefined') {
                     currentItemData.userRating = listItemData.rating;
                }
            } else {
                 currentItemData.userListCategory = null;
            }
            createRatingWidget(currentItemData.userRating);
            updateListCategoryDropdownCheckmarks();
            catalogCategoryDropdown.classList.toggle('active');
        });
        catalogCategoryDropdown.querySelectorAll('button').forEach(categoryButton => {
            categoryButton.addEventListener('click', async () => {
                const selectedCategory = categoryButton.dataset.category;
                const userId = localStorage.getItem('userId');
                if (!userId || !currentItemData) {
                    showToastNotification('Ошибка: Пользователь не авторизован или данные фильма не найдены.', true);
                    catalogCategoryDropdown.classList.remove('active');
                    return;
                }
                const { id: tmdb_id, media_type, title, name, poster_path, userRating } = currentItemData;
                const itemTitle = title || name;
                const dataToSend = {
                    tmdb_id: parseInt(tmdb_id, 10),
                    media_type: media_type,
                    category: selectedCategory,
                    title: itemTitle,
                    poster_path: poster_path,
                    rating: userRating
                };
                try {
                    const response = await fetch(`/api/user/${userId}/lists`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSend)
                    });
                    const result = await response.json();
                    if (response.ok) {
                        const message = result.message || `"${itemTitle}" успешно добавлен(а) в категорию "${selectedCategory}"!`;
                        showToastNotification(message, false);
                        currentItemData.userListCategory = selectedCategory;
                        updateListCategoryDropdownCheckmarks();
                        createRatingWidget(currentItemData.userRating);
                    } else {
                        showToastNotification(`Ошибка: ${result.error || 'Не удалось обновить список.'}`, true);
                    }
                } catch (error) {
                    console.error('Сетевая ошибка или ошибка сервера:', error);
                    showToastNotification('Сетевая ошибка при обновлении списка.', true);
                }
                finally {
                    catalogCategoryDropdown.classList.remove('active');
                }
            });
        });
    }

    // --- ВОССТАНОВЛЕННЫЙ КОД ДЛЯ ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК (существующий код без изменений) ---
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (event) => {
            const targetButton = event.target.closest('.tab-button-watch');
            if (!targetButton || targetButton.classList.contains('active')) return;
            const currentActiveButton = tabsContainer.querySelector('.tab-button-watch.active');
            if (currentActiveButton) currentActiveButton.classList.remove('active');
            targetButton.classList.add('active');
            if (tabPanesContainer) {
                const currentActivePane = tabPanesContainer.querySelector('.tab-pane-watch.active');
                if (currentActivePane) currentActivePane.classList.remove('active');
                const targetPaneId = targetButton.dataset.tabTarget;
                const targetPane = document.querySelector(targetPaneId);
                if (targetPane) {
                    targetPane.classList.add('active');
                    if (targetPaneId === '#tab-seasons-episodes') {
                        const episodesPanel = targetPane.querySelector('.episodes-list-panel');
                        if (episodesPanel && currentSelectedSeasonNumber === null) {
                           // episodesPanel.classList.remove('active');
                        }
                    }
                }
            }
        });
    }

    // --- НОВАЯ ЛОГИКА для модального окна плеера Kinobox ---
    function openPlayerModal(tmdbIdToPlay) { // Убраны seasonNumber, episodeNumber, т.к. kbox() их не принимает в опциях
        if (!tmdbIdToPlay) {
            showToastNotification('Не удалось определить ID контента для просмотра.', true);
            return;
        }
        if (!playerModal || !kinoboxPlayerTarget || !playerModalContent) {
            console.error('Элементы модального окна плеера не найдены!');
            return;
        }

        // 1. Очистить предыдущий плеер и сбросить состояние
        kinoboxPlayerTarget.innerHTML = ''; // Очищаем контейнер для плеера
        if (kinoboxExternalScript && kinoboxExternalScript.parentNode) {
            kinoboxExternalScript.parentNode.removeChild(kinoboxExternalScript); // Удаляем старый скрипт
            kinoboxExternalScript = null;
        }
        playerModalContent.classList.remove('fullscreen'); // Сброс на случай, если закрыли в полноэкранном

        // 2. Настройки для Kinobox
        const kinoboxOptions = {
            search: {
                tmdb: String(tmdbIdToPlay) // TMDB ID фильма/сериала
            },
            menu: { // Стандартные настройки меню, можно изменить
                enable: true,
                default: 'menu_list',
                mobile: 'menu_button',
                // format: '{N} :: {T} ({Q})', // Можно раскомментировать и настроить
                // limit: 5,
            },
            players: { // Пример настройки источников, можно добавить нужные
                 alloha: { enable: true, position: 1 }, // Включаем Alloha по умолчанию, если это ваш основной источник
                 kodik: { enable: true, position: 2 }   // Включаем Kodik
                // Добавьте другие источники по необходимости
            },
            notFoundMessage: 'К сожалению, видео не найдено.'
            // Можно добавить другие опции из документации Kinobox
        };

        // 3. Динамически загрузить и выполнить скрипт Kinobox
        kinoboxExternalScript = document.createElement('script');
        kinoboxExternalScript.src = 'https://kinobox.tv/kinobox.min.js';
        kinoboxExternalScript.async = true;

        kinoboxExternalScript.onload = () => {
            console.log("Kinobox script loaded.");
            if (window.kbox && kinoboxPlayerTarget) {
                try {
                    console.log("Initializing Kinobox with options:", kinoboxOptions, "on target:", kinoboxPlayerTarget);
                    window.kbox(kinoboxPlayerTarget, kinoboxOptions); // Инициализируем плеер
                } catch (e) {
                    console.error("Error initializing Kinobox:", e);
                    showToastNotification('Ошибка инициализации плеера Kinobox.', true);
                }
            } else {
                console.error('Kinobox function kbox not found or target is missing after script load.');
                showToastNotification('Не удалось загрузить функцию плеера Kinobox.', true);
            }
        };
        kinoboxExternalScript.onerror = () => {
            console.error('Failed to load Kinobox script.');
            showToastNotification('Не удалось загрузить скрипт плеера Kinobox.', true);
        };

        document.body.appendChild(kinoboxExternalScript); // Добавляем в body, чтобы он выполнился

        // 4. Показать модальное окно
        playerModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Предотвратить прокрутку фона

        // 5. Плавное расширение на весь экран
        setTimeout(() => {
            if (playerModalContent) playerModalContent.classList.add('fullscreen');
        }, 50);
    }

    function closePlayerModal() {
        if (!playerModal || !kinoboxPlayerTarget || !playerModalContent) return;

        playerModal.style.display = 'none';
        document.body.style.overflow = '';

        // Удалить скрипт Kinobox
        if (kinoboxExternalScript && kinoboxExternalScript.parentNode) {
            kinoboxExternalScript.parentNode.removeChild(kinoboxExternalScript);
            kinoboxExternalScript = null;
        }
        // Очистить контейнер плеера (Kinobox может сам удалять содержимое, но для надежности)
        if (kinoboxPlayerTarget) kinoboxPlayerTarget.innerHTML = '';
        // Сбросить класс fullscreen
        if (playerModalContent) playerModalContent.classList.remove('fullscreen');
    }

    // Обновленный обработчик для главной кнопки "Смотреть"
    if (watchNowMainBtn) {
        watchNowMainBtn.addEventListener('click', () => {
            if (currentTmdbId) {
                openPlayerModal(currentTmdbId);
            } else {
                showToastNotification('Не удалось определить ID контента для просмотра.', true);
            }
        });
    }

    // Обработчик для кнопки закрытия модального окна плеера
    if (playerModalCloseBtn) {
        playerModalCloseBtn.addEventListener('click', closePlayerModal);
    }

    // Закрытие модального окна плеера по Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && playerModal && playerModal.style.display === 'flex') {
            closePlayerModal();
        }
    });
    // --- Конец новой логики для модального окна плеера ---


    const params = new URLSearchParams(window.location.search);
    const tmdbIdParam = params.get('tmdbId');
    const mediaTypeParam = params.get('type');

    tabsContainer?.querySelectorAll('.tab-button-watch.active').forEach(b => b.classList.remove('active'));
    tabPanesContainer?.querySelectorAll('.tab-pane-watch.active').forEach(p => p.classList.remove('active'));

    const defaultActiveTabButton = document.querySelector('.tab-button-watch[data-tab-target="#tab-backdrops"]');
    if (defaultActiveTabButton && !tabsContainer?.querySelector('.tab-button-watch.active')) {
        defaultActiveTabButton.classList.add('active');
        const defaultActivePane = document.querySelector(defaultActiveTabButton.dataset.tabTarget);
        if (defaultActivePane) defaultActivePane.classList.add('active');
    }

    if (tmdbIdParam && mediaTypeParam) {
        fetchAndDisplayDetails(tmdbIdParam, mediaTypeParam).then(() => {
            const currentActiveButton = tabsContainer?.querySelector('.tab-button-watch.active');
            if (!currentActiveButton) {
                let newDefaultButton;
                if (currentMediaType === 'tv') {
                    newDefaultButton = seasonsEpisodesTabButton?.style.display !== 'none'
                        ? seasonsEpisodesTabButton
                        : document.querySelector('.tab-button-watch[data-tab-target="#tab-stills"]');
                } else {
                    newDefaultButton = document.querySelector('.tab-button-watch[data-tab-target="#tab-backdrops"]');
                }
                if (newDefaultButton) {
                    newDefaultButton.classList.add('active');
                    const newDefaultPane = document.querySelector(newDefaultButton.dataset.tabTarget);
                    if (newDefaultPane) newDefaultPane.classList.add('active');
                }
            }
        });
    } else {
        if (watchPageContainer) watchPageContainer.innerHTML = '<h1>Ошибка: ID или тип контента не указаны в URL.</h1>';
    }
    updateUserProfileDisplay();
});