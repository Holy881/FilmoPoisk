// home.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Элементы DOM для Hero секции ---
    const heroSection = document.getElementById('hero-section');
    const heroVideoContainer = heroSection?.querySelector('.hero-video-container');
    const heroFallback = heroSection?.querySelector('.hero-fallback');
    const heroFallbackImg = heroFallback?.querySelector('img');
    const heroActionButtonsContainer = heroSection?.querySelector('.hero-action-buttons-container');
    const soundButton = heroActionButtonsContainer?.querySelector('.sound-button');
    const soundIcon = soundButton?.querySelector('i');
    const infoToggleButton = heroActionButtonsContainer?.querySelector('.info-toggle-button');
    const heroContentDisplay = heroSection?.querySelector('.hero-content-display');
    const heroTitleElement = heroContentDisplay?.querySelector('.hero-title');
    const heroDescriptionElement = heroContentDisplay?.querySelector('.hero-description');
    const heroWatchButton = heroContentDisplay?.querySelector('.hero-button.action-button');

    // --- Элементы для "Полок" и детальной информации ---
    const contentArea = document.querySelector('.content-area');
    const dynamicShelvesContainer = document.getElementById('dynamic-shelves-container');
    const genreShelvesMainContainer = document.getElementById('genre-shelves-main-container');
    const genreShelvesArea = document.getElementById('genre-shelves-area');
    const genreAreaToggleButton = document.getElementById('genre-area-toggle-button');

    const detailedInfoPanel = document.getElementById('detailed-info-panel');
    const detailedInfoCloseBtn = detailedInfoPanel?.querySelector('.detailed-info-close-btn');

    const detailedInfoContentWrapper = detailedInfoPanel?.querySelector('.detailed-info-content-wrapper');
    const detailedInfoLeftColumn = detailedInfoPanel?.querySelector('.detailed-info-left-column');

    const detailedInfoTitle = detailedInfoLeftColumn?.querySelector('.detailed-info-title');
    const detailedInfoRatingDisplay = detailedInfoLeftColumn?.querySelector('.meta-rating-display');
    const detailedInfoYear = detailedInfoLeftColumn?.querySelector('.meta-year');
    const detailedInfoEpisodes = detailedInfoLeftColumn?.querySelector('.meta-episodes');
    const detailedInfoSeasons = detailedInfoLeftColumn?.querySelector('.meta-seasons');
    const detailedInfoAgeRating = detailedInfoLeftColumn?.querySelector('.meta-age-rating');
    const detailedInfoGenresText = detailedInfoLeftColumn?.querySelector('.detailed-info-genres');
    const detailedInfoOverview = detailedInfoLeftColumn?.querySelector('#tab-about-details .detailed-info-overview');

    const detailedInfoWatchBtn = detailedInfoLeftColumn?.querySelector('.watch-now-btn');
    const addToListBtn = detailedInfoLeftColumn?.querySelector('.add-to-list-btn');
    const listCategoryDropdown = detailedInfoLeftColumn?.querySelector('.list-category-dropdown');

    const detailedInfoTabsContainer = detailedInfoLeftColumn?.querySelector('.detailed-info-tabs');
    const detailedInfoBackdropImage = detailedInfoPanel?.querySelector('.detailed-info-right-column .detailed-info-backdrop-image');

    // --- Элементы DOM для Navbar и User Profile ---
    const navbar = document.querySelector('.navbar');
    const navbarButtons = document.querySelectorAll('.navbar-button');
    const userProfileLink = document.getElementById('user-profile-link');
    const userProfileIconContainer = document.getElementById('user-profile-icon-container');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
    const dropdownUsernameDisplay = document.getElementById('dropdown-username-display');
    const dropdownProfileButton = document.getElementById('dropdown-profile-button');
    const dropdownLogoutButton = document.getElementById('dropdown-logout-button');

    // --- Элементы DOM для Search Modal ---
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

    // --- Элементы для toast-уведомлений ---
    const toastNotification = document.getElementById('toast-notification');
    const toastNotificationMessage = document.getElementById('toast-notification-message');
    let toastTimeout = null;


    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
    const BACKDROP_SIZE_HERO = 'original';
    const POSTER_SIZE_CARD = 'w342'; 
    const POSTER_SIZE_SEASON_CARD = 'w185';
    const BACKDROP_SIZE_DETAILS_LARGE = 'w1280';
    const POSTER_SIZE_SEARCH = 'w154';


    const DEFAULT_VOLUME_LEVEL = 0.1;
    const VOLUME_ANIMATION_DURATION = 1500;
    const popularScrollThreshold = 50;

    let searchTimeout;
    let allMovieGenresMap = new Map();
    let allTvGenresMap = new Map();
    let isHeroSoundActive = false;
    let currentHeroVideoElement = null;
    let isInfoPinned = false;
    let currentUserData = null;
    let currentlyOpenShelfForDetails = null;
    let currentActiveMovieTile = null;
    let currentActiveTabPane = null;
    let currentDetailedItemData = null; 

    const DEFAULT_AVATAR_PATH = '/images/default-avatar.png';
    const placeholderMovies = [
        { id: 1, tmdb_id: 550, media_type: 'movie', title: 'Бойцовский клуб', name: 'Бойцовский клуб', poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3pmJK.jpg', vote_average: 8.43, overview: 'Сотрудник страховой компании страдает хронической бессонницей и отчаянно пытается вырваться из мучительно скучной жизни. Однажды он встречает Тайлера Дёрдена, харизматичного торговца мылом с извращённой философией. Тайлер уверен, что самосовершенствование — удел слабых, а саморазрушение — единственное, ради чего стоит жить.', release_date: '1999-10-15', first_air_date: null, genres: [{id: 18, name: 'Драма'}], number_of_episodes: null, number_of_seasons: null },
        { id: 2, tmdb_id: 1399, media_type: 'tv', title: 'Игра престолов', name: 'Игра престолов', poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg', vote_average: 8.4, overview: 'К концу подходит время благоденствия, и лето, длившееся почти десятилетие, угасает. Вокруг средоточия власти Семи королевств, Железного трона, зреет заговор, и в это непростое время король решает искать поддержки у друга юности Эддарда Старка. В мире, где все — от короля до наемника — рвутся к власти, плетут интриги и готовы вонзить нож в спину, есть место и благородству, состраданию и любви. Между тем, никто не замечает пробуждения тьмы из легенд далеко на Севере — и лишь Стена защищает живых к югу от нее.', release_date: null, first_air_date: '2011-04-17', genres: [{id: 10765, name: 'Sci-Fi & Fantasy'}, {id: 18, name: 'Драма'}, {id: 10759, name: 'Action & Adventure'}], number_of_episodes: 73, number_of_seasons: 8 },
    ];
    const EXCLUDED_TV_GENRE_IDS = [10767, 10764, 10763, 10766];

    const GENRES_FOR_SHELVES = [
        { id: 28, name: "Боевик" }, { id: 12, name: "Приключения" }, { id: 16, name: "Мультфильм" },
        { id: 35, name: "Комедия" }, { id: 80, name: "Криминал" }, { id: 18, name: "Драма" },
        { id: 14, name: "Фэнтези" }, { id: 27, name: "Ужасы" }, { id: 9648, name: "Детектив" },
        { id: 10749, name: "Мелодрама" }, { id: 878, name: "Фантастика" }, { id: 53, name: "Триллер" },
        { id: 10752, name: "Военный" }
    ];

    function showToastNotification(message, isError = false, duration = 3000) {
        if (!toastNotification || !toastNotificationMessage) return;

        toastNotificationMessage.textContent = message;
        toastNotification.classList.remove('error', 'success'); // Сначала убираем оба класса
        if (isError) {
            toastNotification.classList.add('error');
        } else {
            toastNotification.classList.add('success');
        }

        toastNotification.classList.add('active');

        // Очищаем предыдущий таймаут, если он был
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('active');
        }, duration);
    }
    
    window.onclick = function(event) {
        // Закрытие дропдауна категорий при клике вне его
        if (listCategoryDropdown && listCategoryDropdown.classList.contains('active')) {
            if (!addToListBtn?.contains(event.target) && !listCategoryDropdown.contains(event.target)) {
                listCategoryDropdown.classList.remove('active');
            }
        }
    }


    function createShelfElement(id, titleText) {
        const shelfSection = document.createElement('section');
        shelfSection.className = 'movie-shelf';
        shelfSection.id = id;
        const title = document.createElement('h2');
        title.textContent = titleText;
        shelfSection.appendChild(title);
        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'shelf-grid-wrapper';
        const controls = document.createElement('div');
        controls.className = 'shelf-controls';
        controls.innerHTML = `
            <button class="shelf-arrow prev-arrow" aria-label="Предыдущие"><i class="fas fa-chevron-left"></i></button>
            <button class="shelf-arrow next-arrow" aria-label="Следующие"><i class="fas fa-chevron-right"></i></button>
        `;
        gridWrapper.appendChild(controls);
        const grid = document.createElement('div');
        grid.className = 'shelf-grid';
        gridWrapper.appendChild(grid);
        shelfSection.appendChild(gridWrapper);
        return shelfSection;
    }

    function handlePopularSectionVisibility() {
        const popularShelfElement = document.getElementById('popular');
        if (!popularShelfElement) return;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        popularShelfElement.classList.toggle('hidden-on-scroll', scrollTop <= popularScrollThreshold);
    }

    function setDefaultUserIcon() {
        if (!userProfileIconContainer) return;
        userProfileIconContainer.innerHTML = '<i class="fas fa-user"></i>';
        if (dropdownUsernameDisplay) dropdownUsernameDisplay.textContent = 'Гость';
    }

    async function updateUserProfileDisplay() {
        if (!userProfileIconContainer) { setDefaultUserIcon(); if (profileDropdownMenu) profileDropdownMenu.classList.remove('active'); return; }
        const userId = localStorage.getItem('userId');
        if (userId) {
            try {
                const response = await fetch(`/api/user/${userId}`);
                if (!response.ok) { localStorage.removeItem('userId'); currentUserData = null; setDefaultUserIcon(); if (profileDropdownMenu) profileDropdownMenu.classList.remove('active'); return; }
                currentUserData = await response.json();
                if (dropdownUsernameDisplay) dropdownUsernameDisplay.textContent = currentUserData?.username || 'Пользователь';
                if (currentUserData?.avatar && currentUserData.avatar !== DEFAULT_AVATAR_PATH) {
                    const avatarImg = document.createElement('img');
                    avatarImg.src = currentUserData.avatar.startsWith('/') ? currentUserData.avatar : `/${currentUserData.avatar}`;
                    avatarImg.alt = 'Аватар'; avatarImg.className = 'navbar-avatar';
                    avatarImg.onerror = () => { if(userProfileIconContainer) userProfileIconContainer.innerHTML = '<i class="fas fa-user"></i>'; };
                    userProfileIconContainer.innerHTML = ''; userProfileIconContainer.appendChild(avatarImg);
                } else { if(userProfileIconContainer) userProfileIconContainer.innerHTML = '<i class="fas fa-user"></i>'; }
            } catch (error) { localStorage.removeItem('userId'); currentUserData = null; setDefaultUserIcon(); if (profileDropdownMenu) profileDropdownMenu.classList.remove('active'); }
        } else { currentUserData = null; setDefaultUserIcon(); if (profileDropdownMenu) profileDropdownMenu.classList.remove('active'); }
    }

    if (userProfileLink) {
        userProfileLink.addEventListener('click', (event) => {
            event.preventDefault(); event.stopPropagation();
            const userId = localStorage.getItem('userId');
            if (userId) {
                if (profileDropdownMenu) {
                    profileDropdownMenu.classList.toggle('active');
                    if (profileDropdownMenu.classList.contains('active')) {
                        if (dropdownUsernameDisplay) dropdownUsernameDisplay.textContent = currentUserData?.username || 'Загрузка...';
                        updateUserProfileDisplay();
                    }
                }
            } else { window.location.href = '/auth'; }
        });
    }

    if (dropdownProfileButton) { dropdownProfileButton.addEventListener('click', () => { window.location.href = '/profile'; if (profileDropdownMenu) profileDropdownMenu.classList.remove('active'); }); }
    if (dropdownLogoutButton) { dropdownLogoutButton.addEventListener('click', () => { localStorage.removeItem('userId'); currentUserData = null; window.location.reload(); }); }

    document.addEventListener('click', (event) => {
        if (profileDropdownMenu?.classList.contains('active') && !profileDropdownMenu.contains(event.target) && !(userProfileLink && userProfileLink.contains(event.target))) {
            profileDropdownMenu.classList.remove('active');
        }
        document.querySelectorAll('.search-modal-sidebar .custom-dropdown.open').forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('open');
            }
        });
    });
    function animateVolume(media, targetVolumeRatio, duration) {
        let startVolumeRatio = media.muted ? 0 : media.volume;
        if (targetVolumeRatio > 0 && media.muted) media.muted = false;
        if (Math.abs(startVolumeRatio - targetVolumeRatio) < 0.01) { media.volume = targetVolumeRatio; media.muted = (targetVolumeRatio === 0); updateSoundButtonIcon(); return; }
        let startTime = null;
        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            media.volume = startVolumeRatio + (targetVolumeRatio - startVolumeRatio) * progress;
            if (progress < 1) requestAnimationFrame(animationStep);
            else { media.volume = targetVolumeRatio; media.muted = (targetVolumeRatio === 0); updateSoundButtonIcon(); }
        }
        requestAnimationFrame(animationStep);
    }

    function updateSoundButtonIcon() {
        if (!soundButton || !soundIcon) return;
        soundIcon.className = isHeroSoundActive ? 'fas fa-volume-low' : 'fas fa-volume-mute';
    }

    function updateInfoToggleButtonState() {
        if (!infoToggleButton || !heroSection) return;
        infoToggleButton.classList.toggle('active', isInfoPinned);
        heroSection.classList.toggle('info-pinned', isInfoPinned);
    }

    async function loadAndDisplayHeroContent() {
        if (!heroSection || !heroTitleElement || !heroDescriptionElement || !heroWatchButton || !heroFallbackImg) return;
        try {
            const response = await fetch('/api/tmdb/hero-content');
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            const data = await response.json();
            if (data.error) { switchToHeroFallback(null, true); return; }

            heroTitleElement.textContent = data.title || 'Название не найдено';
            heroDescriptionElement.textContent = data.overview || 'Описание отсутствует.';
            if(heroWatchButton) {
                heroWatchButton.dataset.tmdbId = String(data.id);
                heroWatchButton.dataset.mediaType = data.media_type;
                heroWatchButton.onclick = () => window.location.href = `watch.html?tmdbId=${data.id}&type=${data.media_type}`;
            }
            const backdropUrl = data.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${BACKDROP_SIZE_HERO}${data.backdrop_path}` : '/images/no_image.png';
            if(heroFallbackImg) { heroFallbackImg.src = backdropUrl; heroFallbackImg.alt = `Задник для ${data.title || 'фильма'}`; }
            if(heroSection && data.video_info) heroSection.dataset.videoType = data.video_info.type;


            if(heroContentDisplay) heroContentDisplay.classList.add('visible');

            const hasVideo = data.video_info && (data.video_info.type === 'html5_local' || data.video_info.type === 'youtube');
            if (heroActionButtonsContainer) {
                heroActionButtonsContainer.classList.toggle('visible', hasVideo);
                if(soundButton) soundButton.style.display = hasVideo ? 'flex' : 'none';
                if(infoToggleButton) infoToggleButton.style.display = hasVideo ? 'flex' : 'none';
            }

            isHeroSoundActive = false; isInfoPinned = false;
            if(heroSection) heroSection.classList.remove('info-pinned');
            updateInfoToggleButtonState();
            updateSoundButtonIcon();

            if (hasVideo && data.video_info.type === 'html5_local' && data.video_info.key_or_url) {
                createHtml5Player(data.video_info.key_or_url);
            } else {
                switchToHeroFallback(backdropUrl, true);
            }
        } catch (error) {
            console.error("Ошибка в loadAndDisplayHeroContent:", error);
            switchToHeroFallback(null, true);
        }
    }

    function createHtml5Player(videoSrc) {
        if (!heroVideoContainer) return;
        heroVideoContainer.innerHTML = '';
        currentHeroVideoElement = document.createElement('video');
        Object.assign(currentHeroVideoElement, { src: videoSrc, autoplay: true, muted: true, loop: false, controls: false, playsInline: true });
        Object.assign(currentHeroVideoElement.style, { width: '100%', height: '100%', objectFit: 'cover' });

        const onPlayingHandler = () => {
            if(heroVideoContainer) heroVideoContainer.style.opacity = '1';
            if (heroFallback) heroFallback.classList.remove('active');
            if(heroSection) { heroSection.classList.add('video-playing'); heroSection.classList.remove('poster-active'); }
            isHeroSoundActive = false; updateSoundButtonIcon(); updateInfoToggleButtonState();
            currentHeroVideoElement?.removeEventListener('playing', onPlayingHandler);
        };
        currentHeroVideoElement.addEventListener('playing', onPlayingHandler);

        const onCanPlay = () => {
            if (currentHeroVideoElement?.paused) currentHeroVideoElement.play().catch(e => { console.error("Ошибка воспроизведения видео:", e)});
            isHeroSoundActive = false; updateSoundButtonIcon(); updateInfoToggleButtonState();
            currentHeroVideoElement?.removeEventListener('canplay', onCanPlay);
        };
        currentHeroVideoElement.addEventListener('canplay', onCanPlay);

        currentHeroVideoElement.addEventListener('ended', () => switchToHeroFallback(heroFallbackImg?.src, false));
        currentHeroVideoElement.addEventListener('error', (e) => {
            console.error("Ошибка HTML5 видео элемента:", e, currentHeroVideoElement.error);
            switchToHeroFallback(heroFallbackImg?.src, true);
        });
        heroVideoContainer.appendChild(currentHeroVideoElement);
    }

    function switchToHeroFallback(backdropSrc, forceShowFallback) {
        if (heroVideoContainer) { heroVideoContainer.innerHTML = ''; heroVideoContainer.style.opacity = '0'; }
        currentHeroVideoElement = null;
        if (heroFallbackImg && heroFallback) {
            if (backdropSrc && backdropSrc !== heroFallbackImg.src) heroFallbackImg.src = backdropSrc;
            else if (!backdropSrc) heroFallbackImg.src = 'https://placehold.co/1920x1080/0D0D0D/333333?text=Контент+недоступен';
            heroFallback.classList.add('active');
        }
        if(heroSection) { heroSection.classList.remove('video-playing'); heroSection.classList.add('poster-active'); }
        if (heroActionButtonsContainer) heroActionButtonsContainer.classList.remove('visible');
        if(soundButton) soundButton.style.display = 'none';
        if(infoToggleButton) infoToggleButton.style.display = 'none';
        isHeroSoundActive = false; updateSoundButtonIcon();
        isInfoPinned = false; if(heroSection) heroSection.classList.remove('info-pinned');
        updateInfoToggleButtonState();
    }

    if (soundButton && soundIcon) {
        soundButton.addEventListener('click', () => {
            if (!currentHeroVideoElement) return;
            isHeroSoundActive = !isHeroSoundActive;
            const targetVolume = isHeroSoundActive ? DEFAULT_VOLUME_LEVEL : 0.0;
            if (isHeroSoundActive && currentHeroVideoElement.paused) {
                currentHeroVideoElement.play().then(() => animateVolume(currentHeroVideoElement, targetVolume, VOLUME_ANIMATION_DURATION))
                                       .catch(() => animateVolume(currentHeroVideoElement, targetVolume, VOLUME_ANIMATION_DURATION));
            } else {
                animateVolume(currentHeroVideoElement, targetVolume, VOLUME_ANIMATION_DURATION);
            }
        });
    }

    if (infoToggleButton && heroContentDisplay && heroSection) {
        infoToggleButton.addEventListener('click', () => { isInfoPinned = !isInfoPinned; updateInfoToggleButtonState(); });
        heroSection.addEventListener('mouseenter', () => { if (!isInfoPinned && heroContentDisplay && heroActionButtonsContainer?.classList.contains('visible')) { heroContentDisplay.classList.add('visible'); }});
        heroSection.addEventListener('mouseleave', () => { if (!isInfoPinned && heroContentDisplay) { heroContentDisplay.classList.remove('visible'); }});
    }

    function createMovieTile(movie) {
        const tile = document.createElement('div');
        tile.className = 'movie-tile';
        tile.dataset.tmdbId = String(movie.tmdb_id);
        tile.dataset.mediaType = movie.media_type;
        const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_CARD}${movie.poster_path}` : '/images/default-poster.jpg';
        const ratingElement = document.createElement('span');
        ratingElement.className = 'movie-rating rating-display-badge';
        applyRatingStyles(ratingElement, movie.vote_average);
        tile.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title || movie.name}" class="movie-poster-img" onerror="this.onerror=null;this.src='/images/error.png';">
            <div class="movie-hover-details">
                <h3>${movie.title || movie.name}</h3>
                <p>${movie.overview ? (movie.overview.length > 100 ? movie.overview.substring(0, 97) + '...' : movie.overview) : 'Описание отсутствует.'}</p>
            </div>
        `;
        tile.insertBefore(ratingElement, tile.firstChild);
        tile.addEventListener('click', () => openDetailedInfo(movie.tmdb_id, movie.media_type, tile));
        return tile;
    }

    function renderShelf(shelfElement, moviesData) {
        if (!shelfElement) { console.error("Полка не найдена для рендеринга:", shelfElement); return; }
        const grid = shelfElement.querySelector('.shelf-grid');
        if (!grid) { console.error("Grid не найден внутри полки:", shelfElement); return; }
        grid.innerHTML = '';
        const moviesToDisplay = moviesData;
        moviesToDisplay.forEach(movie => { grid.appendChild(createMovieTile(movie)); });
        requestAnimationFrame(() => { updateShelfControls(shelfElement); });
    }

    async function fetchAndRenderPopularMovies(shelfElement, movieCount = 8, tvShowCount = 7) {
        if (!shelfElement) return;
        try {
            const [movieResponse, tvResponse] = await Promise.all([
                fetch(`/api/tmdb/search?media_type=movie&sort_by=popularity.desc&page=1&rating_from=6.5`),
                fetch(`/api/tmdb/search?media_type=tv&sort_by=popularity.desc&page=1&with_types=4&rating_from=6.5`)
            ]);
            let popularMovies = [], popularTvShows = [];
            if (movieResponse.ok) {
                const movieData = await movieResponse.json();
                if (movieData?.results?.length > 0) {
                    popularMovies = movieData.results
                        .filter(m => m.overview && m.overview.trim() !== '')
                        .filter(m => m.popularity >= 75)
                        .map(m => ({ ...m, tmdb_id: m.id, name: m.title, media_type: 'movie' })).slice(0, movieCount);
                } else console.warn('Не удалось получить популярные фильмы.');
            } else console.error(`Ошибка популярных фильмов: ${movieResponse.status}`);
            if (tvResponse.ok) {
                const tvData = await tvResponse.json();
                if (tvData?.results?.length > 0) {
                    popularTvShows = tvData.results
                        .filter(tv => tv.overview && tv.overview.trim() !== '')
                        .filter(tv => tv.popularity >= 75 && (!tv.genre_ids || !tv.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))))
                        .map(tv => ({ ...tv, tmdb_id: tv.id, title: tv.name, media_type: 'tv' })).slice(0, tvShowCount);
                } else console.warn('Не удалось получить популярные сериалы.');
            } else console.error(`Ошибка популярных сериалов: ${tvResponse.status}`);
            const combinedMedia = [...popularMovies, ...popularTvShows].sort(() => 0.5 - Math.random());
            renderShelf(shelfElement, combinedMedia.length > 0 ? combinedMedia : placeholderMovies.slice(0, movieCount + tvShowCount));
        } catch (error) {
            console.error('Ошибка загрузки "Популярное":', error);
            renderShelf(shelfElement, placeholderMovies.slice(0, movieCount + tvShowCount));
        }
    }

    async function fetchAndRenderTrendingContent(shelfElement, movieCount = 7, tvShowCount = 8) {
        if (!shelfElement) return;
        try {
            const [movieResponse, tvResponse] = await Promise.all([
                fetch(`/api/tmdb/search?media_type=movie&list_type=trending_movie_week&page=1`),
                fetch(`/api/tmdb/search?media_type=tv&list_type=trending_tv_week&page=1`)
            ]);
            let trendingMovies = [], trendingTvShows = [];
            if (movieResponse.ok) {
                const movieData = await movieResponse.json();
                if (movieData?.results?.length > 0) {
                    trendingMovies = movieData.results
                        .filter(m => m.overview && m.overview.trim() !== '')
                        .filter(m => m.vote_average >= 6.5 && m.popularity >= 50)
                        .map(m => ({ ...m, tmdb_id: m.id, name: m.title, media_type: 'movie' })).slice(0, movieCount);
                } else console.warn('Не удалось получить трендовые фильмы.');
            } else console.error(`Ошибка трендовых фильмов: ${movieResponse.status}`);
            if (tvResponse.ok) {
                const tvData = await tvResponse.json();
                if (tvData?.results?.length > 0) {
                    trendingTvShows = tvData.results
                        .filter(tv => tv.overview && tv.overview.trim() !== '')
                        .filter(tv => tv.vote_average >= 6.5 && tv.popularity >= 75 && (!tv.genre_ids || !tv.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))))
                        .map(tv => ({ ...tv, tmdb_id: tv.id, title: tv.name, media_type: 'tv' })).slice(0, tvShowCount);
                } else console.warn('Не удалось получить трендовые сериалы.');
            } else console.error(`Ошибка трендовых сериалов: ${tvResponse.status}`);
            const combinedMedia = [...trendingMovies, ...trendingTvShows].sort(() => 0.5 - Math.random());
            renderShelf(shelfElement, combinedMedia.length > 0 ? combinedMedia : placeholderMovies.slice(0, movieCount + tvShowCount));
        } catch (error) {
            console.error('Ошибка загрузки "Сейчас смотрят":', error);
            renderShelf(shelfElement, placeholderMovies.slice(0, movieCount + tvShowCount));
        }
    }

    async function fetchAndRenderMoviesShelf(shelfElement, count = 15) {
        if (!shelfElement) return;
        try {
            const response = await fetch(`/api/tmdb/search?media_type=movie&sort_by=popularity.desc&page=1&rating_from=6.5`);
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            const data = await response.json();
            if (data?.results?.length > 0) {
                const moviesToDisplay = data.results
                    .filter(m => m.overview && m.overview.trim() !== '')
                    .filter(m => m.popularity >= 75)
                    .map(m => ({ ...m, tmdb_id: m.id, name: m.title, media_type: 'movie' })).slice(0, count);
                renderShelf(shelfElement, moviesToDisplay);
            } else {
                console.warn('Нет фильмов для полки "Фильмы".');
                renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'movie').slice(0, count));
            }
        } catch (error) {
            console.error('Ошибка загрузки полки "Фильмы":', error);
            renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'movie').slice(0, count));
        }
    }

    async function fetchAndRenderTvShowsShelf(shelfElement, count = 15) {
        if (!shelfElement) return;
        try {
            const response = await fetch(`/api/tmdb/search?media_type=tv&sort_by=popularity.desc&page=1&with_types=4&rating_from=6.5`);
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            const data = await response.json();
            if (data?.results?.length > 0) {
                const tvShowsToDisplay = data.results
                    .filter(tv => tv.overview && tv.overview.trim() !== '')
                    .filter(tv => tv.popularity >= 75 && (!tv.genre_ids || !tv.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))))
                    .map(tv => ({ ...tv, tmdb_id: tv.id, title: tv.name, media_type: 'tv' })).slice(0, count);
                renderShelf(shelfElement, tvShowsToDisplay);
            } else {
                console.warn('Нет сериалов для полки "Сериалы".');
                renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv').slice(0, count));
            }
        } catch (error) {
            console.error('Ошибка загрузки полки "Сериалы":', error);
            renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv').slice(0, count));
        }
    }

    async function fetchMediaForGenrePage(mediaType, genreId, page, ratingFrom = "5.0", pagesToTry = 5) {
        let results = [];
        let currentPage = page;
        let attempts = 0;

        while (results.length < 20 && attempts < pagesToTry) { 
            const response = await fetch(`/api/tmdb/search?media_type=${mediaType}&sort_by=popularity.desc&genres=${genreId}&page=${currentPage}&rating_from=${ratingFrom}`);
            if (!response.ok) {
                console.error(`Ошибка загрузки ${mediaType} для жанра ${genreId}, стр. ${currentPage}: ${response.status}`);
                break; 
            }
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                results.push(...data.results);
            }
            if (!data.results || data.results.length < 20 || !data.total_pages || currentPage >= data.total_pages) {
                break;
            }
            currentPage++;
            attempts++;
        }
        return results;
    }

    async function fetchAndRenderGenreShelf(shelfElement, genreId, itemsPerShelf = 15) {
        if (!shelfElement) return;
        const genreName = GENRES_FOR_SHELVES.find(g => g.id === genreId)?.name || `Жанр ${genreId}`;
        console.log(`[GENRE SHELF] Загрузка для "${genreName}" (ID: ${genreId}), цель ${itemsPerShelf} элементов.`);
        try {
            let collectedMovies = [];
            let collectedTvShows = [];
            const pagesToFetchPerTypeInitially = 1; 
            
            const [moviesInitial, tvShowsInitial] = await Promise.all([
                fetchMediaForGenrePage('movie', genreId, pagesToFetchPerTypeInitially, "5.0", 5), 
                fetchMediaForGenrePage('tv', genreId, pagesToFetchPerTypeInitially, "5.0", 5)    
            ]);

            collectedMovies.push(...moviesInitial);
            collectedTvShows.push(...tvShowsInitial);
            
            const uniqueMovies = Array.from(new Map(collectedMovies.map(item => [item.id, item])).values())
                .filter(movie => movie.overview && movie.overview.trim() !== '');
            const uniqueTvShows = Array.from(new Map(collectedTvShows.map(item => [item.id, item])).values())
                .filter(tv => tv.overview && tv.overview.trim() !== '' && (!tv.genre_ids || !tv.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))));

            console.log(`[GENRE SHELF] "${genreName}": Найдено ${uniqueMovies.length} фильмов и ${uniqueTvShows.length} сериалов с описанием после сбора с нескольких страниц.`);

            const mappedMovies = uniqueMovies.map(movie => ({ ...movie, tmdb_id: movie.id, name: movie.title, media_type: 'movie' }));
            const mappedTvShows = uniqueTvShows.map(tv => ({ ...tv, tmdb_id: tv.id, title: tv.name, media_type: 'tv' }));

            let combinedMedia = [...mappedMovies, ...mappedTvShows];
            
            combinedMedia.sort((a, b) => b.popularity - a.popularity);

            if (combinedMedia.length > itemsPerShelf * 1.5) {
                const topItems = combinedMedia.slice(0, itemsPerShelf);
                let remainingItems = combinedMedia.slice(itemsPerShelf);
                for (let i = remainingItems.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [remainingItems[i], remainingItems[j]] = [remainingItems[j], remainingItems[i]];
                }
                combinedMedia = [...topItems, ...remainingItems];
            }

            const finalMedia = combinedMedia.slice(0, itemsPerShelf);
            console.log(`[GENRE SHELF] "${genreName}": Отображаем ${finalMedia.length} элементов.`);

            if (finalMedia.length > 0) {
                renderShelf(shelfElement, finalMedia);
            } else {
                console.warn(`[GENRE SHELF] Нет контента для полки жанра "${genreName}" после всех фильтров.`);
                renderShelf(shelfElement, []); 
            }
        } catch (error) {
            console.error(`[GENRE SHELF] Ошибка загрузки полки для жанра "${genreName}":`, error);
            renderShelf(shelfElement, []);
        }
    }

    function initializeGenreArea() {
        console.log("[DEBUG] initializeGenreArea CALLED");

        if (!genreShelvesArea || !genreShelvesMainContainer || !genreAreaToggleButton) {
            console.error("[DEBUG] ERROR: Key genre elements NOT FOUND!", {
                genreShelvesAreaExists: !!genreShelvesArea,
                genreShelvesMainContainerExists: !!genreShelvesMainContainer,
                genreAreaToggleButtonExists: !!genreAreaToggleButton
            });
            return;
        }
        console.log("[DEBUG] All key genre elements FOUND.");

        genreShelvesMainContainer.classList.remove('genres-expanded');
        console.log(`[DEBUG] genreShelvesMainContainer initial classes: "${genreShelvesMainContainer.className}"`);

        const buttonText = genreAreaToggleButton.querySelector('span');
        const arrowIcon = genreAreaToggleButton.querySelector('i');

        if (buttonText) buttonText.textContent = "Показать все жанры";
        if (arrowIcon) {
            arrowIcon.classList.remove('fa-chevron-up');
            arrowIcon.classList.add('fa-chevron-down');
        }
        console.log("[DEBUG] Toggle button text and icon reset to 'Показать'.");

        genreShelvesArea.innerHTML = '';

        GENRES_FOR_SHELVES.forEach((genre, index) => {
            const shelfId = `genre-shelf-${genre.id}`;
            const shelfElement = createShelfElement(shelfId, genre.name);
            
            shelfElement.classList.add('collapsible-genre-shelf');

            if (index === 0) {
                shelfElement.classList.remove('is-collapsed');
                console.log(`[DEBUG] Shelf "${genre.name}" (index ${index}): Is initially visible. Classes: "${shelfElement.className}"`);
            } else {
                shelfElement.classList.add('is-collapsed');
                console.log(`[DEBUG] Shelf "${genre.name}" (index ${index}): ADDED 'is-collapsed'. Classes: "${shelfElement.className}"`);
            }
            genreShelvesArea.appendChild(shelfElement);
            fetchAndRenderGenreShelf(shelfElement, genre.id, 15);
        });

        genreAreaToggleButton.removeEventListener('click', toggleGenreAreaExpansion);
        genreAreaToggleButton.addEventListener('click', toggleGenreAreaExpansion);
        console.log("[DEBUG] Event listener for toggle button (re-)added.");
    }

    function toggleGenreAreaExpansion() {
        console.log("[DEBUG] toggleGenreAreaExpansion CALLED");
        if (!genreShelvesMainContainer || !genreAreaToggleButton || !genreShelvesArea) {
            console.error("[DEBUG] ERROR in toggle: One of the key elements is NULL.", {
                genreShelvesMainContainer, genreAreaToggleButton, genreShelvesArea
            });
            return;
        }

        genreShelvesMainContainer.classList.toggle('genres-expanded');
        const isNowExpandedState = genreShelvesMainContainer.classList.contains('genres-expanded');

        console.log(`[DEBUG] Main container 'genres-expanded' class is now: ${isNowExpandedState}`);
        console.log(`[DEBUG] genreShelvesMainContainer classes: "${genreShelvesMainContainer.className}"`);

        const allGenreShelves = genreShelvesArea.querySelectorAll('.collapsible-genre-shelf');

        allGenreShelves.forEach((shelf, index) => {
            if (index === 0) return; 

            if (isNowExpandedState) {
                shelf.classList.remove('is-collapsed');
            } else {
                shelf.classList.add('is-collapsed');
            }
        });

        const buttonText = genreAreaToggleButton.querySelector('span');
        const arrowIcon = genreAreaToggleButton.querySelector('i');
        if (buttonText) {
            buttonText.textContent = isNowExpandedState ? "Скрыть все жанры" : "Показать все жанры";
        }
        if (arrowIcon) {
            arrowIcon.classList.toggle('fa-chevron-down', !isNowExpandedState);
            arrowIcon.classList.toggle('fa-chevron-up', isNowExpandedState);
        }
        console.log(`[DEBUG] Toggle button text and icon updated. Now ${isNowExpandedState ? 'EXPANDED' : 'COLLAPSED'}.`);
    }

    function applyRatingStyles(targetElement, ratingValue) {
        if (!targetElement) return;
        const rating = parseFloat(ratingValue);
        targetElement.classList.remove('rating-red', 'rating-gray', 'rating-green', 'rating-none');
        targetElement.style.backgroundColor = '';
        if (isNaN(rating) || rating === 0) {
            targetElement.textContent = '–';
            targetElement.classList.add('rating-none');
        } else {
            targetElement.textContent = `★ ${rating.toFixed(1)}`;
            if (rating < 5) targetElement.classList.add('rating-red');
            else if (rating < 7) targetElement.classList.add('rating-gray');
            else targetElement.classList.add('rating-green');
        }
    }

    function renderSeasonsDisplay(seasonsDetails, parentContainer, tvId, mediaType) {
        parentContainer.innerHTML = '';
        if (!seasonsDetails || seasonsDetails.length === 0) {
            parentContainer.innerHTML = '<p>Информация о сезонах не найдена.</p>'; return;
        }
        const seasonsGrid = document.createElement('div');
        seasonsGrid.className = 'seasons-grid';
        seasonsDetails.forEach((season, index) => {
            if (season.season_number === 0 && !season.poster_path) return;
            if (!season || typeof season.season_number === 'undefined') return;
            const seasonCard = document.createElement('div');
            seasonCard.className = 'season-card';
            const posterPath = season.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_SEASON_CARD}${season.poster_path}` : '/images/default-poster.jpg';
            const episodeCount = season.episode_count || (season.episodes ? season.episodes.length : 0);
            seasonCard.innerHTML = `
                <img src="${posterPath}" alt="${season.name || `Сезон ${season.season_number}`}" class="season-poster-img" onerror="this.onerror=null;this.src='/images/error.png';">
                <div class="season-info">
                    <h4 class="season-title">${season.name || `Сезон ${season.season_number}`}</h4>
                    <p class="season-episode-count">${episodeCount} серий</p>
                </div>`;
            seasonsGrid.appendChild(seasonCard);
            requestAnimationFrame(() => setTimeout(() => seasonCard.classList.add('visible'), index * 100));
        });
        parentContainer.appendChild(seasonsGrid);
    }

    const populatePanelData = (itemData, itemMediaType) => {
        if (!detailedInfoPanel) return;
        currentDetailedItemData = { ...itemData, media_type: itemMediaType, userListCategory: null }; // Сбрасываем userListCategory при загрузке новых данных
        
        if (detailedInfoTitle) detailedInfoTitle.textContent = itemData.title || itemData.name;
        if (detailedInfoRatingDisplay) applyRatingStyles(detailedInfoRatingDisplay, itemData.vote_average);
        const itemReleaseDate = itemData.release_date || itemData.first_air_date;
        if (detailedInfoYear) detailedInfoYear.textContent = itemReleaseDate ? new Date(itemReleaseDate).getFullYear() : 'N/A';
        if (detailedInfoEpisodes) {
            if (itemMediaType === 'tv' && itemData.number_of_episodes) {
                detailedInfoEpisodes.textContent = `${itemData.number_of_episodes} эп.`; detailedInfoEpisodes.style.display = 'inline-flex';
            } else { detailedInfoEpisodes.textContent = ''; detailedInfoEpisodes.style.display = 'none'; }
        }
        if (detailedInfoSeasons) {
            if (itemMediaType === 'tv' && itemData.number_of_seasons) {
                detailedInfoSeasons.textContent = `${itemData.number_of_seasons} с.`; detailedInfoSeasons.style.display = 'inline-flex';
            } else { detailedInfoSeasons.textContent = ''; detailedInfoSeasons.style.display = 'none'; }
        }
        let itemAgeRatingText = '';
        if (itemData.content_ratings?.results) {
            const ruRating = itemData.content_ratings.results.find(r => r.iso_3166_1 === 'RU');
            if (ruRating?.rating) itemAgeRatingText = ruRating.rating;
        } else if (itemData.release_dates?.results && !itemAgeRatingText) {
             const ruRelease = itemData.release_dates.results.find(r => r.iso_3166_1 === 'RU');
             if (ruRelease?.release_dates?.length > 0) {
                 const cert = ruRelease.release_dates.find(rd => rd.certification && rd.certification !== "");
                 if (cert) itemAgeRatingText = cert.certification;
             }
        }
        if (detailedInfoAgeRating) {
            if (itemAgeRatingText) { detailedInfoAgeRating.textContent = itemAgeRatingText; detailedInfoAgeRating.style.display = 'inline-flex'; }
            else { detailedInfoAgeRating.textContent = ''; detailedInfoAgeRating.style.display = 'none'; }
        }
        if (detailedInfoGenresText) detailedInfoGenresText.textContent = itemData.genres?.length > 0 ? itemData.genres.map(g => g.name).join(', ') : 'Жанры не указаны';
        if (detailedInfoOverview) detailedInfoOverview.textContent = itemData.overview || 'Описание отсутствует.';
        if(detailedInfoWatchBtn) {
            detailedInfoWatchBtn.dataset.tmdbId = String(itemData.id); detailedInfoWatchBtn.dataset.mediaType = itemMediaType;
            detailedInfoWatchBtn.onclick = () => window.location.href = `watch.html?tmdbId=${itemData.id}&type=${itemMediaType}`;
        }
        if (detailedInfoBackdropImage) {
            detailedInfoBackdropImage.src = itemData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${BACKDROP_SIZE_DETAILS_LARGE}${itemData.backdrop_path}` : 'https://placehold.co/1280x720/0c0c0c/111111?text=Нет+изображения';
            detailedInfoBackdropImage.alt = `Задник для ${itemData.title || itemData.name}`;
        }
        detailedInfoPanel.dataset.currentTmdbId = String(itemData.id);
        detailedInfoPanel.dataset.currentMediaType = itemMediaType;

        const aboutTabPane = detailedInfoPanel.querySelector('#tab-about-details');
        const episodesTabPane = detailedInfoPanel.querySelector('#tab-episodes-details');
        const episodesTabButton = detailedInfoTabsContainer?.querySelector('.tab-button[data-tab-target="#tab-episodes-details"]');
        detailedInfoTabsContainer?.querySelector('.tab-button.active')?.classList.remove('active');
        detailedInfoTabsContainer?.querySelector('.tab-button[data-tab-target="#tab-about-details"]')?.classList.add('active');
        if (currentActiveTabPane && currentActiveTabPane !== aboutTabPane) currentActiveTabPane.classList.remove('active');
        if (aboutTabPane) aboutTabPane.classList.add('active');
        currentActiveTabPane = aboutTabPane;
        if (episodesTabButton && episodesTabPane) {
            if (itemMediaType === 'tv') {
                episodesTabButton.style.display = 'inline-flex';
                if (itemData.all_season_details?.length > 0) renderSeasonsDisplay(itemData.all_season_details, episodesTabPane, itemData.id, itemMediaType);
                else if (itemData.seasons?.length > 0) renderSeasonsDisplay(itemData.seasons.map(s => ({ ...s, episode_count: s.episode_count || 0, poster_path: s.poster_path || null })), episodesTabPane, itemData.id, itemMediaType);
                else episodesTabPane.innerHTML = '<p>Для данного сериала нет информации о сезонах.</p>';
            } else {
                episodesTabButton.style.display = 'none'; episodesTabPane.innerHTML = '<p>Сезоны и серии доступны только для сериалов.</p>';
            }
        } else if (episodesTabButton) episodesTabButton.style.display = 'none';
    };

    async function getItemListStatus(userId, tmdbId, mediaType) {
        if (!userId || !tmdbId || !mediaType) return null;
        try {
            const response = await fetch(`/api/user/${userId}/lists?tmdb_id=${tmdbId}&media_type=${mediaType}`);
            if (response.ok) {
                const data = await response.json();
                return data; // Ожидаем объект элемента списка или null
            }
            console.warn(`Не удалось получить статус элемента списка: ${response.status}`);
            return null;
        } catch (error) {
            console.error('Ошибка при запросе статуса элемента списка:', error);
            return null;
        }
    }
    
    function updateListCategoryDropdownCheckmarks() {
        if (!listCategoryDropdown || !currentDetailedItemData) return;
    
        listCategoryDropdown.querySelectorAll('button').forEach(button => {
            const checkmark = button.querySelector('.list-category-checkmark');
            if (checkmark) {
                checkmark.remove();
            }
            if (currentDetailedItemData.userListCategory && button.dataset.category === currentDetailedItemData.userListCategory) {
                const newCheckmark = document.createElement('i');
                newCheckmark.className = 'fas fa-check list-category-checkmark';
                button.prepend(newCheckmark);
            } else {
                 // Добавляем "пустышку" для выравнивания, если галочки нет
                const placeholder = document.createElement('span');
                placeholder.className = 'list-category-checkmark'; // Используем тот же класс для одинаковых отступов
                placeholder.innerHTML = '&nbsp;'; // Неразрывный пробел, чтобы занимал место
                button.prepend(placeholder);
            }
        });
    }

    async function openDetailedInfo(tmdbId, mediaType, clickedTileElement) {
        if (!detailedInfoPanel || !clickedTileElement) { console.error('Панель деталей или элемент не найдены'); return; }
        const newParentShelf = clickedTileElement.closest('.movie-shelf');
        if (!newParentShelf) { console.error('Родительская полка не найдена.'); return; }
        const isAlreadyOpen = detailedInfoPanel.classList.contains('expanded');
        const isSameTile = currentActiveMovieTile === clickedTileElement;
        
        // Сначала закрываем дропдаун, если он был открыт
        if (listCategoryDropdown) listCategoryDropdown.classList.remove('active');

        if (isAlreadyOpen && isSameTile) { await closeDetailedInfo(); return; }
        
        try {
            const response = await fetch(`/api/tmdb/details/${mediaType}/${tmdbId}?language=ru-RU`);
            if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.status_message || `Ошибка HTTP: ${response.status}`); }
            const data = await response.json(); if (!data) throw new Error('Данные не получены.');
            
            populatePanelData(data, mediaType); // Заполняем основными данными

            // Получаем статус элемента в списке пользователя
            const userId = localStorage.getItem('userId');
            if (userId && currentDetailedItemData) {
                const listItemData = await getItemListStatus(userId, currentDetailedItemData.id, currentDetailedItemData.media_type);
                if (listItemData && listItemData.category) {
                    currentDetailedItemData.userListCategory = listItemData.category;
                } else {
                    currentDetailedItemData.userListCategory = null; // Явно указываем, что нет в списках
                }
            }
            updateListCategoryDropdownCheckmarks(); // Обновляем галочки ДО показа панели


            if (isAlreadyOpen) { // Если панель уже была открыта для другого элемента
                if (currentActiveMovieTile) currentActiveMovieTile.classList.remove('active-tile-details');
                clickedTileElement.classList.add('active-tile-details'); currentActiveMovieTile = clickedTileElement;
                const needsMove = currentlyOpenShelfForDetails !== newParentShelf;
                if (needsMove) {
                    detailedInfoPanel.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out'; 
                    detailedInfoPanel.style.opacity = '0';
                    detailedInfoPanel.style.transform = 'translateY(20px)'; 
                    await new Promise(r => setTimeout(r, 150));
                    newParentShelf.after(detailedInfoPanel); 
                    currentlyOpenShelfForDetails = newParentShelf;
                    requestAnimationFrame(() => {
                        detailedInfoPanel.style.opacity = '1';
                        detailedInfoPanel.style.transform = 'translateY(0)';
                    });
                } else { // Просто обновляем контент без перемещения
                    if (detailedInfoContentWrapper) {
                        detailedInfoContentWrapper.style.transition = 'opacity 0.2s ease-out'; 
                        detailedInfoContentWrapper.style.opacity = '0';
                        await new Promise(r => setTimeout(r, 200));
                        // populatePanelData уже вызван выше
                        detailedInfoContentWrapper.style.opacity = '1';
                    }
                }
            } else { // Панель была закрыта, открываем впервые
                newParentShelf.after(detailedInfoPanel);
                if (currentActiveMovieTile) currentActiveMovieTile.classList.remove('active-tile-details');
                clickedTileElement.classList.add('active-tile-details'); currentActiveMovieTile = clickedTileElement;
                
                detailedInfoPanel.style.display = 'block'; 
                requestAnimationFrame(() => { 
                    requestAnimationFrame(() => { 
                        detailedInfoPanel.classList.add('expanded'); 
                        currentlyOpenShelfForDetails = newParentShelf;
                    });
                });
            }
            const scrollOffset = (navbar?.offsetHeight || 0) + 10;
            window.scrollTo({ top: detailedInfoPanel.getBoundingClientRect().top + window.pageYOffset - scrollOffset, behavior: 'smooth' });

        } catch (error) { console.error('Ошибка при открытии/обновлении деталей:', error); }
    }

    function closeDetailedInfo() {
        return new Promise((resolve) => {
            if (!detailedInfoPanel || !detailedInfoPanel.classList.contains('expanded')) { resolve(); return; }
            if (currentActiveMovieTile) { currentActiveMovieTile.classList.remove('active-tile-details'); currentActiveMovieTile = null; }
            
            detailedInfoPanel.classList.remove('expanded'); // Запускаем анимацию скрытия
            if(listCategoryDropdown) listCategoryDropdown.classList.remove('active'); 

            const onEnd = (e) => {
                if (e.target === detailedInfoPanel && e.propertyName === 'opacity') { // Ждем завершения анимации opacity
                    if (!detailedInfoPanel.classList.contains('expanded')) { // Убедимся, что панель все еще должна быть скрыта
                        detailedInfoPanel.style.display = 'none';
                        currentlyOpenShelfForDetails = null; 
                        delete detailedInfoPanel.dataset.currentTmdbId;
                        delete detailedInfoPanel.dataset.currentMediaType;
                        currentDetailedItemData = null; 
                        detailedInfoPanel.removeEventListener('transitionend', onEnd); 
                        resolve();
                    }
                }
            };
            detailedInfoPanel.addEventListener('transitionend', onEnd);
            
            setTimeout(() => {
                if (!detailedInfoPanel.classList.contains('expanded') && detailedInfoPanel.style.display !== 'none') {
                     detailedInfoPanel.style.display = 'none';
                     detailedInfoPanel.removeEventListener('transitionend', onEnd);
                }
                resolve();
            }, parseFloat(getComputedStyle(detailedInfoPanel).transitionDuration.split(',')[0] || '0.4') * 1000 + 50); // Длительность + небольшой запас
        });
    }

    detailedInfoCloseBtn?.addEventListener('click', closeDetailedInfo);
    detailedInfoTabsContainer?.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.tab-button');
        if (!targetButton || targetButton.classList.contains('active')) return;
        detailedInfoTabsContainer.querySelector('.tab-button.active')?.classList.remove('active');
        targetButton.classList.add('active');
        const targetPaneId = targetButton.dataset.tabTarget;
        const targetPane = detailedInfoPanel.querySelector(targetPaneId);
        if (currentActiveTabPane && currentActiveTabPane !== targetPane) currentActiveTabPane.classList.remove('active');
        if (targetPane) {
            targetPane.classList.add('active'); currentActiveTabPane = targetPane;
            if (targetPane.id === 'tab-episodes-details') {
                targetPane.querySelectorAll('.season-card:not(.visible)').forEach((card, index) => {
                    requestAnimationFrame(() => setTimeout(() => card.classList.add('visible'), index * 75));
                });
            }
        }
    });

    if (addToListBtn && listCategoryDropdown) {
        addToListBtn.addEventListener('click', async (event) => { // Делаем async для await внутри
            event.stopPropagation(); 
            const userId = localStorage.getItem('userId');
            if (!userId) {
                showToastNotification('Для добавления в список необходимо авторизоваться.', true);
                return;
            }
            if (!currentDetailedItemData) {
                showToastNotification('Данные о фильме/сериале не загружены.', true);
                return;
            }

            // Перед открытием дропдауна, обновляем информацию о текущей категории
            const listItemData = await getItemListStatus(userId, currentDetailedItemData.id, currentDetailedItemData.media_type);
            currentDetailedItemData.userListCategory = listItemData ? listItemData.category : null;
            updateListCategoryDropdownCheckmarks();

            listCategoryDropdown.classList.toggle('active');
        });

        listCategoryDropdown.querySelectorAll('button').forEach(categoryButton => {
            categoryButton.addEventListener('click', async () => {
                const selectedCategory = categoryButton.dataset.category;
                const userId = localStorage.getItem('userId');

                if (!userId || !currentDetailedItemData) {
                    showToastNotification('Ошибка: Пользователь не авторизован или данные фильма не найдены.', true);
                    listCategoryDropdown.classList.remove('active');
                    return;
                }

                const { id: tmdb_id, media_type, title, name, poster_path } = currentDetailedItemData;
                const itemTitle = title || name; 

                const dataToSend = {
                    tmdb_id: parseInt(tmdb_id, 10),
                    media_type: media_type,
                    category: selectedCategory,
                    title: itemTitle,
                    poster_path: poster_path,
                    rating: null // Пользовательский рейтинг по умолчанию null при добавлении/изменении категории
                };

                console.log('Отправка данных на сервер:', dataToSend);

                try {
                    const response = await fetch(`/api/user/${userId}/lists`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSend)
                    });
                    const result = await response.json();
                    if (response.ok) {
                        // Используем сообщение от сервера, если оно есть, или формируем свое без кавычек
                        const message = result.message || `${itemTitle} успешно добавлен(а) в категорию ${selectedCategory}!`;
                        showToastNotification(message, false); // 'false' означает, что это не ошибка (для стилей success)
                        currentDetailedItemData.userListCategory = selectedCategory; 
                        updateListCategoryDropdownCheckmarks(); 
                    } else {
                        showToastNotification(`Ошибка: ${result.error || 'Не удалось обновить список.'} (Статус: ${response.status})`, true);
                    }
                } catch (error) {
                    console.error('Сетевая ошибка или ошибка сервера:', error);
                    showToastNotification('Сетевая ошибка при обновлении списка.', true);
                } finally {
                    listCategoryDropdown.classList.remove('active');
                }
            });
        });
    }

    function updateShelfControls(shelfElement) {
        const gridWrapper = shelfElement.querySelector('.shelf-grid-wrapper');
        const grid = shelfElement.querySelector('.shelf-grid');
        const prevArrow = shelfElement.querySelector('.prev-arrow');
        const nextArrow = shelfElement.querySelector('.next-arrow');
        if (!gridWrapper || !grid || !prevArrow || !nextArrow) {
            if(prevArrow) prevArrow.classList.remove('visible'); if(nextArrow) nextArrow.classList.remove('visible');
            if(gridWrapper) gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll'); return;
        }
        requestAnimationFrame(() => {
            const scrollLeft = Math.round(grid.scrollLeft), scrollWidth = grid.scrollWidth, clientWidth = grid.clientWidth;
            if (grid.children.length === 0) { prevArrow.classList.remove('visible'); nextArrow.classList.remove('visible'); gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll'); return; }
            const canScrollLeft = scrollLeft > 1, canScrollRight = (scrollWidth - clientWidth - scrollLeft) > 1;
            prevArrow.classList.toggle('visible', canScrollLeft); nextArrow.classList.toggle('visible', canScrollRight);
            gridWrapper.classList.toggle('has-prev-scroll', canScrollLeft); gridWrapper.classList.toggle('has-next-scroll', canScrollRight);
        });
    }

    function initShelves() {
        document.querySelectorAll('.movie-shelf').forEach(shelfElement => {
            const grid = shelfElement.querySelector('.shelf-grid'), prevArrow = shelfElement.querySelector('.prev-arrow'), nextArrow = shelfElement.querySelector('.next-arrow');
            if (!grid || !prevArrow || !nextArrow) { console.warn('Пропуск инициализации полки, не все элементы:', shelfElement); return; }
            const getScrollAmount = () => (grid.querySelector('.movie-tile')?.offsetWidth || grid.clientWidth * 0.8) + (parseFloat(getComputedStyle(grid).gap) || 15);
            prevArrow.addEventListener('click', () => grid.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }));
            nextArrow.addEventListener('click', () => grid.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }));
            const observer = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? setTimeout(() => updateShelfControls(shelfElement), 200) : (prevArrow.classList.remove('visible'), nextArrow.classList.remove('visible'), shelfElement.querySelector('.shelf-grid-wrapper')?.classList.remove('has-prev-scroll', 'has-next-scroll'))), { threshold: 0.01 });
            observer.observe(shelfElement);
            grid.addEventListener('scroll', () => updateShelfControls(shelfElement), { passive: true });
            window.addEventListener('resize', () => updateShelfControls(shelfElement), { passive: true });
            updateShelfControls(shelfElement);
        });
    }

    if (newSearchButton && newSearchModal) {
        const openSearch = () => { newSearchModal.classList.add('active'); document.body.style.overflow = 'hidden'; if (allMovieGenresMap.size === 0) loadAndPopulateAllGenres(); };
        const closeSearch = () => { newSearchModal.classList.remove('active'); document.body.style.overflow = ''; };
        newSearchButton.addEventListener('click', (e) => { e.preventDefault(); openSearch(); });
        newSearchModal.addEventListener('click', (e) => { if (e.target === newSearchModal) closeSearch(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && newSearchModal.classList.contains('active')) closeSearch(); });
    }

    async function fetchGenresFromServer(type) {
        try {
            const response = await fetch(`/api/tmdb/genres/${type}?language=ru-RU`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return (await response.json()) || [];
        } catch (error) { console.error(`Ошибка жанров ${type}:`, error); return []; }
    }

    async function populateGenreDropdown(menu, genresData, type, map) {
        if (!menu) return;
        menu.querySelector('.genres-loading-placeholder')?.remove(); menu.innerHTML = ''; map.clear();
        const genres = Array.isArray(genresData) ? genresData : (genresData.genres || []);
        if (!Array.isArray(genres)) { console.warn(`Жанры ${type} не массив:`, genres); return; }
        genres.forEach(g => {
            if (typeof g.id !== 'number' || typeof g.name !== 'string') return;
            map.set(g.id, g.name);
            const label = document.createElement('label');
            const cb = Object.assign(document.createElement('input'), { type: 'checkbox', name: 'genre_filter', value: String(g.id) });
            cb.dataset.genreName = g.name;
            cb.addEventListener('change', () => { updateToggleTextForGenres(menu.closest('.custom-dropdown')); triggerSearch(); });
            label.append(cb, ` ${g.name}`); menu.appendChild(label);
        });
    }

    async function loadAndPopulateAllGenres() {
        const [movieGenres, tvGenres] = await Promise.all([fetchGenresFromServer('movie'), fetchGenresFromServer('tv')]);
        populateGenreDropdown(genreDropdownMovieMenuElement, movieGenres, 'movie', allMovieGenresMap);
        allTvGenresMap.clear(); (Array.isArray(tvGenres) ? tvGenres : (tvGenres.genres || [])).forEach(g => { if (typeof g.id === 'number' && typeof g.name === 'string') allTvGenresMap.set(g.id, g.name); });
        updateToggleTextForGenres(genreDropdownMovieElement);
    }

    function getSelectedGenreIds() { return Array.from(genreDropdownMovieMenuElement?.querySelectorAll('input:checked') || []).map(cb => cb.value); }

    function triggerSearch() {
        const query = searchInput?.value.trim() || "";
        const sGenres = getSelectedGenreIds(), yF = yearFromInput?.value.trim(), yT = yearToInput?.value.trim(), rF = ratingFromInput?.value.trim(), rT = ratingToInput?.value.trim();
        const activeMediaCb = document.querySelector('input[name="type_filter"]:checked'), activeMedia = activeMediaCb ? activeMediaCb.value : null;
        if (query || sGenres.length || yF || yT || rF || rT || activeMedia) {
            clearTimeout(searchTimeout);
            if (loadingIndicator) loadingIndicator.style.display = 'flex';
            if (initialPlaceholder) initialPlaceholder.style.display = 'none';
            clearSearchResults(false);
            searchTimeout = setTimeout(() => performSearch(query, activeMedia, sGenres, yF, yT, rF, rT), 350);
        } else {
            clearSearchResults(true); if (initialPlaceholder) initialPlaceholder.style.display = 'flex'; if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    async function performSearch(query, mediaType, selGenreIds, yF, yT, rF, rT) {
        if (loadingIndicator) loadingIndicator.style.display = 'flex'; if (initialPlaceholder) initialPlaceholder.style.display = 'none';
        const params = new URLSearchParams({ language: 'ru-RU', page: 1 });
        if (query) params.append('query', query);
        let reqMT = mediaType; if (!query && !mediaType && (selGenreIds.length || yF || yT || rF || rT)) reqMT = 'movie'; else if (query && !mediaType) reqMT = 'multi';
        if (reqMT) params.append('media_type', reqMT);
        if (selGenreIds?.length) params.append('genres', selGenreIds.join(','));
        if (yF) params.append('year_from', yF); if (yT) params.append('year_to', yT);
        if (rF) params.append('rating_from', rF); if (rT) params.append('rating_to', rT);
        try {
            const response = await fetch(`/api/tmdb/search?${params.toString()}`);
            if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || `HTTP ${response.status}`); }
            displayResults((await response.json()).results || [], params.get('media_type') || (query ? 'multi' : 'movie'));
        } catch (error) { console.error('Ошибка поиска:', error); displayError(error.message); }
        finally { if (loadingIndicator) loadingIndicator.style.display = 'none'; }
    }

    if (searchInput) { searchInput.addEventListener('input', triggerSearch); }
    [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(i => { i?.addEventListener('input', triggerSearch); i?.addEventListener('change', triggerSearch); });
    typeFilterCheckboxes?.forEach(cb => cb.addEventListener('change', () => {
        if (cb.checked) typeFilterCheckboxes.forEach(other => { if (other !== cb) other.checked = false; });
        updateToggleTextForDropdown(typeDropdownElement, "Выберите тип"); triggerSearch();
    }));
    if(resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            if(searchInput) searchInput.value = ''; typeFilterCheckboxes?.forEach(cb => cb.checked = false);
            if(typeDropdownElement) updateToggleTextForDropdown(typeDropdownElement, "Выберите тип");
            genreDropdownMovieMenuElement?.querySelectorAll('input').forEach(cb => cb.checked = false);
            if(genreDropdownMovieElement) updateToggleTextForGenres(genreDropdownMovieElement);
            [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(i => { if(i) i.value = ''; });
            clearSearchResults(true); if (initialPlaceholder) initialPlaceholder.style.display = 'flex'; if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
    }

    function displayResults(items, searchCtx) {
        clearSearchResults(false); if(!searchResultsContainer) return;
        const grid = document.createElement('div'); grid.className = 'search-results-grid';
        if (!items || items.length === 0) {
            const hasFilters = searchInput?.value.trim() || getSelectedGenreIds().length || yearFromInput?.value.trim() || yearToInput?.value.trim() || ratingFromInput?.value.trim() || ratingToInput?.value.trim() || document.querySelector('input[name="type_filter"]:checked');
            if (hasFilters) grid.innerHTML = '<p class="no-results">По вашему запросу ничего не найдено.</p>';
            else if (initialPlaceholder) initialPlaceholder.style.display = 'flex';
        } else {
            items.forEach((item, idx) => {
                let mt = item.media_type || (searchCtx !== 'multi' ? searchCtx : (item.title ? 'movie' : 'tv'));
                if (mt === 'person') return;
                const title = item.title || item.name, year = item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : 'N/A';
                const poster = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_SEARCH}${item.poster_path}` : '/images/default-poster.jpg';
                let overview = item.overview || 'Описание отсутствует.'; if (overview.length > 100) overview = overview.substring(0, 97) + '...';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                const gMap = mt === 'tv' ? allTvGenresMap : allMovieGenresMap;
                let gNames = item.genre_ids?.map(id => gMap.get(parseInt(id,10))).filter(Boolean).join(', ') || 'Жанры не указаны';
                if (gNames === 'Жанры не указаны' && item.genre_ids?.length && gMap.size === 0) gNames = 'Загрузка жанров...';
                const el = document.createElement('div'); el.className = 'search-result-item';
                el.dataset.year = String(year); el.dataset.rating = String(rating); el.dataset.mediaType = mt; el.dataset.genreIds = item.genre_ids?.join(',') || '';
                el.innerHTML = `
                    <img src="${poster}" alt="${title}" class="search-result-poster" onerror="this.onerror=null;this.src='/images/error.png';">
                    <div class="search-result-details">
                        <div class="search-result-main-info">
                            <h3 class="search-result-title">${title}</h3>
                            <p class="search-result-meta">
                                <span class="search-result-year">${year}</span>
                                <span class="search-result-type">${mt === 'movie' ? 'Фильм' : (mt === 'tv' ? 'Сериал' : '')}</span>
                                <span class="search-result-rating"><i class="fas fa-star"></i> ${rating}</span>
                            </p><p class="search-result-genres">${gNames}</p></div>
                        <p class="search-result-overview">${overview}</p>
                        <a href="watch.html?tmdbId=${item.id}&type=${mt}" class="action-button search-result-watch-btn"><i class="fas fa-play"></i> Смотреть</a></div>`;
                grid.appendChild(el); requestAnimationFrame(() => setTimeout(() => el.classList.add('visible'), idx * 50));
            });
        }
        searchResultsContainer.querySelector('.search-results-grid')?.remove(); searchResultsContainer.appendChild(grid);
        applyClientSideFilters();
    }

    function displayError(msg) {
        clearSearchResults(false); if(!searchResultsContainer) return;
        const errEl = document.createElement('p'); errEl.className = 'search-error-message'; errEl.textContent = `Ошибка: ${msg}`;
        searchResultsContainer.querySelector('.search-results-grid')?.remove(); searchResultsContainer.appendChild(errEl);
        if(loadingIndicator) loadingIndicator.style.display = 'none'; if(initialPlaceholder) initialPlaceholder.style.display = 'none';
    }

    function clearSearchResults(showPlaceholder = true) {
        if (!searchResultsContainer) return;
        searchResultsContainer.querySelector('.search-results-grid')?.remove();
        searchResultsContainer.querySelector('.search-error-message')?.remove();
        searchResultsContainer.querySelector('.no-results-client-message')?.remove();
        if (initialPlaceholder) initialPlaceholder.style.display = showPlaceholder ? 'flex' : 'none';
    }

    function applyClientSideFilters() {
        if (!searchResultsContainer) return;
        const selGIds = getSelectedGenreIds(), yF = yearFromInput?.value ? parseInt(yearFromInput.value) : null, yT = yearToInput?.value ? parseInt(yearToInput.value) : null;
        const rF = ratingFromInput?.value ? parseFloat(ratingFromInput.value) : null, rT = ratingToInput?.value ? parseFloat(ratingToInput.value) : null;
        const selMT = document.querySelector('input[name="type_filter"]:checked')?.value;
        const items = searchResultsContainer.querySelectorAll('.search-result-item'); let visibleCount = 0;
        searchResultsContainer.querySelector('.no-results-client-message')?.remove();
        if (items.length === 0) return;
        items.forEach(item => {
            let matches = true;
            const iY = item.dataset.year && !isNaN(parseInt(item.dataset.year)) ? parseInt(item.dataset.year) : null;
            const iR = item.dataset.rating && !isNaN(parseFloat(item.dataset.rating)) ? parseFloat(item.dataset.rating) : null;
            const iMT = item.dataset.mediaType, iGIds = item.dataset.genreIds ? item.dataset.genreIds.split(',').filter(Boolean).map(Number) : [];
            if (iMT === 'tv' && iGIds.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))) matches = false;
            if (matches && selMT && iMT !== selMT) matches = false;
            if (matches && selGIds.length && !selGIds.every(sgid => iGIds.includes(parseInt(sgid)))) matches = false;
            if (matches && iY !== null) { if ((yF && iY < yF) || (yT && iY > yT)) matches = false; }
            else if (matches && (yF || yT)) matches = false;
            if (matches && iR !== null) { if ((rF && iR < rF) || (rT && iR > rT)) matches = false; }
            else if (matches && (rF || rT)) matches = false;
            item.style.display = matches ? 'flex' : 'none'; if (matches) visibleCount++;
        });
        if (visibleCount === 0 && items.length > 0) {
            searchResultsContainer.querySelector('.no-results')?.remove();
            const noResMsg = Object.assign(document.createElement('p'), { className: 'no-results-client-message', textContent: 'По вашему запросу и выбранным фильтрам ничего не найдено.', style: "text-align:center;color:#A0A0A0;font-size:1.1em;padding:30px 15px;" });
            (searchResultsContainer.querySelector('.search-results-grid') || searchResultsContainer).after(noResMsg);
            if(initialPlaceholder) initialPlaceholder.style.display = 'none';
        }
    }

    if (newSearchModal) {
        const obs = new MutationObserver(m => m.forEach(mu => { if (mu.attributeName === 'class' && newSearchModal.classList.contains('active') && allMovieGenresMap.size === 0) loadAndPopulateAllGenres(); }));
        obs.observe(newSearchModal, { attributes: true });
    }
    document.querySelectorAll('.search-modal-sidebar .custom-dropdown').forEach(dd => {
        dd.querySelector('.dropdown-toggle')?.addEventListener('click', e => {
            e.stopPropagation(); const isOpen = dd.classList.contains('open');
            document.querySelectorAll('.search-modal-sidebar .custom-dropdown.open').forEach(odd => { if (odd !== dd) odd.classList.remove('open'); });
            dd.classList.toggle('open', !isOpen);
            if (!isOpen && dd.dataset.dropdownId === 'genres-movie' && genreDropdownMovieMenuElement && !genreDropdownMovieMenuElement.children.length && !genreDropdownMovieMenuElement.querySelector('.genres-loading-placeholder')) {
                const p = Object.assign(document.createElement('p'), { className: 'genres-loading-placeholder', textContent: 'Загрузка жанров...', style: "padding:8px 10px;color:#A0A0A0;font-size:0.9em;font-style:italic;" });
                genreDropdownMovieMenuElement.appendChild(p); loadAndPopulateAllGenres();
            }
        });
    });

    function updateToggleTextForDropdown(ddEl, defTxt) {
        if (!ddEl) return; const txtEl = ddEl.querySelector('.dropdown-toggle span'); if (!txtEl) return;
        const selCbs = Array.from(ddEl.querySelectorAll('.dropdown-menu input:checked'));
        const selTxts = selCbs.map(cb => cb.dataset.genreName || cb.labels[0].textContent.trim() || cb.value);
        if (selTxts.length) { const maxN = ddEl.dataset.dropdownId === "genres-movie" ? 2 : 1; txtEl.textContent = selTxts.length <= maxN ? selTxts.join(', ') : `${selTxts.length} выбрано`; }
        else txtEl.textContent = defTxt;
    }
    function updateToggleTextForGenres(ddEl) {
        if (!ddEl) return; const menu = ddEl.querySelector('.dropdown-menu'), span = ddEl.querySelector('.dropdown-toggle span'); if (!span) return;
        if (menu?.querySelector('.genres-loading-placeholder')) span.textContent = "Загрузка жанров...";
        else if (menu?.querySelectorAll('label').length === 0 && !menu?.querySelector('.genres-loading-placeholder')) span.textContent = "Жанры не найдены";
        else updateToggleTextForDropdown(ddEl, "Выберите жанр(ы)");
    }
    document.querySelectorAll('.number-input-container').forEach(c => {
        const i = c.querySelector('input[type="number"]'), uA = c.querySelector('.up-arrow'), dA = c.querySelector('.down-arrow');
        if (i && uA && dA) { uA.addEventListener('click', () => { i.stepUp(); i.dispatchEvent(new Event('input', { bubbles: true })); }); dA.addEventListener('click', () => { i.stepDown(); i.dispatchEvent(new Event('input', { bubbles: true })); }); }
    });

    if (detailedInfoPanel) { detailedInfoPanel.classList.remove('expanded'); detailedInfoPanel.style.display = 'none'; currentActiveTabPane = detailedInfoPanel.querySelector('.tab-pane.active'); }
    loadAndDisplayHeroContent(); updateUserProfileDisplay();
    const popularShelf = document.getElementById('popular'), nowPlayingShelf = document.getElementById('now-playing');
    if (popularShelf) fetchAndRenderPopularMovies(popularShelf);
    if (nowPlayingShelf) fetchAndRenderTrendingContent(nowPlayingShelf);

    if (dynamicShelvesContainer) {
        const moviesShelf = createShelfElement('movies-shelf', 'Фильмы'); 
        dynamicShelvesContainer.appendChild(moviesShelf); 
        fetchAndRenderMoviesShelf(moviesShelf);
        
        const tvShowsShelf = createShelfElement('tv-shows-shelf', 'Сериалы'); 
        dynamicShelvesContainer.appendChild(tvShowsShelf); 
        fetchAndRenderTvShowsShelf(tvShowsShelf);
        
    } else console.error("Контейнер 'dynamic-shelves-container' не найден.");

    initializeGenreArea();
    initShelves();

    handlePopularSectionVisibility();
    window.addEventListener('scroll', handlePopularSectionVisibility, { passive: true });
    if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20), { passive: true });

    navbarButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            navbarButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const sectionId = this.dataset.section;
            if (sectionId && document.getElementById(sectionId)) {
                 const targetSection = document.getElementById(sectionId);
                 if (targetSection) {
                    let effectiveNavbarHeight = (navbar && getComputedStyle(navbar).position === 'fixed') ? navbar.offsetHeight : 0;
                    let offsetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - effectiveNavbarHeight;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            } else if (sectionId) { 
                console.warn(`Секция с ID "${sectionId}" не найдена. Прокрутка невозможна.`);
            }
        });
    });
});
