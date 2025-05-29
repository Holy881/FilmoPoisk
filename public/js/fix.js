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
    const contentArea = document.querySelector('.content-area'); // Основной контейнер для первых двух полок
    const genreShelvesArea = document.getElementById('genre-shelves-area'); // Контейнер для жанровых полок
    const genreAreaToggleButton = document.getElementById('genre-area-toggle-button'); // Кнопка для раскрытия/скрытия

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
    const detailedInfoGenres = detailedInfoLeftColumn?.querySelector('.detailed-info-genres');
    const detailedInfoOverview = detailedInfoLeftColumn?.querySelector('#tab-about-details .detailed-info-overview');

    const detailedInfoWatchBtn = detailedInfoLeftColumn?.querySelector('.watch-now-btn');
    const detailedInfoAddToListBtn = detailedInfoLeftColumn?.querySelector('.add-to-list-btn');

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

    const DEFAULT_AVATAR_PATH = '/images/default-avatar.png';
    const placeholderMovies = [
        { id: 1, tmdb_id: 550, media_type: 'movie', title: 'Бойцовский клуб', name: 'Бойцовский клуб', poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3pmJK.jpg', vote_average: 8.43, overview: 'Сотрудник страховой компании страдает хронической бессонницей и отчаянно пытается вырваться из мучительно скучной жизни. Однажды он встречает Тайлера Дёрдена, харизматичного торговца мылом с извращённой философией. Тайлер уверен, что самосовершенствование — удел слабых, а саморазрушение — единственное, ради чего стоит жить.', release_date: '1999-10-15', first_air_date: null, genres: [{id: 18, name: 'Драма'}], number_of_episodes: null, number_of_seasons: null },
        { id: 2, tmdb_id: 1399, media_type: 'tv', title: 'Игра престолов', name: 'Игра престолов', poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg', vote_average: 8.4, overview: 'К концу подходит время благоденствия, и лето, длившееся почти десятилетие, угасает. Вокруг средоточия власти Семи королевств, Железного трона, зреет заговор, и в это непростое время король решает искать поддержки у друга юности Эддарда Старка. В мире, где все — от короля до наемника — рвутся к власти, плетут интриги и готовы вонзить нож в спину, есть место и благородству, состраданию и любви. Между тем, никто не замечает пробуждения тьмы из легенд далеко на Севере — и лишь Стена защищает живых к югу от нее.', release_date: null, first_air_date: '2011-04-17', genres: [{id: 10765, name: 'Sci-Fi & Fantasy'}, {id: 18, name: 'Драма'}, {id: 10759, name: 'Action & Adventure'}], number_of_episodes: 73, number_of_seasons: 8 },
    ];
    const EXCLUDED_TV_GENRE_IDS = [10767, 10764]; 

    const GENRES_FOR_SHELVES = [
        { id: 28, name: "Боевик" }, { id: 12, name: "Приключения" }, { id: 16, name: "Мультфильм" },
        { id: 35, name: "Комедия" }, { id: 80, name: "Криминал" }, { id: 18, name: "Драма" },
        { id: 14, name: "Фэнтези" }, { id: 27, name: "Ужасы" }, { id: 9648, name: "Детектив" },
        { id: 10749, name: "Мелодрама" }, { id: 878, name: "Фантастика" }, { id: 53, name: "Триллер" },
        { id: 10752, name: "Военный" }
    ];

    // Функция для создания HTML-структуры полки
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
        if (!shelfElement) {
            console.error("Полка не найдена для рендеринга:", shelfElement);
            return;
        }
        const grid = shelfElement.querySelector('.shelf-grid');
        if (!grid) {
            console.error("Grid не найден внутри полки:", shelfElement);
            return;
        }
        grid.innerHTML = ''; 
        const moviesToDisplay = moviesData; 
        moviesToDisplay.forEach(movie => {
            grid.appendChild(createMovieTile(movie));
        });
        requestAnimationFrame(() => {
            updateShelfControls(shelfElement);
        });
    }

    // Функция для полки "Популярное" (Что популярно на TMDB)
    async function fetchAndRenderPopularMovies(shelfElement, movieCount = 8, tvShowCount = 7) {
        if (!shelfElement) return;

        try {
            const [movieResponse, tvResponse] = await Promise.all([
                fetch(`/api/tmdb/search?media_type=movie&sort_by=popularity.desc&page=1&rating_from=6.5`), 
                fetch(`/api/tmdb/search?media_type=tv&sort_by=popularity.desc&page=1&with_types=4&rating_from=6.5`) 
            ]);

            let popularMovies = [];
            let popularTvShows = [];

            if (movieResponse.ok) {
                const movieData = await movieResponse.json();
                if (movieData && movieData.results && movieData.results.length > 0) {
                    const filteredMovies = movieData.results.filter(movie => movie.popularity >= 75); 
                    popularMovies = filteredMovies.map(movie => ({
                        tmdb_id: movie.id,
                        media_type: 'movie',
                        title: movie.title,
                        name: movie.title,
                        poster_path: movie.poster_path,
                        vote_average: movie.vote_average,
                        overview: movie.overview,
                        release_date: movie.release_date,
                        genre_ids: movie.genre_ids || [],
                        popularity: movie.popularity 
                    })).slice(0, movieCount);
                } else {
                    console.warn('Не удалось получить популярные фильмы (рейтинг >= 6.5) или список пуст.');
                }
            } else {
                console.error(`Ошибка при загрузке популярных фильмов: ${movieResponse.status}`);
            }

            if (tvResponse.ok) {
                const tvData = await tvResponse.json();
                if (tvData && tvData.results && tvData.results.length > 0) {
                    let filteredTvResults = tvData.results.filter(tvShow => tvShow.popularity >= 75); 

                    filteredTvResults = filteredTvResults.filter(tvShow => {
                        if (!tvShow.genre_ids || tvShow.genre_ids.length === 0) {
                            return true; 
                        }
                        return !tvShow.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id));
                    });

                    popularTvShows = filteredTvResults.map(tvShow => ({
                        tmdb_id: tvShow.id,
                        media_type: 'tv',
                        title: tvShow.name, 
                        name: tvShow.name,
                        poster_path: tvShow.poster_path,
                        vote_average: tvShow.vote_average,
                        overview: tvShow.overview,
                        first_air_date: tvShow.first_air_date, 
                        genre_ids: tvShow.genre_ids || [],
                        popularity: tvShow.popularity 
                    })).slice(0, tvShowCount);
                } else {
                    console.warn('Не удалось получить популярные сериалы (scripted, рейтинг >= 6.5) или список пуст.');
                }
            } else {
                console.error(`Ошибка при загрузке популярных сериалов (scripted): ${tvResponse.status}`);
            }

            const combinedMedia = [...popularMovies, ...popularTvShows];

            for (let i = combinedMedia.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [combinedMedia[i], combinedMedia[j]] = [combinedMedia[j], combinedMedia[i]];
            }

            if (combinedMedia.length > 0) {
                renderShelf(shelfElement, combinedMedia);
            } else {
                console.warn('Не удалось получить ни фильмы, ни сериалы по заданным критериям для "Популярное". Отображение заглушек.');
                renderShelf(shelfElement, placeholderMovies.slice(0, movieCount + tvShowCount));
            }

        } catch (error) {
            console.error('Ошибка при загрузке и отображении контента "Популярное":', error);
            renderShelf(shelfElement, placeholderMovies.slice(0, movieCount + tvShowCount));
        }
    }

    // Функция для полки "Сейчас смотрят" (В тренде на TMDB)
    async function fetchAndRenderTrendingContent(shelfElement, movieCount = 7, tvShowCount = 8) {
        if (!shelfElement) return;

        try {
            const [trendingMoviesResponse, trendingTvResponse] = await Promise.all([
                fetch(`/api/tmdb/search?media_type=movie&list_type=trending_movie_week&page=1`), 
                fetch(`/api/tmdb/search?media_type=tv&list_type=trending_tv_week&page=1`)      
            ]);

            let trendingMovies = [];
            let trendingTvShows = [];

            if (trendingMoviesResponse.ok) {
                const moviesData = await trendingMoviesResponse.json();
                if (moviesData && moviesData.results && moviesData.results.length > 0) {
                    trendingMovies = moviesData.results
                        .filter(movie => movie.vote_average >= 6.5 && movie.popularity >= 50) 
                        .map(movie => ({
                            tmdb_id: movie.id,
                            media_type: 'movie',
                            title: movie.title,
                            name: movie.title,
                            poster_path: movie.poster_path,
                            vote_average: movie.vote_average,
                            overview: movie.overview,
                            release_date: movie.release_date,
                            genre_ids: movie.genre_ids || [],
                            popularity: movie.popularity
                        })).slice(0, movieCount);
                } else {
                    console.warn('Не удалось получить фильмы "В тренде за неделю" или список пуст.');
                }
            } else {
                console.error(`Ошибка при загрузке фильмов "В тренде за неделю": ${trendingMoviesResponse.status}`);
            }

            if (trendingTvResponse.ok) {
                const tvData = await trendingTvResponse.json();
                if (tvData && tvData.results && tvData.results.length > 0) {
                    let filteredTvResults = tvData.results
                        .filter(tvShow => tvShow.vote_average >= 6.5 && tvShow.popularity >= 75); 

                    filteredTvResults = filteredTvResults.filter(tvShow => {
                        if (!tvShow.genre_ids || tvShow.genre_ids.length === 0) {
                            return true;
                        }
                        return !tvShow.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id));
                    });

                    trendingTvShows = filteredTvResults.map(tvShow => ({
                        tmdb_id: tvShow.id,
                        media_type: 'tv',
                        title: tvShow.name,
                        name: tvShow.name,
                        poster_path: tvShow.poster_path,
                        vote_average: tvShow.vote_average,
                        overview: tvShow.overview,
                        first_air_date: tvShow.first_air_date,
                        genre_ids: tvShow.genre_ids || [],
                        popularity: tvShow.popularity
                    })).slice(0, tvShowCount);
                } else {
                    console.warn('Не удалось получить сериалы "В тренде за неделю" или список пуст.');
                }
            } else {
                console.error(`Ошибка при загрузке сериалов "В тренде за неделю": ${trendingTvResponse.status}`);
            }

            const combinedMedia = [...trendingMovies, ...trendingTvShows];

            for (let i = combinedMedia.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [combinedMedia[i], combinedMedia[j]] = [combinedMedia[j], combinedMedia[i]];
            }

            if (combinedMedia.length > 0) {
                renderShelf(shelfElement, combinedMedia);
            } else {
                console.warn('Не удалось получить контент для "В тренде". Отображение заглушек.');
                renderShelf(shelfElement, placeholderMovies.slice(0, movieCount + tvShowCount));
            }

        } catch (error) {
            console.error('Ошибка при загрузке и отображении контента "В тренде":', error);
            renderShelf(shelfElement, placeholderMovies.slice(0, movieCount + tvShowCount));
        }
    }

    // Функция для полки "Фильмы"
    async function fetchAndRenderMoviesShelf(shelfElement, count = 15) {
        if (!shelfElement) return;
        try {
            const response = await fetch(`/api/tmdb/search?media_type=movie&sort_by=popularity.desc&page=1&rating_from=6.5`);
            if (!response.ok) {
                console.error(`Ошибка HTTP при запросе полки "Фильмы": ${response.status}`);
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            if (data && data.results && data.results.length > 0) {
                const filteredMovies = data.results.filter(movie => movie.popularity >= 75);
                const moviesToDisplay = filteredMovies.map(movie => ({
                    tmdb_id: movie.id,
                    media_type: 'movie',
                    title: movie.title,
                    name: movie.title,
                    poster_path: movie.poster_path,
                    vote_average: movie.vote_average,
                    overview: movie.overview,
                    release_date: movie.release_date,
                    genre_ids: movie.genre_ids || [],
                    popularity: movie.popularity
                })).slice(0, count);
                renderShelf(shelfElement, moviesToDisplay);
            } else {
                console.warn('Не удалось получить фильмы для полки "Фильмы" или список пуст.');
                renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'movie').slice(0, count));
            }
        } catch (error) {
            console.error('Ошибка при загрузке полки "Фильмы":', error);
            renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'movie').slice(0, count));
        }
    }

    // Функция для полки "Сериалы"
    async function fetchAndRenderTvShowsShelf(shelfElement, count = 15) {
        if (!shelfElement) return;
        try {
            const response = await fetch(`/api/tmdb/search?media_type=tv&sort_by=popularity.desc&page=1&with_types=4&rating_from=6.5`);
            if (!response.ok) {
                console.error(`Ошибка HTTP при запросе полки "Сериалы": ${response.status}`);
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            if (data && data.results && data.results.length > 0) {
                let filteredTvResults = data.results.filter(tvShow => tvShow.popularity >= 75);
                filteredTvResults = filteredTvResults.filter(tvShow => 
                    !tvShow.genre_ids || !tvShow.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))
                );
                const tvShowsToDisplay = filteredTvResults.map(tvShow => ({
                    tmdb_id: tvShow.id,
                    media_type: 'tv',
                    title: tvShow.name,
                    name: tvShow.name,
                    poster_path: tvShow.poster_path,
                    vote_average: tvShow.vote_average,
                    overview: tvShow.overview,
                    first_air_date: tvShow.first_air_date,
                    genre_ids: tvShow.genre_ids || [],
                    popularity: tvShow.popularity
                })).slice(0, count);
                renderShelf(shelfElement, tvShowsToDisplay);
            } else {
                console.warn('Не удалось получить сериалы для полки "Сериалы" или список пуст.');
                renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv').slice(0, count));
            }
        } catch (error) {
            console.error('Ошибка при загрузке полки "Сериалы":', error);
            renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv').slice(0, count));
        }
    }
    
    // Обновленная функция для полки "Онгоинги" (сериалы со статусом "Returning Series")
    async function fetchAndRenderOngoingSeriesShelf(shelfElement, count = 15, pagesToFetch = 2) {
        if (!shelfElement) return;
        console.log('Запрос онгоингов (Returning Series)...');
        let candidates = [];
        let returningSeries = [];
        const ONGOING_POPULARITY_THRESHOLD = 20; // Смягченный порог популярности для онгоингов

        try {
            const fetchPromises = [];
            for (let i = 1; i <= pagesToFetch; i++) {
                fetchPromises.push(
                    fetch(`/api/tmdb/search?media_type=tv&sort_by=popularity.desc&page=${i}&with_types=4&rating_from=6.0`)
                );
            }
            const popularTvResponses = await Promise.all(fetchPromises);

            for (const response of popularTvResponses) {
                if (response.ok) {
                    const data = await response.json();
                    if (data.results) {
                        candidates.push(...data.results);
                    }
                } else {
                    console.warn(`Не удалось загрузить страницу популярных сериалов: ${response.status}`);
                }
            }
            
            const uniqueCandidatesMap = new Map();
            candidates.forEach(item => {
                if (!uniqueCandidatesMap.has(item.id)) {
                    uniqueCandidatesMap.set(item.id, item);
                }
            });
            const uniqueCandidates = Array.from(uniqueCandidatesMap.values());
            console.log(`Кандидатов для проверки на "Returning Series" (после ${pagesToFetch} стр.): ${uniqueCandidates.length}`);

            if (uniqueCandidates.length === 0) {
                console.warn('Нет кандидатов для проверки на "Returning Series".');
                renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv' && m.id === 9).slice(0, 1)); // Фоллбэк на Атаку Титанов
                return;
            }
            
            const detailPromises = uniqueCandidates.map(tvShow => 
                fetch(`/api/tmdb/details/tv/${tvShow.id}?language=ru-RU`)
                    .then(res => {
                        if (!res.ok) {
                            console.warn(`Ошибка при запросе деталей для TV ID ${tvShow.id}: ${res.status}`);
                            return null; 
                        }
                        return res.json();
                    })
                    .catch(err => {
                        console.error(`Ошибка сети при запросе деталей для TV ID ${tvShow.id}:`, err);
                        return null; 
                    })
            );

            const detailedResults = await Promise.allSettled(detailPromises);

            detailedResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    const tvDetails = result.value;
                    if (tvDetails.status === 'Returning Series' && 
                        tvDetails.vote_average >= 6.5 && 
                        tvDetails.popularity >= ONGOING_POPULARITY_THRESHOLD && 
                        (!tvDetails.genres || !tvDetails.genres.some(genre => EXCLUDED_TV_GENRE_IDS.includes(genre.id))) && 
                        (!tvDetails.genre_ids || !tvDetails.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))) 
                    ) {
                        returningSeries.push({
                            tmdb_id: tvDetails.id,
                            media_type: 'tv',
                            title: tvDetails.name,
                            name: tvDetails.name,
                            poster_path: tvDetails.poster_path,
                            vote_average: tvDetails.vote_average,
                            overview: tvDetails.overview,
                            first_air_date: tvDetails.first_air_date,
                            genre_ids: tvDetails.genres ? tvDetails.genres.map(g => g.id) : (tvDetails.genre_ids || []), 
                            popularity: tvDetails.popularity
                        });
                    }
                }
            });
            
            console.log(`Найдено "Returning Series" после всех фильтров: ${returningSeries.length}`);

            returningSeries.sort((a, b) => b.popularity - a.popularity);
            
            const seriesToDisplay = returningSeries.slice(0, count);

            if (seriesToDisplay.length > 0) {
                renderShelf(shelfElement, seriesToDisplay);
            } else {
                console.warn('Не найдено "Returning Series", соответствующих критериям. Отображение заглушек.');
                renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv' && m.id === 2).slice(0, 1)); // Фоллбэк на Игру Престолов
            }

        } catch (error) {
            console.error('Общая ошибка при загрузке полки "Онгоинги":', error);
            renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv' && m.id === 11).slice(0, 1)); // Фоллбэк на Ведьмака
        }
    }
    
    // Новая функция для загрузки полки по конкретному жанру (фильмы и сериалы)
    async function fetchAndRenderGenreShelf(shelfElement, genreId, itemsPerShelf = 15, movieCount = 7, tvShowCount = 8) {
        if (!shelfElement) return;
        const genreName = GENRES_FOR_SHELVES.find(g => g.id === genreId)?.name || `Жанр ${genreId}`;
        console.log(`Загрузка полки для жанра "${genreName}" (ID: ${genreId})`);

        try {
            const [movieResponse, tvResponse] = await Promise.all([
                fetch(`/api/tmdb/search?media_type=movie&sort_by=popularity.desc&genres=${genreId}&page=1&rating_from=6.5`),
                fetch(`/api/tmdb/search?media_type=tv&sort_by=popularity.desc&genres=${genreId}&with_types=4&page=1&rating_from=6.5`)
            ]);

            let genreMovies = [];
            let genreTvShows = [];

            if (movieResponse.ok) {
                const movieData = await movieResponse.json();
                if (movieData && movieData.results) {
                    genreMovies = movieData.results
                        .filter(movie => movie.popularity >= 75)
                        .map(movie => ({
                            tmdb_id: movie.id, media_type: 'movie', title: movie.title, name: movie.title,
                            poster_path: movie.poster_path, vote_average: movie.vote_average,
                            overview: movie.overview, release_date: movie.release_date,
                            genre_ids: movie.genre_ids || [], popularity: movie.popularity
                        }));
                } else { console.warn(`Нет результатов для фильмов жанра ${genreName}`); }
            } else { console.error(`Ошибка загрузки фильмов для жанра ${genreName}: ${movieResponse.status}`); }

            if (tvResponse.ok) {
                const tvData = await tvResponse.json();
                if (tvData && tvData.results) {
                    let filteredTv = tvData.results.filter(tv => tv.popularity >= 50); 
                    filteredTv = filteredTv.filter(tvShow => 
                        !tvShow.genre_ids || !tvShow.genre_ids.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))
                    );
                    genreTvShows = filteredTv.map(tvShow => ({
                        tmdb_id: tvShow.id, media_type: 'tv', title: tvShow.name, name: tvShow.name,
                        poster_path: tvShow.poster_path, vote_average: tvShow.vote_average,
                        overview: tvShow.overview, first_air_date: tvShow.first_air_date,
                        genre_ids: tvShow.genre_ids || [], popularity: tvShow.popularity
                    }));
                } else { console.warn(`Нет результатов для сериалов жанра ${genreName}`);}
            } else { console.error(`Ошибка загрузки сериалов для жанра ${genreName}: ${tvResponse.status}`); }

            let combinedMedia = [...genreMovies.slice(0, movieCount), ...genreTvShows.slice(0, tvShowCount)];
            combinedMedia.sort(() => 0.5 - Math.random()); 
            const finalMedia = combinedMedia.slice(0, itemsPerShelf);

            if (finalMedia.length > 0) {
                renderShelf(shelfElement, finalMedia);
            } else {
                console.warn(`Нет контента для отображения на полке жанра "${genreName}" после всех фильтров.`);
                renderShelf(shelfElement, []); 
            }
        } catch (error) {
            console.error(`Ошибка при загрузке полки для жанра "${genreName}":`, error);
            renderShelf(shelfElement, []); 
        }
    }
    
    // Инициализация области жанров
    function initializeGenreArea() {
        if (!genreShelvesArea) { 
            console.error("Контейнер 'genre-shelves-area' не найден в DOM.");
            return;
        }
        if (!genreAreaToggleButton) {
            console.warn("Кнопка 'genre-area-toggle-button' не найдена в DOM. Функциональность раскрытия/скрытия не будет работать.");
        }

        genreShelvesArea.innerHTML = ''; 

        GENRES_FOR_SHELVES.forEach((genre, index) => {
            const shelfId = `genre-shelf-${genre.id}`;
            const shelfElement = createShelfElement(shelfId, genre.name);
            
            if (index > 0) { 
                shelfElement.classList.add('genre-shelf--hidden-by-default'); 
            } else {
                shelfElement.classList.add('genre-shelf--visible-by-default'); 
            }
            genreShelvesArea.appendChild(shelfElement);
            fetchAndRenderGenreShelf(shelfElement, genre.id);
        });

        if (genreAreaToggleButton) {
            genreAreaToggleButton.addEventListener('click', () => {
                const isExpanded = genreShelvesArea.classList.toggle('expanded');
                const arrowIcon = genreAreaToggleButton.querySelector('i');
                if (arrowIcon) {
                    arrowIcon.classList.toggle('fa-chevron-down', !isExpanded);
                    arrowIcon.classList.toggle('fa-chevron-up', isExpanded);
                }
            });
        }
    }


    // --- Остальной код без изменений (applyRatingStyles, renderSeasonsDisplay, populatePanelData, etc.) ---
    // (Код для openDetailedInfo, closeDetailedInfo, updateShelfControls, initShelves, 
    //  обработчики модального окна поиска, fetchGenresFromServer, populateGenreDropdown, 
    //  triggerSearch, performSearch, displayResults, displayError, clearSearchResults, 
    //  applyClientSideFilters и обработчики событий навигации и скролла остаются здесь)
    // ... (начало скопированного кода) ...
    // (Код для openDetailedInfo, closeDetailedInfo, updateShelfControls, initShelves, 
    //  обработчики модального окна поиска, fetchGenresFromServer, populateGenreDropdown, 
    //  triggerSearch, performSearch, displayResults, displayError, clearSearchResults, 
    //  applyClientSideFilters и обработчики событий навигации и скролла остаются здесь)

    if (newSearchModal) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') {
                    const isActive = newSearchModal.classList.contains('active');
                    if (isActive) {
                         if (allMovieGenresMap.size === 0 && allTvGenresMap.size === 0) { 
                            loadAndPopulateAllGenres();
                        }
                    }
                }
            });
        });
        observer.observe(newSearchModal, { attributes: true });
    }

    document.querySelectorAll('.search-modal-sidebar .custom-dropdown').forEach(dropdown => {
        const toggleButton = dropdown.querySelector('.dropdown-toggle');
        toggleButton?.addEventListener('click', (event) => {
            event.stopPropagation();
            const currentlyOpen = dropdown.classList.contains('open');
            
            document.querySelectorAll('.search-modal-sidebar .custom-dropdown.open').forEach(od => {
                if (od !== dropdown) od.classList.remove('open');
            });
            dropdown.classList.toggle('open', !currentlyOpen); 
            
            if (!currentlyOpen && dropdown.dataset.dropdownId === 'genres-movie' && genreDropdownMovieMenuElement && genreDropdownMovieMenuElement.querySelectorAll('label').length === 0 && !genreDropdownMovieMenuElement.querySelector('.genres-loading-placeholder')) {
                const placeholder = document.createElement('p');
                placeholder.className = 'genres-loading-placeholder';
                placeholder.textContent = 'Загрузка жанров...';
                placeholder.style.cssText = "padding: 8px 10px; color: #A0A0A0; font-size: 0.9em; font-style: italic;";
                genreDropdownMovieMenuElement.appendChild(placeholder);
                loadAndPopulateAllGenres();
            }
        });
    });

    function updateToggleTextForDropdown(dropdownElement, defaultText) {
        if (!dropdownElement) return;
        const textElement = dropdownElement.querySelector('.dropdown-toggle span');
        if (!textElement) return;
        const selectedCheckboxes = Array.from(dropdownElement.querySelectorAll('.dropdown-menu input[type="checkbox"]:checked'));
        const selectedTexts = selectedCheckboxes.map(cb => cb.dataset.genreName || cb.labels[0].textContent.trim() || cb.value);
        
        if (selectedTexts.length > 0) {
            const maxNames = dropdownElement.dataset.dropdownId === "genres-movie" ? 2 : 1; 
            textElement.textContent = selectedTexts.length <= maxNames ? selectedTexts.join(', ') : `${selectedTexts.length} выбрано`;
        } else {
            textElement.textContent = defaultText;
        }
    }

    function updateToggleTextForGenres(dropdownElement) { 
        if (!dropdownElement) return;
        const menu = dropdownElement.querySelector('.dropdown-menu');
        const toggleSpan = dropdownElement.querySelector('.dropdown-toggle span');
        if (!toggleSpan) return;

        if (menu?.querySelector('.genres-loading-placeholder')) {
            toggleSpan.textContent = "Загрузка жанров...";
        } else if (menu?.querySelectorAll('label').length === 0 && !menu?.querySelector('.genres-loading-placeholder')) {
            toggleSpan.textContent = "Жанры не найдены";
        } else {
            updateToggleTextForDropdown(dropdownElement, "Выберите жанр(ы)");
        }
    }

    document.querySelectorAll('.number-input-container').forEach(container => {
        const input = container.querySelector('input[type="number"]');
        const upArrow = container.querySelector('.up-arrow');
        const downArrow = container.querySelector('.down-arrow');
        if (input && upArrow && downArrow) {
            upArrow.addEventListener('click', () => { input.stepUp(); input.dispatchEvent(new Event('input', { bubbles: true })); });
            downArrow.addEventListener('click', () => { input.stepDown(); input.dispatchEvent(new Event('input', { bubbles: true })); });
        }
    });
    // ... (конец скопированного кода) ...


    // --- Инициализация ---
    if (detailedInfoPanel) {
        detailedInfoPanel.classList.remove('expanded');
        detailedInfoPanel.style.display = 'none';
        currentActiveTabPane = detailedInfoPanel.querySelector('.tab-pane.active');
    }

    loadAndDisplayHeroContent();
    updateUserProfileDisplay();
    
    const popularShelfElement = document.getElementById('popular');
    const nowPlayingShelfElement = document.getElementById('now-playing'); 

    if (popularShelfElement) {
        fetchAndRenderPopularMovies(popularShelfElement); 
    }
    if (nowPlayingShelfElement) { 
        fetchAndRenderTrendingContent(nowPlayingShelfElement); 
    }
    
    // Инициализация новой области с жанровыми полками и отдельных полок "Фильмы", "Сериалы", "Онгоинги"
    // Убедимся, что dynamicShelvesContainer существует для первых трех новых полок
    const mainDynamicShelvesContainer = document.getElementById('dynamic-shelves-container'); // Это должен быть ваш основной контейнер для этих трех полок
    if (mainDynamicShelvesContainer) {
        const moviesShelf = createShelfElement('movies-shelf', 'Фильмы');
        mainDynamicShelvesContainer.appendChild(moviesShelf);
        fetchAndRenderMoviesShelf(moviesShelf);

        const tvShowsShelf = createShelfElement('tv-shows-shelf', 'Сериалы');
        mainDynamicShelvesContainer.appendChild(tvShowsShelf);
        fetchAndRenderTvShowsShelf(tvShowsShelf);

        const ongoingSeriesShelf = createShelfElement('ongoing-series-shelf', 'Онгоинги');
        mainDynamicShelvesContainer.appendChild(ongoingSeriesShelf);
        fetchAndRenderOngoingSeriesShelf(ongoingSeriesShelf);
    } else {
         console.error("Контейнер 'dynamic-shelves-container' (для Фильмы, Сериалы, Онгоинги) не найден в DOM.");
    }
    
    // Инициализация отдельной области с жанровыми полками
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
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                let effectiveNavbarHeight = 0;
                if (navbar && getComputedStyle(navbar).position === 'fixed') {
                    effectiveNavbarHeight = navbar.offsetHeight;
                }

                let offsetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - effectiveNavbarHeight;
                
                // Уточненная логика прокрутки
                if (sectionId === 'popular' || sectionId === 'now-playing' || sectionId === 'movies-shelf' || sectionId === 'tv-shows-shelf' || sectionId === 'ongoing-series-shelf') {
                    // Для полок, которые находятся непосредственно в content-area или dynamic-shelves-container
                     offsetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - effectiveNavbarHeight;
                } else if (sectionId === 'genre-shelves-area' && genreShelvesArea) { 
                    // Для контейнера жанровых полок
                    offsetTop = genreShelvesArea.getBoundingClientRect().top + window.pageYOffset - effectiveNavbarHeight;
                } else if (genreShelvesArea && genreShelvesArea.contains(targetSection)) {
                    // Для конкретной жанровой полки внутри genre-shelves-area
                     offsetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - effectiveNavbarHeight;
                }


                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

}); // Конец DOMContentLoaded
