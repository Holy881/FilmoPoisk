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
        { id: 3, tmdb_id: 299536, media_type: 'movie', title: 'Мстители: Война бесконечности', name: 'Мстители: Война бесконечности', poster_path: '/mQsM262K0X2pIF01p50Xm7ie0jV.jpg', vote_average: 8.25, overview: 'Пока Мстители и их союзники продолжают защищать мир от различных опасностей, с которыми не смог бы справиться один супергерой, новая угроза возникает из космоса: Танос. Межгалактический тиран преследует цель собрать все шесть Камней Бесконечности — артефакты невероятной силы, с помощью которых можно менять реальность по своему желанию. Всё, с чем Мстители сталкивались ранее, вело к этому моменту — судьба Земли и всего существующего никогда ещё не была так непредсказуема.', release_date: '2018-04-25', first_air_date: null, genres: [{id: 12, name: 'Приключения'}, {id: 28, name: 'Боевик'}, {id: 878, name: 'Фантастика'}], number_of_episodes: null, number_of_seasons: null },
        { id: 4, tmdb_id: 157336, media_type: 'movie', title: 'Интерстеллар', name: 'Интерстеллар', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', vote_average: 8.4, overview: 'Когда засуха приводит человечество к продовольственному кризису, коллектив исследователей и учёных отправляется сквозь червоточину (которая предположительно соединяет области пространства-времени через большое расстояние) в путешествие, чтобы превзойти прежние ограничения для космических путешествий человека и найти планету с подходящими для человечества условиями.', release_date: '2014-11-05', first_air_date: null, genres: [{id: 12, name: 'Приключения'}, {id: 18, name: 'Драма'}, {id: 878, name: 'Фантастика'}], number_of_episodes: null, number_of_seasons: null },
        { id: 5, tmdb_id: 522627, media_type: 'movie', title: 'Джентльмены', name: 'Джентльмены', poster_path: '/jG52060hZ2Z13cfYc02D07y6pps.jpg', vote_average: 7.7, overview: 'Один очень умный выпускник Оксфорда придумал нелегальную схему обогащения на поместьях обедневшей британской аристократии. Но когда он решает продать свой бизнес влиятельному клану миллиардеров из США, на его пути встают не менее обаятельные, но жёсткие джентльмены.', release_date: '2019-12-03', first_air_date: null, genres: [{id: 28, name: 'Боевик'}, {id: 35, name: 'Комедия'}, {id: 80, name: 'Криминал'}], number_of_episodes: null, number_of_seasons: null },
        { id: 6, tmdb_id: 680, media_type: 'movie', title: 'Криминальное чтиво', name: 'Криминальное чтиво', poster_path: '/9VqZ3Yeling8oAhG7q4CVK83z3s.jpg', vote_average: 8.5, overview: 'Двое бандитов Винсент Вега и Джулс Винфилд ведут философские беседы в перерывах между разборками и решением проблем с должниками криминального босса Марселласа Уоллеса.', release_date: '1994-09-10', first_air_date: null, genres: [{id: 53, name: 'Триллер'}, {id: 80, name: 'Криминал'}], number_of_episodes: null, number_of_seasons: null },
        { id: 7, tmdb_id: 13, media_type: 'movie', title: 'Форрест Гамп', name: 'Форрест Гамп', poster_path: '/saHP97rTPS5eLmrHHqup634AhaK.jpg', vote_average: 8.5, overview: 'Сидя на автобусной остановке, Форрест Гамп — не очень умный, но добрый и открытый парень — рассказывает случайным попутчикам историю своей необыкновенной жизни.', release_date: '1994-06-23', first_air_date: null, genres: [{id: 35, name: 'Комедия'}, {id: 18, name: 'Драма'}, {id: 10749, name: 'Мелодрама'}], number_of_episodes: null, number_of_seasons: null },
        { id: 8, tmdb_id: 278, media_type: 'movie', title: 'Побег из Шоушенка', name: 'Побег из Шоушенка', poster_path: '/sBEBQCn6AU17NBw3fz2qsUj3R23.jpg', vote_average: 8.7, overview: 'Бухгалтер Энди Дюфрейн обвинён в убийстве собственной жены и её любовника. Оказавшись в тюрьме под названием Шоушенк, он сталкивается со всеми ужасами тюремной жизни.', release_date: '1994-09-23', first_air_date: null, genres: [{id: 18, name: 'Драма'}, {id: 80, name: 'Криминал'}], number_of_episodes: null, number_of_seasons: null },
        { id: 9, tmdb_id: 1416, media_type: 'tv', title: 'Атака титанов', name: 'Атака титанов', poster_path: '/hTP1M40IOF93zQ4X32h2VdC0H3G.jpg', vote_average: 8.6, overview: 'С тех пор, как человечество было почти уничтожено гигантскими гуманоидами, называемыми титанами, прошло сто лет. Титаны обычно имеют несколько этажей в высоту, кажутся неразумными, пожирают людей и, что хуже всего, делают это ради удовольствия, а не как источник пищи.', release_date: null, first_air_date: '2013-04-07', genres: [{id: 10765, name: 'Sci-Fi & Fantasy'}, {id: 16, name: 'Анимация'}, {id: 10759, name: 'Action & Adventure'}], number_of_episodes: 89, number_of_seasons: 4 },
        { id: 10, tmdb_id: 60625, media_type: 'tv', title: 'Ванпанчмен', name: 'Ванпанчмен', poster_path: '/mzzh978T3DO2USc1g8hS05b2j2.jpg', vote_average: 8.4, overview: 'История о Сайтаме, обычном парне, который стал супергероем от скуки. После трёх лет «специальных» тренировок он стал настолько сильным, что может победить любого противника одним ударом.', release_date: null, first_air_date: '2015-10-05', genres: [{id: 10759, name: 'Action & Adventure'}, {id: 16, name: 'Анимация'}, {id: 35, name: 'Комедия'}, {id: 10765, name: 'Sci-Fi & Fantasy'}], number_of_episodes: 24, number_of_seasons: 2 },
        { id: 11, tmdb_id: 71912, media_type: 'tv', title: 'Ведьмак', name: 'Ведьмак', poster_path: '/rY2c2LhN07CRKlAbRaDZxN2XjvK.jpg', vote_average: 8.1, overview: 'Геральт из Ривии, наёмный охотник на чудовищ, перенёсший мутации, идёт навстречу своей судьбе в неспокойном мире, где люди часто оказываются куда хуже чудовищ.', release_date: null, first_air_date: '2019-12-20', genres: [{id: 18, name: 'Драма'}, {id: 10759, name: 'Action & Adventure'}, {id: 10765, name: 'Sci-Fi & Fantasy'}], number_of_episodes: 24, number_of_seasons: 3 },
        { id: 12, tmdb_id: 456, media_type: 'movie', title: 'Аватар', name: 'Аватар', poster_path: '/jRXYjXNq0Cs2TcYVbL9qPqHqrA1.jpg', vote_average: 7.5, overview: 'Джейк Салли — бывший морской пехотинец, прикованный к инвалидному креслу. Несмотря на немощное тело, Джейк в душе по-прежнему остается воином. Он получает задание совершить путешествие в несколько световых лет к базе землян на планете Пандора, где корпорации добывают редкий минерал, имеющий огромное значение для выхода Земли из энергетического кризиса.', release_date: '2009-12-10', first_air_date: null, genres: [{id: 28, name: 'Боевик'}, {id: 12, name: 'Приключения'}, {id: 14, name: 'Фэнтези'}, {id: 878, name: 'Фантастика'}], number_of_episodes: null, number_of_seasons: null },
        { id: 13, tmdb_id: 76600, media_type: 'movie', title: 'Аватар: Путь воды', name: 'Аватар: Путь воды', poster_path: '/z5mkvXY3sV0Xo23A0MttYaK2m2j.jpg', vote_average: 7.7, overview: 'После принятия образа аватара солдат Джейк Салли становится предводителем народа на`ви и берет на себя миссию по защите новых друзей от корыстных бизнесменов с Земли. Теперь ему есть за кого бороться — с Джейком его прекрасная возлюбленная Нейтири. Когда на Пандору возвращаются до зубов вооруженные земляне, Джейк готов дать им отпор.', release_date: '2022-12-14', first_air_date: null, genres: [{id: 878, name: 'Фантастика'}, {id: 12, name: 'Приключения'}, {id: 28, name: 'Боевик'}], number_of_episodes: null, number_of_seasons: null },
        { id: 14, tmdb_id: 634649, media_type: 'movie', title: 'Человек-паук: Нет пути домой', name: 'Человек-паук: Нет пути домой', poster_path: '/uJYYizSuA9Y3DCs0qS4qWvHfZg4.jpg', vote_average: 8.0, overview: 'Впервые в киноистории Человека-паука наш дружелюбный герой разоблачен. Теперь супергеройские подвиги стали неотделимы от его обычной жизни. Когда он просит помощи у Доктора Стрэнджа, ситуация только усугубляется. И Питер Паркер должен как никогда раньше ощутить, что значит быть Человеком-пауком.', release_date: '2021-12-15', first_air_date: null, genres: [{id: 28, name: 'Боевик'}, {id: 12, name: 'Приключения'}, {id: 878, name: 'Фантастика'}], number_of_episodes: null, number_of_seasons: null },
        { id: 15, tmdb_id: 82856, media_type: 'tv', title: 'Мандалорец', name: 'Мандалорец', poster_path: '/eU1i6eGhhk3A12oE7Fq289Xo1n8.jpg', vote_average: 8.4, overview: 'Одинокий мандалорец-наёмник живёт на краю обитаемой галактики, куда не дотягивается закон Новой Республики. Представитель некогда могучей расы благородных воинов теперь вынужден влачить жалкое существование среди отбросов общества.', release_date: null, first_air_date: '2019-11-12', genres: [{id: 10765, name: 'Sci-Fi & Fantasy'}, {id: 10759, name: 'Action & Adventure'}], number_of_episodes: 24, number_of_seasons: 3 }
    ];
    const EXCLUDED_TV_GENRE_IDS = [10767, 10764, 10763, 10766]; // ID для "Talk Show" и "Reality"

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

    // Функция для полки "Онгоинги" (сериалы со статусом "Returning Series")
    async function fetchAndRenderOngoingSeriesShelf(shelfElement, count = 15) {
        if (!shelfElement) return;
        console.log('Запрос онгоингов (Returning Series)...');
        let candidates = [];
        let returningSeries = [];

        try {
            // 1. Получаем 2 страницы популярных сценарийных сериалов как кандидатов
            const popularTvResponses = await Promise.all([
                fetch(`/api/tmdb/search?media_type=tv&sort_by=popularity.desc&page=1&with_types=4&rating_from=6.0`), // Смягчим немного рейтинг для начального пула
                fetch(`/api/tmdb/search?media_type=tv&sort_by=popularity.desc&page=2&with_types=4&rating_from=6.0`)
            ]);

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
            
            // Убираем дубликаты, если они есть (маловероятно при запросе разных страниц)
            const uniqueCandidates = Array.from(new Map(candidates.map(item => [item.id, item])).values());
            console.log(`Кандидатов для проверки на "Returning Series": ${uniqueCandidates.length}`);

            if (uniqueCandidates.length === 0) {
                console.warn('Нет кандидатов для проверки на "Returning Series".');
                renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv' && m.id === 9).slice(0, 1));
                return;
            }
            
            const detailPromises = uniqueCandidates.map(tvShow => 
                fetch(`/api/tmdb/details/tv/${tvShow.id}?language=ru-RU`)
                    .then(res => {
                        if (!res.ok) {
                            console.warn(`Ошибка при запросе деталей для TV ID ${tvShow.id}: ${res.status}`);
                            return null; // Пропустить этот сериал в случае ошибки
                        }
                        return res.json();
                    })
                    .catch(err => {
                        console.error(`Ошибка сети при запросе деталей для TV ID ${tvShow.id}:`, err);
                        return null; // Пропустить этот сериал
                    })
            );

            const detailedResults = await Promise.allSettled(detailPromises);

            detailedResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    const tvDetails = result.value;
                    if (tvDetails.status === 'Returning Series' && 
                        tvDetails.vote_average >= 6.5 && 
                        tvDetails.popularity >= 20 && // Порог популярности для онгоингов
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
                            genre_ids: tvDetails.genre_ids || [],
                            popularity: tvDetails.popularity
                        });
                    }
                }
            });
            
            console.log(`Найдено "Returning Series" после всех фильтров: ${returningSeries.length}`);

            // Сортируем по популярности на всякий случай, т.к. детали могли прийти не по порядку
            returningSeries.sort((a, b) => b.popularity - a.popularity);
            
            const seriesToDisplay = returningSeries.slice(0, count);

            if (seriesToDisplay.length > 0) {
                renderShelf(shelfElement, seriesToDisplay);
            } else {
                console.warn('Не найдено "Returning Series", соответствующих критериям. Отображение заглушек.');
                renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv' && m.id === 2).slice(0, 1)); 
            }

        } catch (error) {
            console.error('Общая ошибка при загрузке полки "Онгоинги":', error);
            renderShelf(shelfElement, placeholderMovies.filter(m => m.media_type === 'tv' && m.id === 11).slice(0, 1)); 
        }
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
            if (rating < 5) {
                targetElement.classList.add('rating-red');
            } else if (rating < 7) {
                targetElement.classList.add('rating-gray');
            } else {
                targetElement.classList.add('rating-green');
            }
        }
    }

    function renderSeasonsDisplay(seasonsDetails, parentContainer, tvId, mediaType) {
        parentContainer.innerHTML = '';

        if (!seasonsDetails || seasonsDetails.length === 0) {
            parentContainer.innerHTML = '<p>Информация о сезонах не найдена.</p>';
            return;
        }

        const seasonsGrid = document.createElement('div');
        seasonsGrid.className = 'seasons-grid';

        seasonsDetails.forEach((season, index) => {
            if (season.season_number === 0 && !season.poster_path) {
                return;
            }
            if (!season || typeof season.season_number === 'undefined') {
                return;
            }

            const seasonCard = document.createElement('div');
            seasonCard.className = 'season-card';

            const posterPath = season.poster_path
                ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_SEASON_CARD}${season.poster_path}`
                : '/images/default-poster.jpg';

            const episodeCount = season.episode_count || (season.episodes ? season.episodes.length : 0);

            seasonCard.innerHTML = `
                <img src="${posterPath}" alt="${season.name || `Сезон ${season.season_number}`}" class="season-poster-img" onerror="this.onerror=null;this.src='/images/error.png';">
                <div class="season-info">
                    <h4 class="season-title">${season.name || `Сезон ${season.season_number}`}</h4>
                    <p class="season-episode-count">${episodeCount} серий</p>
                </div>
            `;

            seasonsGrid.appendChild(seasonCard);
            requestAnimationFrame(() => {
                setTimeout(() => {
                    seasonCard.classList.add('visible');
                }, index * 100);
            });
        });
        parentContainer.appendChild(seasonsGrid);
    }

    const populatePanelData = (itemData, itemMediaType) => {
        if (!detailedInfoPanel) return;
        if (detailedInfoTitle) detailedInfoTitle.textContent = itemData.title || itemData.name;
        if (detailedInfoRatingDisplay) applyRatingStyles(detailedInfoRatingDisplay, itemData.vote_average);

        const itemReleaseDate = itemData.release_date || itemData.first_air_date;
        if (detailedInfoYear) detailedInfoYear.textContent = itemReleaseDate ? new Date(itemReleaseDate).getFullYear() : 'N/A';

        if (detailedInfoEpisodes) {
            if (itemMediaType === 'tv' && itemData.number_of_episodes) {
                detailedInfoEpisodes.textContent = `${itemData.number_of_episodes} эп.`;
                detailedInfoEpisodes.style.display = 'inline-flex';
            } else {
                detailedInfoEpisodes.textContent = '';
                detailedInfoEpisodes.style.display = 'none';
            }
        }
        if (detailedInfoSeasons) {
            if (itemMediaType === 'tv' && itemData.number_of_seasons) {
                detailedInfoSeasons.textContent = `${itemData.number_of_seasons} с.`;
                detailedInfoSeasons.style.display = 'inline-flex';
            } else {
                detailedInfoSeasons.textContent = '';
                detailedInfoSeasons.style.display = 'none';
            }
        }

        let itemAgeRatingText = '';
        if (itemData.content_ratings && itemData.content_ratings.results) {
            const ruRating = itemData.content_ratings.results.find(r => r.iso_3166_1 === 'RU');
            if (ruRating && ruRating.rating) itemAgeRatingText = ruRating.rating;
        } else if (itemData.release_dates && itemData.release_dates.results && !itemAgeRatingText) {
             const ruRelease = itemData.release_dates.results.find(r => r.iso_3166_1 === 'RU');
             if (ruRelease && ruRelease.release_dates && ruRelease.release_dates.length > 0) {
                 const cert = ruRelease.release_dates.find(rd => rd.certification && rd.certification !== "");
                 if (cert) itemAgeRatingText = cert.certification;
             }
        }
        if (detailedInfoAgeRating) {
            if (itemAgeRatingText) {
                detailedInfoAgeRating.textContent = itemAgeRatingText;
                detailedInfoAgeRating.style.display = 'inline-flex';
            } else {
                detailedInfoAgeRating.textContent = '';
                detailedInfoAgeRating.style.display = 'none';
            }
        }

        if (detailedInfoGenres) detailedInfoGenres.textContent = itemData.genres && itemData.genres.length > 0 ? itemData.genres.map(g => g.name).join(', ') : 'Жанры не указаны';
        if (detailedInfoOverview) detailedInfoOverview.textContent = itemData.overview || 'Описание отсутствует.';
        if(detailedInfoWatchBtn) {
            detailedInfoWatchBtn.dataset.tmdbId = String(itemData.id);
            detailedInfoWatchBtn.dataset.mediaType = itemMediaType;
            detailedInfoWatchBtn.onclick = () => window.location.href = `watch.html?tmdbId=${itemData.id}&type=${itemMediaType}`;
        }
        if (detailedInfoBackdropImage) {
            detailedInfoBackdropImage.src = itemData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${BACKDROP_SIZE_DETAILS_LARGE}${itemData.backdrop_path}` : 'https://placehold.co/1280x720/0c0c0c/111111?text=Нет+изображения';
            detailedInfoBackdropImage.alt = `Задник для ${itemData.title || itemData.name}`;
        }

        detailedInfoPanel.dataset.currentTmdbId = String(itemData.id);

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
                if (itemData.all_season_details && itemData.all_season_details.length > 0) {
                    renderSeasonsDisplay(itemData.all_season_details, episodesTabPane, itemData.id, itemMediaType);
                } else if (itemData.seasons && itemData.seasons.length > 0) {
                    const fallbackSeasonsData = itemData.seasons.map(s => ({
                        ...s,
                        episode_count: s.episode_count || 0,
                        poster_path: s.poster_path || null
                    }));
                    renderSeasonsDisplay(fallbackSeasonsData, episodesTabPane, itemData.id, itemMediaType);
                }
                else {
                    episodesTabPane.innerHTML = '<p>Для данного сериала нет информации о сезонах.</p>';
                }
            } else {
                episodesTabButton.style.display = 'none';
                episodesTabPane.innerHTML = '<p>Сезоны и серии доступны только для сериалов.</p>';
            }
        } else if (episodesTabButton) {
            episodesTabButton.style.display = 'none';
        }
    };

    async function openDetailedInfo(tmdbId, mediaType, clickedTileElement) {
        if (!detailedInfoPanel || !clickedTileElement) {
            console.error('Панель деталей или кликнутый элемент не найдены');
            return;
        }

        const newParentShelf = clickedTileElement.closest('.movie-shelf');
        if (!newParentShelf) {
            console.error('Родительская полка для кликнутой плитки не найдена.');
            return;
        }

        const isAlreadyOpen = detailedInfoPanel.classList.contains('expanded');
        const isSameTile = currentActiveMovieTile === clickedTileElement;

        if (isAlreadyOpen && isSameTile) {
            await closeDetailedInfo();
            return;
        }

        if (isAlreadyOpen) {
            if (currentActiveMovieTile) {
                currentActiveMovieTile.classList.remove('active-tile-details');
            }
            clickedTileElement.classList.add('active-tile-details');
            currentActiveMovieTile = clickedTileElement;

            try {
                const response = await fetch(`/api/tmdb/details/${mediaType}/${tmdbId}?language=ru-RU`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ status_message: `Ошибка HTTP: ${response.status}` }));
                    throw new Error(errorData.status_message || `Ошибка HTTP: ${response.status}`);
                }
                const data = await response.json();
                if (!data) throw new Error('Данные не получены.');

                const needsMove = (currentlyOpenShelfForDetails !== newParentShelf);

                if (needsMove) {
                    detailedInfoPanel.style.transition = 'opacity 0.15s ease-out';
                    detailedInfoPanel.style.opacity = '0';
                    await new Promise(resolve => setTimeout(resolve, 150));

                    newParentShelf.after(detailedInfoPanel);
                    populatePanelData(data, mediaType);
                    currentlyOpenShelfForDetails = newParentShelf;

                    detailedInfoPanel.style.opacity = '1';
                } else {
                    if (detailedInfoContentWrapper) {
                        detailedInfoContentWrapper.style.transition = 'opacity 0.2s ease-out';
                        detailedInfoContentWrapper.style.opacity = '0';
                        await new Promise(resolve => setTimeout(resolve, 200));
                        populatePanelData(data, mediaType);
                        detailedInfoContentWrapper.style.opacity = '1';
                    } else {
                        populatePanelData(data, mediaType);
                    }
                }
                const navbarHeight = navbar?.offsetHeight || 0;
                const panelRect = detailedInfoPanel.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const panelTopAbsolute = panelRect.top + scrollTop;
                window.scrollTo({ top: panelTopAbsolute - navbarHeight - 10, behavior: 'smooth' });

            } catch (error) {
                console.error('Ошибка при обновлении деталей в открытой панели:', error);
            }
        } else {
            try {
                const response = await fetch(`/api/tmdb/details/${mediaType}/${tmdbId}?language=ru-RU`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ status_message: `Ошибка HTTP: ${response.status}` }));
                    throw new Error(errorData.status_message || `Ошибка HTTP: ${response.status}`);
                }
                const data = await response.json();
                if (!data) throw new Error('Данные не получены.');

                populatePanelData(data, mediaType);
                newParentShelf.after(detailedInfoPanel);

                if (currentActiveMovieTile) {
                    currentActiveMovieTile.classList.remove('active-tile-details');
                }
                clickedTileElement.classList.add('active-tile-details');
                currentActiveMovieTile = clickedTileElement;

                detailedInfoPanel.style.display = 'block';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        detailedInfoPanel.classList.add('expanded');
                        currentlyOpenShelfForDetails = newParentShelf;

                        const navbarHeight = navbar?.offsetHeight || 0;
                        const panelRect = detailedInfoPanel.getBoundingClientRect();
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        const panelTopAbsolute = panelRect.top + scrollTop;
                        window.scrollTo({ top: panelTopAbsolute - navbarHeight - 10, behavior: 'smooth' });
                    });
                });
            } catch (error) {
                console.error('Ошибка при открытии и загрузке деталей:', error);
            }
        }
    }

    function closeDetailedInfo() {
        return new Promise((resolve) => {
            if (!detailedInfoPanel || !detailedInfoPanel.classList.contains('expanded')) {
                resolve();
                return;
            }

            if (currentActiveMovieTile) {
                currentActiveMovieTile.classList.remove('active-tile-details');
                currentActiveMovieTile = null;
            }

            detailedInfoPanel.classList.remove('expanded');
            currentlyOpenShelfForDetails = null;
            delete detailedInfoPanel.dataset.currentTmdbId;

            const onTransitionEnd = (event) => {
                if (event.target === detailedInfoPanel && event.propertyName === 'opacity') {
                    if (!detailedInfoPanel.classList.contains('expanded')) {
                       detailedInfoPanel.style.display = 'none';
                    }
                    detailedInfoPanel.removeEventListener('transitionend', onTransitionEnd);
                    resolve();
                }
            };
            detailedInfoPanel.addEventListener('transitionend', onTransitionEnd);

            setTimeout(() => {
                if (detailedInfoPanel.style.display !== 'none' && !detailedInfoPanel.classList.contains('expanded')) {
                    detailedInfoPanel.style.display = 'none';
                    detailedInfoPanel.removeEventListener('transitionend', onTransitionEnd);
                }
                resolve();
            }, 350); 
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

        if (currentActiveTabPane && currentActiveTabPane !== targetPane) {
            currentActiveTabPane.classList.remove('active');
        }
        if (targetPane) {
            targetPane.classList.add('active');
            currentActiveTabPane = targetPane;
            if (targetPane.id === 'tab-episodes-details') {
                const seasonCards = targetPane.querySelectorAll('.season-card:not(.visible)');
                seasonCards.forEach((card, index) => {
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            card.classList.add('visible');
                        }, index * 75);
                    });
                });
            }
        }
    });

    function updateShelfControls(shelfElement) {
        const gridWrapper = shelfElement.querySelector('.shelf-grid-wrapper');
        const grid = shelfElement.querySelector('.shelf-grid');
        const prevArrow = shelfElement.querySelector('.prev-arrow');
        const nextArrow = shelfElement.querySelector('.next-arrow');

        if (!gridWrapper || !grid || !prevArrow || !nextArrow) {
            if (prevArrow) prevArrow.classList.remove('visible');
            if (nextArrow) nextArrow.classList.remove('visible');
            if (gridWrapper) {
                gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll');
            }
            return;
        }

        requestAnimationFrame(() => {
            const scrollLeft = Math.round(grid.scrollLeft);
            const scrollWidth = grid.scrollWidth;
            const clientWidth = grid.clientWidth;
            const childrenCount = grid.children.length;

            if (childrenCount === 0) {
                prevArrow.classList.remove('visible');
                nextArrow.classList.remove('visible');
                gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll');
                return;
            }
            
            const canScrollLeft = scrollLeft > 1; 
            const canScrollRight = (scrollWidth - clientWidth - scrollLeft) > 1;

            prevArrow.classList.toggle('visible', canScrollLeft);
            nextArrow.classList.toggle('visible', canScrollRight);

            gridWrapper.classList.toggle('has-prev-scroll', canScrollLeft);
            gridWrapper.classList.toggle('has-next-scroll', canScrollRight);
        });
    }

    function initShelves() {
        document.querySelectorAll('.movie-shelf').forEach(shelfElement => {
            const gridWrapper = shelfElement.querySelector('.shelf-grid-wrapper');
            const grid = shelfElement.querySelector('.shelf-grid');
            const prevArrow = shelfElement.querySelector('.prev-arrow');
            const nextArrow = shelfElement.querySelector('.next-arrow');

            if (!gridWrapper || !grid || !prevArrow || !nextArrow) {
                console.warn('Не найдены все необходимые элементы для полки:', shelfElement);
                return;
            }

            prevArrow.classList.remove('visible');
            nextArrow.classList.remove('visible');
            gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll');

            const getScrollAmount = () => {
                const firstTile = grid.querySelector('.movie-tile');
                if (firstTile) {
                    const tileWidth = firstTile.offsetWidth;
                    const gap = parseFloat(getComputedStyle(grid).gap) || 15;
                    return tileWidth + gap;
                }
                return grid.clientWidth * 0.8; 
            };

            prevArrow.addEventListener('click', () => {
                grid.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            });

            nextArrow.addEventListener('click', () => {
                grid.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            });

            const observerCallback = (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            updateShelfControls(shelfElement);
                        }, 200); 
                    } else {
                        prevArrow.classList.remove('visible');
                        nextArrow.classList.remove('visible');
                        gridWrapper.classList.remove('has-prev-scroll', 'has-next-scroll');
                    }
                });
            };
            
            const shelfObserver = new IntersectionObserver(observerCallback, { threshold: 0.01 }); 
            shelfObserver.observe(shelfElement);

            grid.addEventListener('scroll', () => updateShelfControls(shelfElement), { passive: true });
            window.addEventListener('resize', () => updateShelfControls(shelfElement), { passive: true });
        });
    }

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

    if (searchInput) { searchInput.addEventListener('input', triggerSearch); }
    [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(input => {
        input?.addEventListener('input', triggerSearch); 
        input?.addEventListener('change', triggerSearch); 
    });
    typeFilterCheckboxes?.forEach(checkbox => checkbox.addEventListener('change', () => {
        if (checkbox.checked) { 
            typeFilterCheckboxes.forEach(cb => { if (cb !== checkbox) cb.checked = false; }); 
        }
        updateToggleTextForDropdown(typeDropdownElement, "Выберите тип"); 
        triggerSearch();
    }));
    if(resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            typeFilterCheckboxes?.forEach(cb => cb.checked = false);
            if(typeDropdownElement) updateToggleTextForDropdown(typeDropdownElement, "Выберите тип");
            genreDropdownMovieMenuElement?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            if(genreDropdownMovieElement) updateToggleTextForGenres(genreDropdownMovieElement);
            [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(input => { if(input) input.value = ''; });
            clearSearchResults(true); 
            if (initialPlaceholder) initialPlaceholder.style.display = 'flex';
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
    }

    function displayResults(items, searchedMediaTypeContext) {
        clearSearchResults(false); 
        if(!searchResultsContainer) return;

        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'search-results-grid';

        if (!items || items.length === 0) {
            
            const hasActiveServerFilters = searchInput?.value.trim().length > 0 || 
                                       getSelectedGenreIds().length > 0 || 
                                       yearFromInput?.value.trim() || 
                                       yearToInput?.value.trim() || 
                                       ratingFromInput?.value.trim() || 
                                       ratingToInput?.value.trim() || 
                                       document.querySelector('input[name="type_filter"]:checked');
            
            if (hasActiveServerFilters) {
                 resultsGrid.innerHTML = '<p class="no-results">По вашему запросу ничего не найдено.</p>';
            } else {
                if (initialPlaceholder) initialPlaceholder.style.display = 'flex';
            }
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
                if (genreNames === 'Жанры не указаны' && item.genre_ids?.length > 0 && currentGenreMap.size === 0) {
                    
                    genreNames = 'Загрузка названий жанров...';
                }


                const itemElement = document.createElement('div');
                itemElement.className = 'search-result-item';

                
                if (releaseDate && !isNaN(new Date(releaseDate).getFullYear())) {
                    itemElement.dataset.year = new Date(releaseDate).getFullYear();
                }
                if (item.vote_average !== undefined && item.vote_average !== null) {
                    itemElement.dataset.rating = item.vote_average.toFixed(1);
                }
                itemElement.dataset.mediaType = mediaType;
                if (item.genre_ids && Array.isArray(item.genre_ids)) {
                    itemElement.dataset.genreIds = item.genre_ids.join(',');
                } else {
                    itemElement.dataset.genreIds = '';
                }
                
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

        applyClientSideFilters(); 
    }

    function displayError(message) {
        clearSearchResults(false); 
        if(!searchResultsContainer) return;
        const errorElement = document.createElement('p');
        errorElement.className = 'search-error-message';
        errorElement.textContent = `Ошибка: ${message}`;
        searchResultsContainer.querySelector('.search-results-grid')?.remove(); 
        searchResultsContainer.appendChild(errorElement);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (initialPlaceholder) initialPlaceholder.style.display = 'none';
    }

    function clearSearchResults(showPlaceholder = true) {
        if (!searchResultsContainer) return;
        searchResultsContainer.querySelector('.search-results-grid')?.remove();
        searchResultsContainer.querySelector('.search-error-message')?.remove();
        const clientNoResultsMsg = searchResultsContainer.querySelector('.no-results-client-message');
        if (clientNoResultsMsg) clientNoResultsMsg.remove();

        if (initialPlaceholder) initialPlaceholder.style.display = showPlaceholder ? 'flex' : 'none';
    }
    
    function applyClientSideFilters() {
        if (!searchResultsContainer) return;

        const selectedGenreIds = getSelectedGenreIds(); 
        const yearFrom = yearFromInput && yearFromInput.value ? parseInt(yearFromInput.value, 10) : null;
        const yearTo = yearToInput && yearToInput.value ? parseInt(yearToInput.value, 10) : null;
        const ratingFrom = ratingFromInput && ratingFromInput.value ? parseFloat(ratingFromInput.value) : null;
        const ratingTo = ratingToInput && ratingToInput.value ? parseFloat(ratingToInput.value) : null;
        
        const activeMediaTypeCheckbox = document.querySelector('input[name="type_filter"]:checked');
        const selectedMediaType = activeMediaTypeCheckbox ? activeMediaTypeCheckbox.value : null;

        const items = searchResultsContainer.querySelectorAll('.search-result-item');
        let visibleCount = 0;

        const existingClientNoResultsMsg = searchResultsContainer.querySelector('.no-results-client-message');
        if (existingClientNoResultsMsg) existingClientNoResultsMsg.remove();
        
        
        if (items.length === 0) {
            
            return; 
        }


        items.forEach(item => {
            let matches = true;

            const itemYearStr = item.dataset.year;
            const itemRatingStr = item.dataset.rating;
            const itemMediaType = item.dataset.mediaType;
            const itemGenreIdsStr = item.dataset.genreIds;

            const itemYear = itemYearStr && !isNaN(parseInt(itemYearStr, 10)) ? parseInt(itemYearStr, 10) : null;
            const itemRating = itemRatingStr && !isNaN(parseFloat(itemRatingStr)) ? parseFloat(itemRatingStr) : null;
            const itemGenreIds = itemGenreIdsStr ? itemGenreIdsStr.split(',').filter(id => id).map(id => parseInt(id, 10)) : [];


            
            if (itemMediaType === 'tv' && itemGenreIds.some(id => EXCLUDED_TV_GENRE_IDS.includes(id))) {
                matches = false;
            }

            
            if (matches && selectedMediaType && itemMediaType !== selectedMediaType) {
                matches = false;
            }

            
            if (matches && selectedGenreIds.length > 0) {
                const hasAllSelectedGenres = selectedGenreIds.every(selGenreId => itemGenreIds.includes(parseInt(selGenreId, 10)));
                if (!hasAllSelectedGenres) {
                    matches = false;
                }
            }

            
            if (matches && itemYear !== null) {
                if (yearFrom && itemYear < yearFrom) {
                    matches = false;
                }
                if (matches && yearTo && itemYear > yearTo) { 
                    matches = false;
                }
            } else if (matches && (yearFrom || yearTo)) { 
                matches = false;
            }

            
            if (matches && itemRating !== null) {
                if (ratingFrom && itemRating < ratingFrom) {
                    matches = false;
                }
                if (matches && ratingTo && itemRating > ratingTo) { 
                    matches = false;
                }
            } else if (matches && (ratingFrom || ratingTo)) {
                matches = false;
            }
            
            item.style.display = matches ? 'flex' : 'none'; 
            if (matches) {
                visibleCount++;
            }
        });

        if (visibleCount === 0 && items.length > 0) {
            
            const serverNoResultsMsg = searchResultsContainer.querySelector('.no-results');
            if (serverNoResultsMsg) serverNoResultsMsg.remove();

            const noResultsMessage = document.createElement('p');
            noResultsMessage.className = 'no-results-client-message'; 
            noResultsMessage.textContent = 'По вашему запросу и выбранным фильтрам ничего не найдено.';
            noResultsMessage.style.textAlign = 'center';
            noResultsMessage.style.color = '#A0A0A0';
            noResultsMessage.style.fontSize = '1.1em';
            noResultsMessage.style.padding = '30px 15px';
            
            const grid = searchResultsContainer.querySelector('.search-results-grid');
            if (grid) {
                grid.after(noResultsMessage);
            } else {
                searchResultsContainer.appendChild(noResultsMessage);
            }
            if(initialPlaceholder) initialPlaceholder.style.display = 'none';
        }
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

    // Создание и загрузка новых полок
    if (dynamicShelvesContainer) {
        const moviesShelf = createShelfElement('movies-shelf', 'Фильмы');
        dynamicShelvesContainer.appendChild(moviesShelf);
        fetchAndRenderMoviesShelf(moviesShelf);

        const tvShowsShelf = createShelfElement('tv-shows-shelf', 'Сериалы');
        dynamicShelvesContainer.appendChild(tvShowsShelf);
        fetchAndRenderTvShowsShelf(tvShowsShelf);

        const ongoingSeriesShelf = createShelfElement('ongoing-series-shelf', 'Онгоинги');
        dynamicShelvesContainer.appendChild(ongoingSeriesShelf);
        fetchAndRenderOngoingSeriesShelf(ongoingSeriesShelf);
    } else {
        console.error("Контейнер 'dynamic-shelves-container' не найден в DOM.");
    }

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
                
                if (sectionId === 'popular' && contentArea) { 
                     offsetTop = contentArea.getBoundingClientRect().top + window.pageYOffset - effectiveNavbarHeight;
                     if (offsetTop < 0 && sectionId === 'popular') offsetTop = 0; 
                }
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

}); // Конец DOMContentLoaded
