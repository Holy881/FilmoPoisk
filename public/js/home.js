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
    const popularShelf = document.getElementById('popular');
    const nowPlayingShelf = document.getElementById('now-playing');
    const detailedInfoPanel = document.getElementById('detailed-info-panel');
    const detailedInfoCloseBtn = detailedInfoPanel?.querySelector('.detailed-info-close-btn');
    const detailedInfoBackdrop = detailedInfoPanel?.querySelector('.detailed-info-backdrop');
    const detailedInfoPoster = detailedInfoPanel?.querySelector('.detailed-info-poster');
    const detailedInfoTitle = detailedInfoPanel?.querySelector('.detailed-info-title');
    const detailedInfoRating = detailedInfoPanel?.querySelector('.meta-rating span');
    const detailedInfoYear = detailedInfoPanel?.querySelector('.meta-year');
    const detailedInfoEpisodes = detailedInfoPanel?.querySelector('.meta-episodes');
    const detailedInfoSeasons = detailedInfoPanel?.querySelector('.meta-seasons');
    const detailedInfoGenres = detailedInfoPanel?.querySelector('.detailed-info-genres');
    const detailedInfoOverview = detailedInfoPanel?.querySelector('.detailed-info-overview');
    const detailedInfoWatchBtn = detailedInfoPanel?.querySelector('.watch-now-btn');
    const detailedInfoAddToListBtn = detailedInfoPanel?.querySelector('.add-to-list-btn');
    const detailedInfoTabsContainer = detailedInfoPanel?.querySelector('.detailed-info-tabs');
    const detailedInfoTabPanes = detailedInfoPanel?.querySelectorAll('.tab-pane');

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
    const POSTER_SIZE_DETAILS = 'w500';
    const BACKDROP_SIZE_DETAILS = 'original';
    const POSTER_SIZE_SEARCH = 'w154';


    const DEFAULT_VOLUME_LEVEL = 0.1;
    const VOLUME_ANIMATION_DURATION = 1500;

    let searchTimeout;
    let allMovieGenresMap = new Map();
    let allTvGenresMap = new Map();
    let isHeroSoundActive = false;
    let currentHeroVideoElement = null;
    let isInfoPinned = false;
    let currentUserData = null;

    const DEFAULT_AVATAR_PATH = '/images/default-avatar.png';

    // Placeholder данные
    const placeholderMovies = [
        { id: 1, tmdb_id: 550, media_type: 'movie', title: 'Бойцовский клуб', name: 'Бойцовский клуб', poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3pmJK.jpg', vote_average: 8.43, overview: 'Сотрудник страховой компании страдает хронической бессонницей и отчаянно пытается вырваться из мучительно скучной жизни. Однажды он встречает Тайлера Дёрдена, харизматичного торговца мылом с извращённой философией. Тайлер уверен, что самосовершенствование — удел слабых, а саморазрушение — единственное, ради чего стоит жить.', release_date: '1999-10-15', first_air_date: null, genres: [{id: 18, name: 'Драма'}], number_of_episodes: null, number_of_seasons: null },
        { id: 2, tmdb_id: 1399, media_type: 'tv', title: 'Игра престолов', name: 'Игра престолов', poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg', vote_average: 8.4, overview: 'К концу подходит время благоденствия, и лето, длившееся почти десятилетие, угасает. Вокруг средоточия власти Семи королевств, Железного трона, зреет заговор, и в это непростое время король решает искать поддержки у друга юности Эддарда Старка. В мире, где все — от короля до наемника — рвутся к власти, плетут интриги и готовы вонзить нож в спину, есть место и благородству, состраданию и любви. Между тем, никто не замечает пробуждения тьмы из легенд далеко на Севере — и лишь Стена защищает живых к югу от нее.', release_date: null, first_air_date: '2011-04-17', genres: [{id: 10765, name: 'Sci-Fi & Fantasy'}, {id: 18, name: 'Драма'}, {id: 10759, name: 'Action & Adventure'}], number_of_episodes: 73, number_of_seasons: 8 },
        { id: 3, tmdb_id: 299536, media_type: 'movie', title: 'Мстители: Война бесконечности', name: 'Мстители: Война бесконечности', poster_path: '/mQsM262K0X2pIF01p50Xm7ie0jV.jpg', vote_average: 8.25, overview: 'Пока Мстители и их союзники продолжают защищать мир от различных опасностей, с которыми не смог бы справиться один супергерой, новая угроза возникает из космоса: Танос. Межгалактический тиран преследует цель собрать все шесть Камней Бесконечности — артефакты невероятной силы, с помощью которых можно менять реальность по своему желанию. Всё, с чем Мстители сталкивались ранее, вело к этому моменту — судьба Земли и всего существующего никогда ещё не была так непредсказуема.', release_date: '2018-04-25', first_air_date: null, genres: [{id: 12, name: 'Приключения'}, {id: 28, name: 'Боевик'}, {id: 878, name: 'Фантастика'}], number_of_episodes: null, number_of_seasons: null },
        { id: 4, tmdb_id: 157336, media_type: 'movie', title: 'Интерстеллар', name: 'Интерстеллар', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', vote_average: 8.4, overview: 'Когда засуха приводит человечество к продовольственному кризису, коллектив исследователей и учёных отправляется сквозь червоточину (которая предположительно соединяет области пространства-времени через большое расстояние) в путешествие, чтобы превзойти прежние ограничения для космических путешествий человека и найти планету с подходящими для человечества условиями.', release_date: '2014-11-05', first_air_date: null, genres: [{id: 12, name: 'Приключения'}, {id: 18, name: 'Драма'}, {id: 878, name: 'Фантастика'}], number_of_episodes: null, number_of_seasons: null },
        { id: 5, tmdb_id: 522627, media_type: 'movie', title: 'Джентльмены', name: 'Джентльмены', poster_path: '/jG52060hZ2Z13cfYc02D07y6pps.jpg', vote_average: 7.7, overview: 'Один очень умный выпускник Оксфорда придумал нелегальную схему обогащения на поместьях обедневшей британской аристократии. Но когда он решает продать свой бизнес влиятельному клану миллиардеров из США, на его пути встают не менее обаятельные, но жёсткие джентльмены.', release_date: '2019-12-03', first_air_date: null, genres: [{id: 28, name: 'Боевик'}, {id: 35, name: 'Комедия'}, {id: 80, name: 'Криминал'}], number_of_episodes: null, number_of_seasons: null },
    ];

    // --- Логика для Hero секции ---
    const popularScrollThreshold = 20;
    function handlePopularSectionVisibility() {
        if (!popularShelf) return;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        popularShelf.classList.toggle('hidden-on-scroll', scrollTop <= popularScrollThreshold);
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

    if (dropdownProfileButton) dropdownProfileButton.addEventListener('click', () => { window.location.href = '/profile'; if (profileDropdownMenu) profileDropdownMenu.classList.remove('active'); });
    if (dropdownLogoutButton) dropdownLogoutButton.addEventListener('click', () => { localStorage.removeItem('userId'); currentUserData = null; window.location.reload(); });
    
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
            if(heroSection) heroSection.dataset.videoType = data.video_info.type;
            
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


    // --- Функции для рендеринга "полок" ---
    function createMovieTile(movie) {
        const tile = document.createElement('div');
        tile.className = 'movie-tile';
        tile.dataset.tmdbId = String(movie.tmdb_id);
        tile.dataset.mediaType = movie.media_type;

        const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_CARD}${movie.poster_path}` : '/images/default-poster.jpg';

        const ratingSpan = document.createElement('span');
        ratingSpan.className = 'movie-rating';
        setRatingColor(ratingSpan, movie.vote_average);

        tile.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title || movie.name}" class="movie-poster-img" onerror="this.onerror=null;this.src='/images/error.png';">
            <div class="movie-hover-details">
                <h3>${movie.title || movie.name}</h3>
                <p>${movie.overview ? (movie.overview.length > 100 ? movie.overview.substring(0, 97) + '...' : movie.overview) : 'Описание отсутствует.'}</p>
            </div>
        `;
        tile.insertBefore(ratingSpan, tile.firstChild);

        tile.addEventListener('click', () => openDetailedInfo(movie.tmdb_id, movie.media_type));
        return tile;
    }

    function renderShelf(shelfElement, movies) {
        if (!shelfElement) return;
        const grid = shelfElement.querySelector('.shelf-grid');
        if (!grid) return;
        grid.innerHTML = '';
        movies.forEach(movie => {
            grid.appendChild(createMovieTile(movie));
        });
    }

    function setRatingColor(ratingElement, ratingValue) {
        if (!ratingElement) return; const rating = parseFloat(ratingValue);
        ratingElement.className = 'movie-rating';
        if (isNaN(rating) || rating === 0) { ratingElement.textContent = '–'; ratingElement.style.backgroundColor = '#4a4a4a'; ratingElement.style.color = '#ccc'; return; }
        ratingElement.textContent = `★ ${rating.toFixed(1)}`;
        if (rating < 5) ratingElement.classList.add('rating-red');
        else if (rating < 7) ratingElement.classList.add('rating-gray');
        else ratingElement.classList.add('rating-green');
    }

    // --- Логика для детальной панели ---
    async function openDetailedInfo(tmdbId, mediaType) {
        if (!detailedInfoPanel || tmdbId === undefined || !mediaType) {
             console.error('Панель деталей или ID/тип не найдены', detailedInfoPanel, tmdbId, mediaType);
             return;
        }
        try {
            const response = await fetch(`/api/tmdb/details/${mediaType}/${tmdbId}?language=ru-RU`);
            if (!response.ok) {
                console.error('Ошибка при загрузке деталей:', response.status, await response.text());
                return;
            }
            const data = await response.json();
            if (!data) { console.error('Данные для TMDB ID:', tmdbId, 'не найдены.'); return; }

            if (detailedInfoPoster) detailedInfoPoster.src = data.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_DETAILS}${data.poster_path}` : '/images/default-poster.jpg';
            if (detailedInfoTitle) detailedInfoTitle.textContent = data.title || data.name;
            if (detailedInfoRating) detailedInfoRating.textContent = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
            
            const releaseDate = data.release_date || data.first_air_date;
            if (detailedInfoYear) detailedInfoYear.textContent = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
            
            if (detailedInfoEpisodes && detailedInfoSeasons) {
                if (mediaType === 'tv') {
                    detailedInfoEpisodes.textContent = data.number_of_episodes ? `${data.number_of_episodes} эп.` : '';
                    detailedInfoSeasons.textContent = data.number_of_seasons ? `${data.number_of_seasons} сезон(а/ов)` : '';
                    detailedInfoEpisodes.style.display = data.number_of_episodes ? 'inline-flex' : 'none';
                    detailedInfoSeasons.style.display = data.number_of_seasons ? 'inline-flex' : 'none';
                } else {
                    detailedInfoEpisodes.style.display = 'none';
                    detailedInfoSeasons.style.display = 'none';
                }
            }

            if (detailedInfoGenres) detailedInfoGenres.textContent = data.genres && data.genres.length > 0 ? data.genres.map(g => g.name).join(', ') : 'Жанры не указаны';
            if (detailedInfoOverview) detailedInfoOverview.textContent = data.overview || 'Описание отсутствует.';
            if (detailedInfoBackdrop) {
                detailedInfoBackdrop.style.backgroundImage = data.backdrop_path ? `url(${TMDB_IMAGE_BASE_URL}${BACKDROP_SIZE_DETAILS}${data.backdrop_path})` : 'none';
            }
            
            if(detailedInfoWatchBtn) {
                detailedInfoWatchBtn.dataset.tmdbId = String(data.id);
                detailedInfoWatchBtn.dataset.mediaType = mediaType;
                detailedInfoWatchBtn.onclick = () => window.location.href = `watch.html?tmdbId=${data.id}&type=${mediaType}`;
            }
            
            detailedInfoPanel.classList.add('active');
            document.body.style.overflow = 'hidden';

            detailedInfoTabsContainer?.querySelector('.tab-button.active')?.classList.remove('active');
            detailedInfoTabsContainer?.querySelector('.tab-button[data-tab-target="#tab-about"]')?.classList.add('active');
            detailedInfoTabPanes?.forEach(pane => pane.classList.remove('active'));
            detailedInfoPanel.querySelector('#tab-about')?.classList.add('active');
            const episodesTabButton = detailedInfoTabsContainer?.querySelector('.tab-button[data-tab-target="#tab-episodes"]');
            if (episodesTabButton) episodesTabButton.style.display = mediaType === 'tv' ? 'inline-flex' : 'none';
        } catch (error) { console.error('Ошибка при получении или обработке деталей фильма/сериала:', error); }
    }

    function closeDetailedInfo() {
        if (!detailedInfoPanel) return;
        detailedInfoPanel.classList.remove('active');
        document.body.style.overflow = '';
    }

    detailedInfoCloseBtn?.addEventListener('click', closeDetailedInfo);
    detailedInfoPanel?.addEventListener('click', (event) => { if (event.target === detailedInfoPanel || event.target === detailedInfoBackdrop) closeDetailedInfo(); });
    detailedInfoTabsContainer?.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.tab-button');
        if (!targetButton || targetButton.classList.contains('active')) return;
        detailedInfoTabsContainer.querySelector('.tab-button.active')?.classList.remove('active');
        targetButton.classList.add('active');
        detailedInfoTabPanes?.forEach(pane => pane.classList.remove('active'));
        const targetPaneId = targetButton.dataset.tabTarget;
        if (targetPaneId) detailedInfoPanel.querySelector(targetPaneId)?.classList.add('active');
    });

    // --- Логика поиска и фильтров ---
    if (newSearchButton && newSearchModal) {
        function openSearchModalWindow() {
            if(!newSearchModal) return;
            newSearchModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (genreDropdownMovieMenuElement && genreDropdownMovieMenuElement.querySelectorAll('label').length === 0 && !genreDropdownMovieMenuElement.querySelector('.genres-loading-placeholder')) {
                const placeholder = document.createElement('p');
                placeholder.className = 'genres-loading-placeholder';
                placeholder.textContent = 'Загрузка жанров...';
                placeholder.style.cssText = "padding: 8px 10px; color: #A0A0A0; font-size: 0.9em; font-style: italic;";
                genreDropdownMovieMenuElement.appendChild(placeholder);
                loadAndPopulateAllGenres();
            } else if (allMovieGenresMap.size === 0 && allTvGenresMap.size === 0) {
                loadAndPopulateAllGenres();
            }
        }
        function closeSearchModalWindow() {
            if(!newSearchModal) return;
            newSearchModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        newSearchButton.addEventListener('click', (e) => { e.preventDefault(); openSearchModalWindow(); });
        newSearchModal.addEventListener('click', (e) => { if (e.target === newSearchModal) closeSearchModalWindow(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && newSearchModal?.classList.contains('active')) closeSearchModalWindow(); });
    }

    async function fetchGenresFromServer(type) {
        try {
            const response = await fetch(`/api/tmdb/genres/${type}?language=ru-RU`);
            if (!response.ok) throw new Error(`Ошибка HTTP ${response.status} при загрузке жанров ${type}`);
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error(`Ошибка загрузки жанров для ${type}:`, error);
            const targetMenu = type === 'movie' ? genreDropdownMovieMenuElement : null;
            if (targetMenu) {
                const placeholder = targetMenu.querySelector('.genres-loading-placeholder') || document.createElement('p');
                placeholder.textContent = 'Ошибка загрузки жанров.';
                if(!placeholder.classList.contains('genres-loading-placeholder')) {
                     placeholder.className = 'genres-loading-placeholder';
                     placeholder.style.cssText = "padding: 8px 10px; color: #A0A0A0; font-size: 0.9em; font-style: italic;";
                     if(!targetMenu.querySelector('.genres-loading-placeholder')) targetMenu.appendChild(placeholder);
                }
            }
            return [];
        }
    }

    async function populateGenreDropdown(dropdownMenu, genresData, type, genreMapToPopulate) {
        if (!dropdownMenu) return;
        const placeholder = dropdownMenu.querySelector('.genres-loading-placeholder');
        if (placeholder) placeholder.remove();
        dropdownMenu.innerHTML = '';
        genreMapToPopulate.clear();
        const genres = Array.isArray(genresData) ? genresData : (genresData.genres || []);

        if (!Array.isArray(genres)) {
            console.warn(`Данные жанров для ${type} не являются массивом:`, genres);
            return;
        }

        genres.forEach(genre => {
            if (typeof genre.id !== 'number' || typeof genre.name !== 'string') return;
            genreMapToPopulate.set(genre.id, genre.name);
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            Object.assign(checkbox, { type: 'checkbox', name: 'genre_filter', value: String(genre.id) });
            checkbox.dataset.genreName = genre.name;
            checkbox.addEventListener('change', () => { updateToggleTextForGenres(dropdownMenu.closest('.custom-dropdown')); triggerSearch(); });
            label.append(checkbox, ` ${genre.name}`);
            dropdownMenu.appendChild(label);
        });
    }

    async function loadAndPopulateAllGenres() {
        const [movieGenresData, tvGenresData] = await Promise.all([fetchGenresFromServer('movie'), fetchGenresFromServer('tv')]);
        populateGenreDropdown(genreDropdownMovieMenuElement, movieGenresData, 'movie', allMovieGenresMap);
        allTvGenresMap.clear();
        const tvGenres = Array.isArray(tvGenresData) ? tvGenresData : (tvGenresData.genres || []);
        tvGenres.forEach(genre => { if (typeof genre.id === 'number' && typeof genre.name === 'string') allTvGenresMap.set(genre.id, genre.name); });
        updateToggleTextForGenres(genreDropdownMovieElement);
    }

    function getSelectedGenreIds() {
        return Array.from(genreDropdownMovieMenuElement?.querySelectorAll('input[name="genre_filter"]:checked') || []).map(cb => cb.value);
    }
    
    function triggerSearch() {
        const query = searchInput?.value.trim() || "";
        const selectedGenres = getSelectedGenreIds();
        const yearFrom = yearFromInput?.value.trim() || "";
        const yearTo = yearToInput?.value.trim() || "";
        const ratingFrom = ratingFromInput?.value.trim() || "";
        const ratingTo = ratingToInput?.value.trim() || "";
        const activeMediaTypeCheckbox = document.querySelector('input[name="type_filter"]:checked');
        const activeMediaType = activeMediaTypeCheckbox ? activeMediaTypeCheckbox.value : null;

        if (query.length > 0 || selectedGenres.length > 0 || yearFrom || yearTo || ratingFrom || ratingTo || activeMediaType) {
            clearTimeout(searchTimeout);
            if (loadingIndicator) loadingIndicator.style.display = 'flex';
            if (initialPlaceholder) initialPlaceholder.style.display = 'none';
            clearSearchResults(false);
            searchTimeout = setTimeout(() => {
                performSearch(query, activeMediaType, selectedGenres, yearFrom, yearTo, ratingFrom, ratingTo);
            }, 350);
        } else {
            clearSearchResults(true);
            if (initialPlaceholder) initialPlaceholder.style.display = 'flex';
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }
    
    async function performSearch(query, mediaType, selectedGenreIds, yearFrom, yearTo, ratingFrom, ratingTo) {
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        if (initialPlaceholder) initialPlaceholder.style.display = 'none';

        const params = new URLSearchParams({ language: 'ru-RU', page: 1 });

        if (query) params.append('query', query);
        
        let requestMediaType = mediaType;
        if (!query && !mediaType && (selectedGenreIds.length > 0 || yearFrom || yearTo || ratingFrom || ratingTo)) {
            requestMediaType = 'movie';
        } else if (query && !mediaType) {
            requestMediaType = 'multi';
        }
        if (requestMediaType) params.append('media_type', requestMediaType);

        if (selectedGenreIds && selectedGenreIds.length > 0) params.append('genres', selectedGenreIds.join(','));
        if (yearFrom) params.append('year_from', yearFrom);
        if (yearTo) params.append('year_to', yearTo);
        if (ratingFrom) params.append('rating_from', ratingFrom);
        if (ratingTo) params.append('rating_to', ratingTo);
        
        const fullUrl = `/api/tmdb/search?${params.toString()}`;
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Ошибка HTTP: ${response.status}` }));
                throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            displayResults(data.results || [], params.get('media_type') || (query ? 'multi' : 'movie'));
        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
            displayError(error.message);
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    if (searchInput) searchInput.addEventListener('input', triggerSearch);
    [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(input => {
        input?.addEventListener('input', triggerSearch); input?.addEventListener('change', triggerSearch);
    });
    typeFilterCheckboxes?.forEach(checkbox => checkbox.addEventListener('change', () => {
        if (checkbox.checked) typeFilterCheckboxes.forEach(cb => { if (cb !== checkbox) cb.checked = false; });
        updateToggleTextForDropdown(typeDropdownElement, "Выберите тип"); triggerSearch();
    }));

    if(resetFiltersButton) resetFiltersButton.addEventListener('click', () => {
        if(searchInput) searchInput.value = '';
        typeFilterCheckboxes?.forEach(cb => cb.checked = false);
        if(typeDropdownElement) updateToggleTextForDropdown(typeDropdownElement, "Выберите тип");
        genreDropdownMovieMenuElement?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        if(genreDropdownMovieElement) updateToggleTextForGenres(genreDropdownMovieElement);
        [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(input => { if(input) input.value = ''; });
        clearSearchResults(true); if (initialPlaceholder) initialPlaceholder.style.display = 'flex'; if (loadingIndicator) loadingIndicator.style.display = 'none';
    });

    function displayResults(items, searchedMediaTypeContext) {
        clearSearchResults(false); if(!searchResultsContainer) return;
        const resultsGrid = document.createElement('div'); resultsGrid.className = 'search-results-grid';
        if (!items || items.length === 0) {
            const hasActiveFilters = searchInput?.value.trim().length > 0 || getSelectedGenreIds().length > 0 || yearFromInput?.value.trim() || yearToInput?.value.trim() || ratingFromInput?.value.trim() || ratingToInput?.value.trim() || document.querySelector('input[name="type_filter"]:checked');
            resultsGrid.innerHTML = hasActiveFilters ? '<p class="no-results">По вашему запросу ничего не найдено.</p>' : (initialPlaceholder ? (initialPlaceholder.style.display = 'flex', '') : '');
        } else {
            items.forEach((item, index) => {
                let mediaType = item.media_type;
                if (!mediaType) { 
                    mediaType = searchedMediaTypeContext !== 'multi' ? searchedMediaTypeContext : (item.title ? 'movie' : 'tv');
                }
                if (mediaType === 'person') return;

                const title = item.title || item.name;
                const releaseDate = item.release_date || item.first_air_date;
                const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_SEARCH}${item.poster_path}` : '/images/default-poster.jpg';
                let overview = item.overview || 'Описание отсутствует.'; if (overview.length > 100) overview = overview.substring(0, 97) + '...';
                const voteAverage = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                const currentGenreMap = mediaType === 'tv' ? allTvGenresMap : allMovieGenresMap;
                let genreNames = item.genre_ids?.map(id => currentGenreMap.get(parseInt(id, 10))).filter(Boolean).join(', ') || 'Жанры не указаны';
                if (genreNames === 'Жанры не указаны' && item.genre_ids?.length > 0 && currentGenreMap.size === 0) genreNames = 'Загрузка названий жанров...';

                const itemElement = document.createElement('div'); itemElement.className = 'search-result-item';
                itemElement.innerHTML = `
                    <img src="${posterPath}" alt="${title}" class="search-result-poster" onerror="this.onerror=null;this.src='/images/error.png';">
                    <div class="search-result-details">
                        <div class="search-result-main-info">
                            <h3 class="search-result-title">${title}</h3>
                            <p class="search-result-meta">
                                <span class="search-result-year">${year}</span>
                                <span class="search-result-type">${mediaType === 'movie' ? 'Фильм' : (mediaType === 'tv' ? 'Сериал' : '')}</span>
                                <span class="search-result-rating"><i class="fas fa-star"></i> ${voteAverage}</span>
                            </p>
                            <p class="search-result-genres">${genreNames}</p>
                        </div>
                        <p class="search-result-overview">${overview}</p>
                        <a href="watch.html?tmdbId=${item.id}&type=${mediaType}" class="action-button search-result-watch-btn"><i class="fas fa-play"></i> Смотреть</a>
                    </div>`;
                resultsGrid.appendChild(itemElement);
                requestAnimationFrame(() => setTimeout(() => itemElement.classList.add('visible'), index * 50));
            });
        }
        searchResultsContainer.querySelector('.search-results-grid')?.remove();
        searchResultsContainer.appendChild(resultsGrid);
    }
    function displayError(message) {
        clearSearchResults(false); if(!searchResultsContainer) return;
        const errorElement = document.createElement('p'); errorElement.className = 'search-error-message'; errorElement.textContent = `Ошибка: ${message}`;
        searchResultsContainer.querySelector('.search-results-grid')?.remove(); searchResultsContainer.appendChild(errorElement);
        if (loadingIndicator) loadingIndicator.style.display = 'none'; if (initialPlaceholder) initialPlaceholder.style.display = 'none';
    }
    function clearSearchResults(showPlaceholder = true) {
        if (!searchResultsContainer) return;
        searchResultsContainer.querySelector('.search-results-grid')?.remove();
        searchResultsContainer.querySelector('.search-error-message')?.remove();
        if (initialPlaceholder) initialPlaceholder.style.display = showPlaceholder ? 'flex' : 'none';
    }

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
        // const dropdownMenu = dropdown.querySelector('.dropdown-menu'); // Уже объявлен выше
        toggleButton?.addEventListener('click', (event) => {
            event.stopPropagation();
            const currentlyOpen = dropdown.classList.contains('open');
            document.querySelectorAll('.search-modal-sidebar .custom-dropdown.open').forEach(od => { if (od !== dropdown) od.classList.remove('open');});
            dropdown.classList.toggle('open', !currentlyOpen);
            if (!currentlyOpen && dropdown.dataset.dropdownId === 'genres-movie' && genreDropdownMovieMenuElement && genreDropdownMovieMenuElement.querySelectorAll('label').length === 0 && !genreDropdownMovieMenuElement.querySelector('.genres-loading-placeholder')) {
                const placeholder = document.createElement('p'); placeholder.className = 'genres-loading-placeholder'; placeholder.textContent = 'Загрузка жанров...';
                placeholder.style.cssText = "padding: 8px 10px; color: #A0A0A0; font-size: 0.9em; font-style: italic;";
                genreDropdownMovieMenuElement.appendChild(placeholder); loadAndPopulateAllGenres();
            }
        });
    });
    function updateToggleTextForDropdown(dropdownElement, defaultText) {
        if (!dropdownElement) return; const textElement = dropdownElement.querySelector('.dropdown-toggle span'); if (!textElement) return;
        const selectedTexts = Array.from(dropdownElement.querySelectorAll('.dropdown-menu input[type="checkbox"]:checked')).map(cb => cb.dataset.genreName || cb.labels[0].textContent.trim() || cb.value);
        if (selectedTexts.length > 0) {
            const maxNames = dropdownElement.dataset.dropdownId === "genres-movie" ? 2 : 1;
            textElement.textContent = selectedTexts.length <= maxNames ? selectedTexts.join(', ') : `${selectedTexts.length} выбрано`;
        } else textElement.textContent = defaultText;
    }
    function updateToggleTextForGenres(dropdownElement) {
        if (!dropdownElement) return; const menu = dropdownElement.querySelector('.dropdown-menu'); const toggleSpan = dropdownElement.querySelector('.dropdown-toggle span'); if (!toggleSpan) return;
        if (menu?.querySelector('.genres-loading-placeholder')) toggleSpan.textContent = "Загрузка жанров...";
        else if (menu?.querySelectorAll('label').length === 0 && !menu?.querySelector('.genres-loading-placeholder')) toggleSpan.textContent = "Жанры не найдены";
        else updateToggleTextForDropdown(dropdownElement, "Выберите жанр(ы)");
    }
    document.querySelectorAll('.number-input-container').forEach(container => {
        const input = container.querySelector('input[type="number"]'); const upArrow = container.querySelector('.up-arrow'); const downArrow = container.querySelector('.down-arrow');
        if (input && upArrow && downArrow) {
            upArrow.addEventListener('click', () => { input.stepUp(); input.dispatchEvent(new Event('input', { bubbles: true })); });
            downArrow.addEventListener('click', () => { input.stepDown(); input.dispatchEvent(new Event('input', { bubbles: true })); });
        }
    });

    // --- Инициализация ---
    loadAndDisplayHeroContent();
    updateUserProfileDisplay();
    if (popularShelf) renderShelf(popularShelf, placeholderMovies);
    if (nowPlayingShelf) renderShelf(nowPlayingShelf, placeholderMovies.slice(0, 5).reverse());
    handlePopularSectionVisibility();
    window.addEventListener('scroll', handlePopularSectionVisibility, { passive: true });

    if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
    navbarButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            navbarButtons.forEach(btn => btn.classList.remove('active')); this.classList.add('active');
            const sectionId = this.dataset.section; const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                const navbarHeight = navbar?.offsetHeight || 0;
                let offsetTop = targetSection.offsetTop - navbarHeight;
                if (sectionId === 'popular' && contentArea) {
                     offsetTop = contentArea.offsetTop - navbarHeight;
                     if (offsetTop < 0) offsetTop = 0;
                }
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

}); // Конец DOMContentLoaded
