// home.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Элементы DOM для Hero секции ---
    const heroSection = document.getElementById('hero-section');
    const heroVideoContainer = heroSection?.querySelector('.hero-video-container');
    const heroFallback = heroSection?.querySelector('.hero-fallback');
    const heroFallbackImg = heroFallback?.querySelector('img');
    const soundButton = heroSection?.querySelector('.sound-button');
    const soundIcon = soundButton?.querySelector('i');
    
    const heroContentDisplay = heroSection?.querySelector('.hero-content-display');
    const heroTitleElement = heroContentDisplay?.querySelector('.hero-title');
    const heroDescriptionElement = heroContentDisplay?.querySelector('.hero-description');
    const heroWatchButton = heroContentDisplay?.querySelector('.hero-button.action-button');

    // --- Остальные элементы DOM ---
    const navbarButtons = document.querySelectorAll('.navbar-button');
    const profileButton = document.querySelector('.navbar-right a[href="profile"]');
    
    const newSearchButton = document.getElementById('search-button');
    const newSearchModal = document.getElementById('search-modal');
    const searchInput = newSearchModal?.querySelector('.search-modal-input');
    const searchResultsContainer = newSearchModal?.querySelector('.search-modal-main');
    const initialPlaceholder = searchResultsContainer?.querySelector('.search-results-placeholder');
    const loadingIndicator = searchResultsContainer?.querySelector('.search-loading-indicator');

    const genreDropdownMovieElement = newSearchModal?.querySelector('.custom-dropdown[data-dropdown-id="genres-movie"]');
    const genreDropdownMovieMenu = genreDropdownMovieElement?.querySelector('.dropdown-menu');

    const typeFilterCheckboxes = newSearchModal?.querySelectorAll('input[name="type_filter"]');
    const typeDropdownElement = newSearchModal?.querySelector('.custom-dropdown[data-dropdown-id="type"]');

    const yearFromInput = newSearchModal?.querySelector('.year-input[placeholder="от"]');
    const yearToInput = newSearchModal?.querySelector('.year-input[placeholder="до"]');
    const ratingFromInput = newSearchModal?.querySelector('.rating-input[placeholder="от"]');
    const ratingToInput = newSearchModal?.querySelector('.rating-input[placeholder="до"]');
    const resetFiltersButton = newSearchModal?.querySelector('.reset-filters-button');

    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
    const BACKDROP_SIZE_HERO = 'original';
    const POSTER_SIZE_SEARCH = 'w154';

    let searchTimeout;
    let allMovieGenresMap = new Map();
    let allTvGenresMap = new Map();
    let heroYouTubePlayer;
    let ytApiLoaded = false;
    let ytApiLoading = false;

    function loadYouTubeAPI() {
        if (ytApiLoaded || ytApiLoading) return;
        ytApiLoading = true;
        console.log("Загрузка YouTube IFrame API...");
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api"; 
        tag.onerror = () => {
            console.error("Ошибка загрузки YouTube IFrame API. YouTube трейлеры не будут работать.");
            ytApiLoaded = false; 
            ytApiLoading = false;
            if (heroSection.dataset.waitingForYt === 'true' && heroSection.dataset.videoType === 'youtube') {
                 switchToHeroFallback(heroFallbackImg ? heroFallbackImg.src : null, true);
            }
        };
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
        console.log("YouTube IFrame API успешно загружена.");
        ytApiLoaded = true;
        ytApiLoading = false;
        if (typeof window.pendingHeroPlayerInit === 'function') {
            window.pendingHeroPlayerInit();
            delete window.pendingHeroPlayerInit;
        }
    };
    
    async function loadAndDisplayHeroContent() {
        if (!heroSection || !heroTitleElement || !heroDescriptionElement || !heroWatchButton || !heroFallbackImg) {
            console.error("Один или несколько элементов Hero не найдены в DOM.");
            return;
        }
        try {
            const response = await fetch('/api/tmdb/hero-content');
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                console.error("Ошибка от сервера (hero):", data.error);
                switchToHeroFallback(null, true);
                return;
            }
            
            // DEBUG LOG: Показываем, какой путь к видео получен от сервера
            console.log('[CLIENT DEBUG] Получено от сервера video_info:', data.video_info);

            heroTitleElement.textContent = data.title || 'Название не найдено';
            heroDescriptionElement.textContent = data.overview || 'Описание отсутствует.';
            heroWatchButton.dataset.tmdbId = data.id;
            heroWatchButton.dataset.mediaType = data.media_type;
            heroWatchButton.onclick = () => {
                window.location.href = `watch.html?tmdbId=${data.id}&type=${data.media_type}`;
            };

            const backdropUrl = data.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${BACKDROP_SIZE_HERO}${data.backdrop_path}` : 'https://placehold.co/1920x1080/0D0D0D/333333?text=Нет+изображения';
            heroFallbackImg.src = backdropUrl;
            heroFallbackImg.alt = `Задник для ${data.title}`;
            heroSection.dataset.videoType = data.video_info.type;

            if (data.video_info.type === 'youtube' && data.video_info.key_or_url) {
                heroSection.dataset.waitingForYt = 'true';
                if (ytApiLoaded) {
                    createYouTubePlayer(data.video_info.key_or_url);
                } else {
                    loadYouTubeAPI();
                    window.pendingHeroPlayerInit = () => createYouTubePlayer(data.video_info.key_or_url);
                    setTimeout(() => {
                        if (!ytApiLoaded && heroSection.dataset.waitingForYt === 'true') {
                            console.warn("Таймаут загрузки YouTube API. Переключение на fallback.");
                            switchToHeroFallback(backdropUrl, true);
                        }
                    }, 7000);
                }
            } else if (data.video_info.type === 'html5_local' && data.video_info.key_or_url) {
                 // DEBUG LOG: Передаем videoSrc в createHtml5Player
                console.log('[CLIENT DEBUG] Попытка создать HTML5 плеер с src:', data.video_info.key_or_url);
                createHtml5Player(data.video_info.key_or_url);
            }
            else {
                console.warn('[CLIENT DEBUG] Не удалось определить тип видео или отсутствует ключ/URL. Переключение на fallback.');
                switchToHeroFallback(backdropUrl, true);
            }
        } catch (error) {
            console.error('Не удалось загрузить hero-контент:', error);
            switchToHeroFallback(null, true);
        }
    }

    function createHtml5Player(videoSrc) {
        if (!heroVideoContainer) return;
        heroVideoContainer.innerHTML = '';
        const videoElement = document.createElement('video');
        videoElement.src = videoSrc; // Путь к видео
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.loop = false; 
        videoElement.controls = false; 
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';

        console.log(`[CLIENT DEBUG] HTML5 Video Element создан. SRC установлен на: ${videoElement.src}`);


        videoElement.addEventListener('canplay', () => {
            console.log(`[CLIENT DEBUG] HTML5 Video: Событие 'canplay' для ${videoSrc}`);
            heroVideoContainer.style.opacity = '1';
            if(heroFallback) heroFallback.classList.remove('active');
            heroSection.classList.add('video-playing');
            heroSection.classList.remove('poster-active');
            if (soundButton) soundButton.style.display = 'flex';
        });
        videoElement.addEventListener('ended', () => {
            console.log(`[CLIENT DEBUG] HTML5 Video: Событие 'ended' для ${videoSrc}. Переключение на fallback.`);
            switchToHeroFallback(heroFallbackImg ? heroFallbackImg.src : null, false);
        });
        videoElement.addEventListener('error', (e) => {
            // DEBUG LOG: Более детальная информация об ошибке
            console.error(`[CLIENT DEBUG] Ошибка HTML5 video при загрузке ${videoSrc}:`, e);
            if (videoElement.error) {
                console.error(`[CLIENT DEBUG] Код ошибки видео: ${videoElement.error.code}`);
                switch (videoElement.error.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                        console.error('[CLIENT DEBUG] Загрузка видео прервана пользователем или скриптом.');
                        break;
                    case MediaError.MEDIA_ERR_NETWORK:
                        console.error('[CLIENT DEBUG] Ошибка сети при загрузке видео. Проверьте путь и доступность файла.');
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        console.error('[CLIENT DEBUG] Ошибка декодирования видео. Возможно, файл поврежден или формат не поддерживается.');
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        console.error('[CLIENT DEBUG] Источник видео не поддерживается (например, неверный URL или тип MIME). Убедитесь, что путь к видео правильный: ' + videoSrc);
                        break;
                    default:
                        console.error('[CLIENT DEBUG] Неизвестная ошибка видео.');
                        break;
                }
            }
            switchToHeroFallback(heroFallbackImg ? heroFallbackImg.src : null, true);
        });
        heroVideoContainer.appendChild(videoElement);
        if (soundButton && soundIcon) {
            soundButton.onclick = () => { 
                videoElement.muted = !videoElement.muted;
                soundIcon.classList.toggle('fa-volume-mute', videoElement.muted);
                soundIcon.classList.toggle('fa-volume-up', !videoElement.muted);
            };
        }
    }

    function initializePlayer(videoId, playerId) { 
         heroYouTubePlayer = new YT.Player(playerId, { 
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,       
                'controls': 0,       
                'rel': 0,            
                'iv_load_policy': 3, 
                'modestbranding': 1, 
                'loop': 0,          
                'mute': 1,          
                'vq': 'hd1080',      
                'origin': window.location.origin 
            },
            events: { 
                'onReady': onPlayerReady, 
                'onStateChange': onPlayerStateChange, 
                'onError': onPlayerError 
            }
        });
    }

    function createYouTubePlayer(videoId) {
        heroSection.dataset.waitingForYt = 'false';
        if (!heroVideoContainer || !ytApiLoaded) {
            console.warn("YouTube API не готово или контейнер не найден, переключение на fallback.");
            switchToHeroFallback(heroFallbackImg ? heroFallbackImg.src : null, true);
            return;
        }
        
        heroVideoContainer.innerHTML = '';
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player-hero'; 
        heroVideoContainer.appendChild(playerDiv);

        initializePlayer(videoId, playerDiv.id); 
    }
    
    function onPlayerReady(event) {
        event.target.playVideo();
        heroVideoContainer.style.opacity = '1';
        if(heroFallback) heroFallback.classList.remove('active');
        heroSection.classList.add('video-playing');
        heroSection.classList.remove('poster-active');
        if (soundButton) soundButton.style.display = 'flex';
        if (soundIcon && heroYouTubePlayer) {
            soundIcon.classList.toggle('fa-volume-mute', heroYouTubePlayer.isMuted());
            soundIcon.classList.toggle('fa-volume-up', !heroYouTubePlayer.isMuted());
        }
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            switchToHeroFallback(heroFallbackImg ? heroFallbackImg.src : null, false);
        }
        if (event.data === YT.PlayerState.PLAYING) {
             heroVideoContainer.style.opacity = '1';
             if(heroFallback) heroFallback.classList.remove('active');
             heroSection.classList.add('video-playing');
             heroSection.classList.remove('poster-active');
        }
    }

    function onPlayerError(event) {
        console.error("Ошибка YouTube плеера:", event.data);
        switchToHeroFallback(heroFallbackImg ? heroFallbackImg.src : null, true);
    }

    function switchToHeroFallback(backdropSrc, forceShowFallback) {
        if (heroYouTubePlayer && typeof heroYouTubePlayer.destroy === 'function') {
            try { heroYouTubePlayer.destroy(); } catch(e) { console.warn("Ошибка при уничтожении YT плеера:", e); }
            heroYouTubePlayer = null;
        }
        if (heroVideoContainer) {
            heroVideoContainer.innerHTML = ''; 
            heroVideoContainer.style.opacity = '0';
        }

        if (heroFallbackImg && heroFallback) {
            if (backdropSrc && backdropSrc !== heroFallbackImg.src) {
                heroFallbackImg.src = backdropSrc;
            } else if (!backdropSrc) {
                 heroFallbackImg.src = 'https://placehold.co/1920x1080/0D0D0D/333333?text=Контент+недоступен';
            }
            heroFallback.classList.add('active');
        }
        heroSection.classList.remove('video-playing');
        heroSection.classList.add('poster-active');
        if (soundButton) soundButton.style.display = 'none';
        heroSection.dataset.waitingForYt = 'false';
    }

    if (soundButton && soundIcon) {
        soundButton.addEventListener('click', () => {
            if (heroYouTubePlayer && typeof heroYouTubePlayer.isMuted === 'function' && heroYouTubePlayer.getPlayerState && (heroYouTubePlayer.getPlayerState() === 1 || heroYouTubePlayer.getPlayerState() === 2) ) { 
                if (heroYouTubePlayer.isMuted()) {
                    heroYouTubePlayer.unMute();
                    soundIcon.classList.remove('fa-volume-mute');
                    soundIcon.classList.add('fa-volume-up');
                } else {
                    heroYouTubePlayer.mute();
                    soundIcon.classList.remove('fa-volume-up');
                    soundIcon.classList.add('fa-volume-mute');
                }
            } else { 
                const html5Video = heroVideoContainer?.querySelector('video');
                if (html5Video) {
                    html5Video.muted = !html5Video.muted;
                    soundIcon.classList.toggle('fa-volume-mute', html5Video.muted);
                    soundIcon.classList.toggle('fa-volume-up', !html5Video.muted);
                }
            }
        });
    }

    loadAndDisplayHeroContent();

    // --- Логика поиска и фильтров ---
    if (newSearchButton && newSearchModal) {
        function openSearchModalWindow() {
            newSearchModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (genreDropdownMovieMenu && genreDropdownMovieMenu.querySelectorAll('label').length === 0 && !genreDropdownMovieMenu.querySelector('.genres-loading-placeholder')) {
                const placeholder = document.createElement('p');
                placeholder.className = 'genres-loading-placeholder';
                placeholder.textContent = 'Загрузка жанров...';
                placeholder.style.cssText = "padding: 8px 10px; color: #A0A0A0; font-size: 0.9em; font-style: italic;";
                genreDropdownMovieMenu.appendChild(placeholder);
                loadAndPopulateAllGenres();
            } else if (allMovieGenresMap.size === 0 && allTvGenresMap.size === 0) {
                loadAndPopulateAllGenres();
            }
        }
        function closeSearchModalWindow() {
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
            if (data.error) throw new Error(data.error);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Ошибка загрузки жанров ${type}:`, error);
            const targetMenu = type === 'movie' ? genreDropdownMovieMenu : null;
            if (targetMenu) {
                const placeholder = targetMenu.querySelector('.genres-loading-placeholder');
                if(placeholder) placeholder.textContent = `Ошибка загрузки жанров.`;
                else {
                    const p = document.createElement('p');
                    p.className = 'genres-loading-placeholder';
                    p.textContent = `Ошибка загрузки жанров.`;
                    p.style.cssText = "padding: 8px 10px; color: #A0A0A0; font-size: 0.9em; font-style: italic;";
                    targetMenu.appendChild(p);
                }
            }
            return [];
        }
    }

    async function populateGenreDropdown(dropdownMenu, genres, type, genreMapToPopulate) {
        if (!dropdownMenu) return;
        const placeholder = dropdownMenu.querySelector('.genres-loading-placeholder');
        if (placeholder) placeholder.remove();
        dropdownMenu.innerHTML = '';

        genreMapToPopulate.clear();
        if (!Array.isArray(genres)) {
            console.error("populateGenreDropdown ожидал массив жанров, получил:", genres);
            return;
        }

        genres.forEach(genre => {
            if (typeof genre.id !== 'number' || typeof genre.name !== 'string') {
                console.warn("Некорректный формат жанра:", genre);
                return;
            }
            genreMapToPopulate.set(genre.id, genre.name);

            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = `genre_filter`;
            checkbox.value = String(genre.id);
            checkbox.dataset.genreName = genre.name;

            checkbox.addEventListener('change', () => {
                updateToggleTextForGenres(dropdownMenu.closest('.custom-dropdown'));
                triggerSearch();
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${genre.name}`));
            dropdownMenu.appendChild(label);
        });
    }

    async function loadAndPopulateAllGenres() {
        const movieGenres = await fetchGenresFromServer('movie');
        populateGenreDropdown(genreDropdownMovieMenu, movieGenres, 'movie', allMovieGenresMap);

        const tvGenres = await fetchGenresFromServer('tv');
        allTvGenresMap.clear();
        if (Array.isArray(tvGenres)) {
            tvGenres.forEach(genre => {
                if (typeof genre.id === 'number' && typeof genre.name === 'string') {
                    allTvGenresMap.set(genre.id, genre.name);
                }
            });
        }
        updateToggleTextForGenres(genreDropdownMovieElement);
    }

    function getSelectedGenreIds() {
        const selectedIds = [];
        genreDropdownMovieMenu?.querySelectorAll('input[name="genre_filter"]:checked').forEach(cb => {
            selectedIds.push(cb.value);
        });
        return selectedIds;
    }

    function triggerSearch() {
        const query = searchInput ? searchInput.value.trim() : "";
        const selectedGenres = getSelectedGenreIds();
        const yearFrom = yearFromInput ? yearFromInput.value.trim() : "";
        const yearTo = yearToInput ? yearToInput.value.trim() : "";
        const ratingFrom = ratingFromInput ? ratingFromInput.value.trim() : "";
        const ratingTo = ratingToInput ? ratingToInput.value.trim() : "";
        const selectedTypeCheckbox = document.querySelector('input[name="type_filter"]:checked');
        const activeMediaType = selectedTypeCheckbox ? selectedTypeCheckbox.value : null;

        if (query.length > 1 || selectedGenres.length > 0 || yearFrom || yearTo || ratingFrom || ratingTo || activeMediaType) {
            clearTimeout(searchTimeout);
            if (loadingIndicator) loadingIndicator.style.display = 'flex';
            if (initialPlaceholder) initialPlaceholder.style.display = 'none';
            clearSearchResults(false);

            searchTimeout = setTimeout(() => {
                performSearch(query, selectedGenres, yearFrom, yearTo, ratingFrom, ratingTo);
            }, 350);
        } else {
            clearSearchResults(true);
            if (initialPlaceholder) initialPlaceholder.style.display = 'flex';
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    if (searchInput) searchInput.addEventListener('input', triggerSearch);
    [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(input => {
        input?.addEventListener('input', triggerSearch);
        input?.addEventListener('change', triggerSearch);
    });

    typeFilterCheckboxes?.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                typeFilterCheckboxes.forEach(cb => { if (cb !== checkbox) cb.checked = false; });
            }
            updateToggleTextForDropdown(typeDropdownElement, "Выберите тип");
            triggerSearch();
        });
    });

    if(resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            typeFilterCheckboxes?.forEach(cb => cb.checked = false);
            if(typeDropdownElement) updateToggleTextForDropdown(typeDropdownElement, "Выберите тип");
            genreDropdownMovieMenu?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            if(genreDropdownMovieElement) updateToggleTextForGenres(genreDropdownMovieElement);
            [yearFromInput, yearToInput, ratingFromInput, ratingToInput].forEach(input => { if(input) input.value = ''; });
            clearSearchResults(true);
            if (initialPlaceholder) initialPlaceholder.style.display = 'flex';
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
    }

    async function performSearch(query, selectedGenreIdsArray = [], yearFrom = "", yearTo = "", ratingFrom = "", ratingTo = "") {
        const selectedTypeCheckbox = document.querySelector('input[name="type_filter"]:checked');
        let activeMediaType = selectedTypeCheckbox ? selectedTypeCheckbox.value : null;

        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        if (initialPlaceholder) initialPlaceholder.style.display = 'none';

        const language = 'ru-RU';
        let searchParams = new URLSearchParams({ language, page: 1 });

        if (query) {
            searchParams.append('query', query);
            if (activeMediaType) {
                searchParams.append('media_type', activeMediaType);
            } else {
                searchParams.append('media_type', 'multi');
            }
        } else {
            if (!activeMediaType && (selectedGenreIdsArray.length > 0 || yearFrom || yearTo || ratingFrom || ratingTo)) {
                activeMediaType = 'movie';
            }
            if (activeMediaType) {
                searchParams.append('media_type', activeMediaType);
                if (selectedGenreIdsArray.length > 0) searchParams.append('genres', selectedGenreIdsArray.join(','));
                if (yearFrom) searchParams.append('year_from', yearFrom);
                if (yearTo) searchParams.append('year_to', yearTo);
                if (ratingFrom) searchParams.append('rating_from', ratingFrom);
                if (ratingTo) searchParams.append('rating_to', ratingTo);
            } else {
                clearSearchResults(true);
                if (initialPlaceholder) initialPlaceholder.style.display = 'flex';
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                return;
            }
        }

        const fullUrl = `/api/tmdb/search?${searchParams.toString()}`;
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Ошибка HTTP: ${response.status}` }));
                throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            let resultsToDisplay = data.results || [];

            if (query) {
                if (selectedGenreIdsArray.length > 0) {
                    const selectedGenreIdsAsNumbers = selectedGenreIdsArray.map(idStr => parseInt(idStr, 10));
                    resultsToDisplay = resultsToDisplay.filter(item => {
                        if (!item.genre_ids || item.genre_ids.length === 0) return false;
                        return item.genre_ids.some(itemGenreId => selectedGenreIdsAsNumbers.includes(itemGenreId));
                    });
                }
                if (yearFrom) {
                    const from = parseInt(yearFrom);
                    resultsToDisplay = resultsToDisplay.filter(item => {
                        const itemReleaseDate = item.release_date || item.first_air_date;
                        if (!itemReleaseDate) return false;
                        const itemYear = new Date(itemReleaseDate).getFullYear();
                        return itemYear >= from;
                    });
                }
                if (yearTo) {
                    const to = parseInt(yearTo);
                    resultsToDisplay = resultsToDisplay.filter(item => {
                        const itemReleaseDate = item.release_date || item.first_air_date;
                        if (!itemReleaseDate) return false;
                        const itemYear = new Date(itemReleaseDate).getFullYear();
                        return itemYear <= to;
                    });
                }
                if (ratingFrom) {
                    const from = parseFloat(ratingFrom);
                    resultsToDisplay = resultsToDisplay.filter(item =>
                        item.vote_average !== undefined && item.vote_average !== null && item.vote_average >= from
                    );
                }
                if (ratingTo) {
                    const to = parseFloat(ratingTo);
                    resultsToDisplay = resultsToDisplay.filter(item =>
                        item.vote_average !== undefined && item.vote_average !== null && item.vote_average <= to
                    );
                }
            }

            let searchedMediaTypeContextForDisplay = activeMediaType;
            if (query && !activeMediaType) searchedMediaTypeContextForDisplay = 'multi';

            displayResults(resultsToDisplay, searchedMediaTypeContextForDisplay || 'movie');
        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
            displayError(error.message);
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    function displayResults(items, searchedMediaTypeContext) {
        clearSearchResults(false);
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'search-results-grid';

        if (!items || items.length === 0) {
            const hasActiveFilters = (searchInput && searchInput.value.trim().length > 0) ||
                                   getSelectedGenreIds().length > 0 ||
                                   (yearFromInput && yearFromInput.value.trim()) || (yearToInput && yearToInput.value.trim()) ||
                                   (ratingFromInput && ratingFromInput.value.trim()) || (ratingToInput && ratingToInput.value.trim()) ||
                                   document.querySelector('input[name="type_filter"]:checked');

            if (hasActiveFilters) {
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
                const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_SEARCH}${item.poster_path}` : 'https://placehold.co/154x231/1a1a1a/ffffff?text=Нет+постера';
                let overview = item.overview || 'Описание отсутствует.';
                if (overview.length > 100) overview = overview.substring(0, 97) + '...';
                const voteAverage = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                let genreNames = 'Жанры не указаны';
                const currentGenreMap = mediaType === 'tv' ? allTvGenresMap : allMovieGenresMap;

                if (item.genre_ids && item.genre_ids.length > 0 && currentGenreMap.size > 0) {
                    const names = item.genre_ids
                        .map(id => currentGenreMap.get(parseInt(id, 10)))
                        .filter(name => name);
                    if (names.length > 0) genreNames = names.join(', ');
                }
                 if (genreNames === 'Жанры не указаны' && item.genre_ids && item.genre_ids.length > 0) {
                    if (currentGenreMap.size === 0 && (allMovieGenresMap.size === 0 || allTvGenresMap.size === 0)) {
                       genreNames = 'Загрузка названий жанров...';
                    } else {
                        genreNames = `ID жанров: ${item.genre_ids.join(', ')}`;
                    }
                }

                const itemElement = document.createElement('div');
                itemElement.className = 'search-result-item';
                itemElement.innerHTML = `
                    <img src="${posterPath}" alt="${title}" class="search-result-poster" onerror="this.onerror=null;this.src='https://placehold.co/154x231/1a1a1a/ffffff?text=Ошибка';">
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
                        <a href="watch.html?tmdbId=${item.id}&type=${mediaType}" class="action-button search-result-watch-btn">
                            <i class="fas fa-play"></i> Смотреть
                        </a>
                    </div>
                `;
                resultsGrid.appendChild(itemElement);

                requestAnimationFrame(() => {
                    setTimeout(() => {
                        itemElement.classList.add('visible');
                    }, index * 50);
                });
            });
        }
        if (searchResultsContainer) {
            const oldGrid = searchResultsContainer.querySelector('.search-results-grid');
            if (oldGrid) oldGrid.remove();
            searchResultsContainer.appendChild(resultsGrid);
        }
    }

    function displayError(message) {
        clearSearchResults(false);
        const errorElement = document.createElement('p');
        errorElement.className = 'search-error-message';
        errorElement.textContent = `Ошибка: ${message}`;
        if (searchResultsContainer) {
            const oldGrid = searchResultsContainer.querySelector('.search-results-grid');
            if (oldGrid) oldGrid.remove();
            searchResultsContainer.appendChild(errorElement);
        }
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (initialPlaceholder) initialPlaceholder.style.display = 'none';
    }

    function clearSearchResults(showPlaceholder = true) {
        if (!searchResultsContainer) return;
        const existingGrid = searchResultsContainer.querySelector('.search-results-grid');
        if (existingGrid) existingGrid.remove();
        const existingError = searchResultsContainer.querySelector('.search-error-message');
        if (existingError) existingError.remove();

        if (showPlaceholder && initialPlaceholder) {
            initialPlaceholder.style.display = 'flex';
        } else if (initialPlaceholder) {
            initialPlaceholder.style.display = 'none';
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

    const customDropdowns = document.querySelectorAll('.search-modal-sidebar .custom-dropdown');
    customDropdowns.forEach(dropdown => {
        const toggleButton = dropdown.querySelector('.dropdown-toggle');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');

        if (toggleButton && dropdownMenu) {
            toggleButton.addEventListener('click', (event) => {
                event.stopPropagation();
                const currentlyOpen = dropdown.classList.contains('open');
                customDropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) otherDropdown.classList.remove('open');
                });
                if (!currentlyOpen) {
                    dropdown.classList.add('open');
                    if (dropdown.dataset.dropdownId === 'genres-movie' && dropdownMenu.querySelectorAll('label').length === 0 && !dropdownMenu.querySelector('.genres-loading-placeholder')) {
                         const placeholder = document.createElement('p');
                         placeholder.className = 'genres-loading-placeholder';
                         placeholder.textContent = 'Загрузка жанров...';
                         placeholder.style.cssText = "padding: 8px 10px; color: #A0A0A0; font-size: 0.9em; font-style: italic;";
                         dropdownMenu.appendChild(placeholder);
                         loadAndPopulateAllGenres();
                    }
                } else {
                    dropdown.classList.remove('open');
                }
            });
        }
    });

    function updateToggleTextForDropdown(dropdownElement, defaultText) {
        if (!dropdownElement) return;
        const textElement = dropdownElement.querySelector('.dropdown-toggle span');
        if (!textElement) {
            console.warn("Элемент для текста в кнопке дропдауна не найден:", dropdownElement);
            return;
        }

        const selectedCheckboxes = dropdownElement.querySelectorAll('.dropdown-menu input[type="checkbox"]:checked');
        let selectedTexts = [];
        selectedCheckboxes.forEach(cb => {
            selectedTexts.push(cb.dataset.genreName || cb.value);
        });

        if (selectedTexts.length > 0) {
            const isGenreDropdown = dropdownElement.dataset.dropdownId === "genres-movie";
            const maxNamesToShow = isGenreDropdown ? 2 : 1;

            if (selectedTexts.length <= maxNamesToShow) {
                textElement.textContent = selectedTexts.join(', ');
            } else {
                textElement.textContent = `${selectedTexts.length} выбрано`;
            }
        } else {
            textElement.textContent = defaultText;
        }
    }

    function updateToggleTextForGenres(dropdownElement) {
        if (!dropdownElement) return;
        const menu = dropdownElement.querySelector('.dropdown-menu');
        const toggleSpan = dropdownElement.querySelector('.dropdown-toggle span');
        if (!toggleSpan) return;

        if (menu && menu.querySelector('.genres-loading-placeholder')) {
             toggleSpan.textContent = "Загрузка жанров...";
        } else if (menu && menu.querySelectorAll('label').length === 0 && !menu.querySelector('.genres-loading-placeholder')) {
             toggleSpan.textContent = "Жанры не найдены";
        }
        else {
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

    document.addEventListener('click', (event) => {
        customDropdowns.forEach(dropdown => {
            if (dropdown.classList.contains('open') && !dropdown.contains(event.target)) {
                dropdown.classList.remove('open');
            }
        });
        const clickedInsideMovieTile = event.target.closest('.movie-tile');
        if (!clickedInsideMovieTile) {
            document.querySelectorAll('.movie-tile.active-details').forEach(activeTile => {
                activeTile.classList.remove('active-details');
                const details = activeTile.querySelector('.movie-details');
                if (details) details.style.transform = 'translateY(100%)';
            });
        }
    });

    navbarButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            navbarButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const sectionId = this.dataset.section;
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                const navbarHeightValue = navbar ? navbar.offsetHeight : 0;
                window.scrollTo({ top: targetSection.offsetTop - navbarHeightValue, behavior: 'smooth' });
            }
        });
    });
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }, { passive: true });
    }

    if (profileButton) {
        profileButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = profileButton.getAttribute('href');
        });
    }

    function initMovieTileInteractivity() {
        document.querySelectorAll('.movie-tile').forEach(tile => {
            tile.removeEventListener('click', handleMovieTileClick);
            tile.addEventListener('click', handleMovieTileClick);
        });
    }
    function handleMovieTileClick(event) {
        const tile = event.currentTarget;
        const details = tile.querySelector('.movie-details');
        if (!details || event.target.closest('button')) return;

        document.querySelectorAll('.movie-tile.active-details').forEach(activeTile => {
            if (activeTile !== tile) {
                activeTile.classList.remove('active-details');
                const otherDetails = activeTile.querySelector('.movie-details');
                if (otherDetails) otherDetails.style.transform = 'translateY(100%)';
            }
        });

        tile.classList.toggle('active-details');
        details.style.transform = tile.classList.contains('active-details') ? 'translateY(0)' : 'translateY(100%)';
    }

    function setRatingColor(ratingElement, ratingValue) {
        if (!ratingElement) return;
        const rating = parseFloat(ratingValue);
        ratingElement.classList.remove('rating-red', 'rating-gray', 'rating-green');
        ratingElement.style.backgroundColor = '';

        if (isNaN(rating) || rating === null || rating === undefined || rating === 0) {
            ratingElement.textContent = '–';
            ratingElement.style.backgroundColor = '#4a4a4a';
            ratingElement.style.color = '#ccc';
            return;
        }
        ratingElement.textContent = `★ ${rating.toFixed(1)}`;
        if (rating < 5) ratingElement.classList.add('rating-red');
        else if (rating >= 5 && rating < 7) ratingElement.classList.add('rating-gray');
        else if (rating >= 7) ratingElement.classList.add('rating-green');
    }

    const popularMoviesGrid = document.querySelector('#popular .movie-grid');
    const nowPlayingMoviesGrid = document.querySelector('#now-playing .movie-grid');
    const placeholderMovies = [
        { id: 1, tmdb_id: 550, media_type: 'movie', title: 'Бойцовский клуб', name: 'Бойцовский клуб', poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3pmJK.jpg', vote_average: 8.4, overview: 'Сотрудник страховой компании страдает хронической бессонницей и отчаянно пытается вырваться из мучительно скучной жизни...' },
        { id: 2, tmdb_id: 1399, media_type: 'tv', title: 'Игра престолов', name: 'Игра престолов', poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg', vote_average: 8.4, overview: 'События разворачиваются на вымышленном континенте Вестерос, где несколько влиятельных домов ведут борьбу за Железный трон Семи Королевств.' },
        { id: 3, tmdb_id: 299536, media_type: 'movie', title: 'Мстители: Война бесконечности', name: 'Мстители: Война бесконечности', poster_path: '/mQsM262K0X2pIF01p50Xm7ie0jV.jpg', vote_average: 8.3, overview: 'Пока Мстители и их союзники продолжают защищать мир от различных опасностей, с которыми не смог бы справиться один супергерой, новая угроза возникает из космоса: Танос.' },
    ];
    function renderMovies(gridElement, movieList) {
        if (!gridElement) return;
        gridElement.innerHTML = '';
        movieList.forEach(movie => {
            const movieTile = document.createElement('div');
            movieTile.classList.add('movie-tile');
            movieTile.dataset.tmdbId = movie.tmdb_id || movie.id;
            movieTile.dataset.mediaType = movie.media_type || (movie.title && !movie.name ? 'movie' : 'tv');

            const ratingSpan = document.createElement('span');
            ratingSpan.classList.add('movie-rating');
            setRatingColor(ratingSpan, movie.vote_average);

            const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${movie.poster_path}` : (movie.poster || 'https://placehold.co/200x300/1a1a1a/ffffff?text=Нет+постера');
            let overview = movie.overview || 'Описание скоро будет...';
            if (overview.length > 100) overview = overview.substring(0, 97) + '...';
            const displayTitle = movie.title || movie.name;

            movieTile.innerHTML = `
                <img src="${posterUrl}" alt="${displayTitle}" onerror="this.onerror=null;this.src='https://placehold.co/200x300/1a1a1a/ffffff?text=Ошибка';">
                <div class="movie-details">
                    <h3>${displayTitle}</h3>
                    <p>${overview}</p>
                    <button class="action-button watch-from-tile-btn">Смотреть</button>
                </div>
            `;
            movieTile.insertBefore(ratingSpan, movieTile.querySelector('.movie-details'));
            gridElement.appendChild(movieTile);
        });
        initMovieTileInteractivity();
        document.querySelectorAll('.watch-from-tile-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const tile = e.target.closest('.movie-tile');
                if (tile && tile.dataset.tmdbId && tile.dataset.mediaType) {
                    window.location.href = `watch.html?tmdbId=${tile.dataset.tmdbId}&type=${tile.dataset.mediaType}`;
                }
            });
        });
    }
    if (popularMoviesGrid) renderMovies(popularMoviesGrid, placeholderMovies);
    if (nowPlayingMoviesGrid) renderMovies(nowPlayingMoviesGrid, placeholderMovies.slice(0,3).reverse());

}); // Конец DOMContentLoaded
