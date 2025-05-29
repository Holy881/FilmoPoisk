// watch.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Получение элементов DOM ---
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
    
    const backdropsGrid = document.getElementById('backdrops-grid'); 
    const postersGrid = document.getElementById('posters-grid');   
    const videosGrid = document.getElementById('videos-grid');

    // Элементы модального окна (Lightbox)
    const lightboxModal = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption'); // Оставляем, но не будем использовать
    const lightboxCloseButton = document.querySelector('.lightbox-close-button');


    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
    let currentUserData = null;
    let currentTmdbId = null;
    let currentMediaType = null;
    let currentItemData = null; 

    // --- Логика для навбара ---
    const userProfileLink = document.getElementById('user-profile-link');
    const userProfileIconContainer = document.getElementById('user-profile-icon-container');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
    const dropdownUsernameDisplay = document.getElementById('dropdown-username-display');
    const dropdownProfileButton = document.getElementById('dropdown-profile-button');
    const dropdownLogoutButton = document.getElementById('dropdown-logout-button');
    const DEFAULT_AVATAR_PATH = '/images/default-avatar.png';

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
    });

    // --- Функции для Lightbox ---
    function openLightbox(imageSrc) { // Убран captionText
        if (!lightboxModal || !lightboxImage || !lightboxCaption) return;
        lightboxImage.src = imageSrc;
        // lightboxCaption.textContent = ''; // Убираем установку подписи
        lightboxModal.classList.add('active');
        // Запускаем анимацию появления изображения после того, как модальное окно станет display:flex
        requestAnimationFrame(() => {
            if(lightboxImage) lightboxImage.style.opacity = '1';
            if(lightboxImage) lightboxImage.style.transform = 'scale(1)';
        });
        document.body.style.overflow = 'hidden'; 
    }

    function closeLightbox() {
        if (!lightboxModal || !lightboxImage) return;
        
        // Запускаем анимацию исчезновения изображения
        lightboxImage.style.opacity = '0';
        lightboxImage.style.transform = 'scale(0.8)';

        // Ждем завершения анимации изображения перед скрытием модального окна
        setTimeout(() => {
            lightboxModal.classList.remove('active');
            document.body.style.overflow = ''; 
            lightboxImage.src = ''; 
            // if (lightboxCaption) lightboxCaption.textContent = ''; // Подпись уже не используется
        }, 300); // Должно совпадать с transition-duration в SCSS для lightbox-content
    }

    if (lightboxCloseButton) {
        lightboxCloseButton.addEventListener('click', closeLightbox);
    }
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (event) => {
            if (event.target === lightboxModal) {
                closeLightbox();
            }
        });
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
            closeLightbox();
        }
    });


    function createShelfElement(id, titleText, isEmptyShelf = false) {
        const shelfSection = document.createElement('section');
        shelfSection.className = 'movie-shelf';
        if (isEmptyShelf) shelfSection.classList.add('empty-shelf-placeholder');
        shelfSection.id = id;
        
        if (titleText) {
            const title = document.createElement('h2');
            title.textContent = titleText;
            shelfSection.appendChild(title);
        }

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

    function createMovieTile(movie) {
        const tile = document.createElement('a');
        tile.className = 'movie-tile';
        tile.href = `watch.html?tmdbId=${movie.id}&type=${movie.media_type || currentMediaType}`; 
        const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${movie.poster_path}` : '/images/default-poster.jpg';
        
        tile.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title || movie.name}" class="movie-poster-img" loading="lazy" onerror="this.onerror=null;this.src='/images/error.png';">
            <div class="movie-hover-details">
                <h3>${movie.title || movie.name}</h3>
            </div>
        `;
        return tile;
    }
    
    function renderShelf(shelfElement, moviesData) {
        if (!shelfElement) return;
        const grid = shelfElement.querySelector('.shelf-grid');
        if (!grid) return;
        grid.innerHTML = '';
        if (!moviesData || moviesData.length === 0) {
            return;
        }
        moviesData.slice(0, 15).forEach(movie => {
            grid.appendChild(createMovieTile(movie));
        });
    }

    function applyRatingStyles(targetElement, ratingValue) {
        if (!targetElement) return;
        const rating = parseFloat(ratingValue);
        targetElement.classList.remove('rating-red', 'rating-gray', 'rating-green', 'rating-none');
        targetElement.style.backgroundColor = ''; 
        if (isNaN(rating) || rating === 0 || rating < 1) {
            targetElement.textContent = '–';
            targetElement.classList.add('rating-none');
        } else {
            targetElement.textContent = `${rating.toFixed(1)}`; 
            if (rating < 5) targetElement.classList.add('rating-red');
            else if (rating < 7) targetElement.classList.add('rating-gray');
            else targetElement.classList.add('rating-green');
        }
    }
    
    function showToastNotification(message, isError = false, duration = 3000) {
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-notification-message');
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.className = 'toast-notification'; 
        toast.classList.add(isError ? 'error' : 'success');
        toast.classList.add('active');
        
        if (toast.toastTimeout) {
            clearTimeout(toast.toastTimeout);
        }
        toast.toastTimeout = setTimeout(() => toast.classList.remove('active'), duration);
    }

    function formatCurrency(amount) {
        if (amount === 0 || !amount) return 'N/A';
        return '$' + amount.toLocaleString('en-US');
    }
    
    function getNamesList(array, limit = 5) {
        if (!array || array.length === 0) return 'N/A';
        return array.slice(0, limit).map(item => item.name).join(', ') + (array.length > limit ? ' и др.' : '');
    }

    async function getItemListStatus(userId, tmdbId, mediaType) {
        if (!userId || !tmdbId || !mediaType) return null;
        try {
            const response = await fetch(`/api/user/${userId}/lists?tmdb_id=${tmdbId}&media_type=${mediaType}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Ошибка при запросе статуса элемента списка:', error);
            return null;
        }
    }

    function updateListCategoryDropdownCheckmarks() {
        if (!catalogCategoryDropdown || !currentItemData) return;
        catalogCategoryDropdown.querySelectorAll('button').forEach(button => {
            const existingCheckmark = button.querySelector('.list-category-checkmark');
            if (existingCheckmark) existingCheckmark.remove();
            const checkmarkContainer = document.createElement('span');
            checkmarkContainer.className = 'list-category-checkmark'; 
            if (currentItemData.userListCategory && button.dataset.category === currentItemData.userListCategory) {
                const checkmark = document.createElement('i');
                checkmark.className = 'fas fa-check'; 
                checkmarkContainer.appendChild(checkmark);
            } else {
                checkmarkContainer.innerHTML = ' '; 
            }
            button.prepend(checkmarkContainer); 
        });
    }

    async function fetchAndDisplayDetails(tmdbId, mediaType) {
        currentTmdbId = tmdbId; 
        currentMediaType = mediaType;
        
        try {
            const response = await fetch(`/api/tmdb/details/${mediaType}/${tmdbId}?append_to_response=images`); 
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные о контенте.');
            }
            const data = await response.json();
            currentItemData = { ...data, media_type: mediaType, userListCategory: null }; 
            document.title = `${currentItemData.title || currentItemData.name} - ФильмоПОИСК`;
            
            if (bgImage) {
                const newBgSrc = currentItemData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}original${currentItemData.backdrop_path}` : '/images/no_image.png';
                bgImage.onerror = function() {
                    this.onerror=null; 
                    this.src='https://placehold.co/1920x1080/0D0D0D/333333?text=Error+Loading+Background';
                    this.alt='Ошибка загрузки фона';
                };
                bgImage.src = newBgSrc;
            }

            if (posterImage) {
                const newPosterSrc = currentItemData.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${currentItemData.poster_path}` : '/images/default-poster.jpg';
                posterImage.onerror = function() {
                    this.onerror=null; 
                    this.src='https://placehold.co/500x750/1A1A1A/555555?text=Error+Loading+Poster';
                    this.alt='Ошибка загрузки постера';
                };
                posterImage.src = newPosterSrc;
            }

            if (titleElement) titleElement.textContent = currentItemData.title || currentItemData.name;
            if (statusElement) statusElement.textContent = currentItemData.status === 'Released' ? 'Вышел' : (currentItemData.status || 'Неизвестно');
            if (typeElement) typeElement.textContent = mediaType === 'movie' ? 'Фильм' : 'Сериал';
            if (episodesElement) episodesElement.textContent = mediaType === 'tv' ? `${currentItemData.number_of_episodes || 'N/A'} эп.` : '';
            const releaseYear = currentItemData.release_date || currentItemData.first_air_date;
            if (yearElement) yearElement.textContent = releaseYear ? new Date(releaseYear).getFullYear() : 'N/A';
            
            if (ageRatingElement) {
                let itemAgeRatingText = 'N/A';
                if (currentItemData.content_ratings?.results) { 
                    const ruRating = currentItemData.content_ratings.results.find(r => r.iso_3166_1 === 'RU');
                    if (ruRating?.rating) itemAgeRatingText = ruRating.rating;
                } else if (currentItemData.release_dates?.results) { 
                     const ruRelease = currentItemData.release_dates.results.find(r => r.iso_3166_1 === 'RU');
                     if (ruRelease?.release_dates?.length > 0) {
                         const cert = ruRelease.release_dates.find(rd => rd.certification && rd.certification !== "");
                         if (cert) itemAgeRatingText = cert.certification;
                     }
                }
                ageRatingElement.textContent = itemAgeRatingText;
            }

            if (descriptionElement) descriptionElement.textContent = currentItemData.overview || 'Описание отсутствует.';
            if (ratingBadge) applyRatingStyles(ratingBadge, currentItemData.vote_average);

            if (infoListContainer) {
                infoListContainer.innerHTML = ''; 
                const detailsMap = {
                    "original_title": { label: "Оригинальное название", value: currentItemData.original_title || currentItemData.original_name },
                    "studios": { label: "Студия", value: currentItemData.production_companies?.map(c => c.name).join(', ') }, 
                    "status": { label: "Статус", value: currentItemData.status === 'Released' ? 'Вышел' : (currentItemData.status || 'Неизвестно') },
                    "number_of_episodes": { label: "Количество эпизодов", value: mediaType === 'tv' ? currentItemData.number_of_episodes : null },
                    "first_air_date": { label: "Год выпуска", value: releaseYear ? new Date(releaseYear).getFullYear() : 'N/A' },
                    "genres": { label: "Жанры", value: currentItemData.genres?.map(g => g.name).join(', ') },
                    "countries": { label: "Страна производства", value: currentItemData.production_countries?.map(c => c.name).join(', ') },
                    "runtime": { label: "Длительность эпизода", value: mediaType === 'tv' ? `${currentItemData.episode_run_time?.[0] || 'N/A'} мин.` : `${currentItemData.runtime || 'N/A'} мин.` },
                    "actors": { label: "Актеры", value: getNamesList(currentItemData.credits?.cast, 10) }, 
                    "directors": { label: "Директоры", value: getNamesList(currentItemData.credits?.crew?.filter(p => p.job === "Director"), 5) },
                    "producers": { label: "Продюсеры", value: getNamesList(currentItemData.credits?.crew?.filter(p => p.department === "Production" && (p.job === "Producer" || p.job === "Executive Producer")), 5) },
                };
                for (const key in detailsMap) {
                    const item = detailsMap[key];
                    if (item.value && item.value !== 'N/A' && String(item.value).trim() !== '' && item.value !== 0) { 
                        const infoEl = document.createElement('div');
                        infoEl.className = 'anime_info_el';
                        infoEl.innerHTML = `<span class="anime_info_el_key">${item.label}</span><span class="anime_info_el_value">${item.value}</span>`;
                        infoListContainer.appendChild(infoEl);
                    }
                }
            }

            if (backdropsGrid) {
                backdropsGrid.innerHTML = ''; 
                let backdropsAdded = 0;
                if (currentItemData.images?.backdrops && currentItemData.images.backdrops.length > 0) {
                    currentItemData.images.backdrops.slice(0, 18).forEach(img => { 
                        if (!img.file_path) return; 
                        const backdropEl = document.createElement('div');
                        backdropEl.className = 'backdrop-item media-item'; 
                        const smallImgSrc = `${TMDB_IMAGE_BASE_URL}w780${img.file_path}`;
                        const largeImgSrc = `${TMDB_IMAGE_BASE_URL}original${img.file_path}`;
                        backdropEl.innerHTML = `<img src="${smallImgSrc}" alt="Задник" onerror="this.onerror=null; this.src='https://placehold.co/780x439/1A1A1A/555555?text=Error'; this.alt='Ошибка загрузки задника';">`; 
                        backdropEl.addEventListener('click', () => openLightbox(largeImgSrc)); // Убрана подпись
                        backdropsGrid.appendChild(backdropEl);
                        backdropsAdded++;
                    });
                }
                if (backdropsAdded === 0 && backdropsGrid.innerHTML === '') {
                     backdropsGrid.innerHTML = '<p class="empty-tab-message">Задники отсутствуют или не удалось загрузить.</p>';
                }
            }

            if (postersGrid) {
                postersGrid.innerHTML = '';
                let postersAdded = 0;
                if (currentItemData.images?.posters && currentItemData.images.posters.length > 0) {
                    currentItemData.images.posters.slice(0, 18).forEach(img => { 
                        if (!img.file_path) return; 
                        const posterEl = document.createElement('div');
                        posterEl.className = 'poster-item media-item'; 
                        const smallImgSrc = `${TMDB_IMAGE_BASE_URL}w342${img.file_path}`;
                        const largeImgSrc = `${TMDB_IMAGE_BASE_URL}original${img.file_path}`;
                        posterEl.innerHTML = `<img src="${smallImgSrc}" alt="Постер" onerror="this.onerror=null; this.src='https://placehold.co/342x513/1A1A1A/555555?text=Error'; this.alt='Ошибка загрузки постера';">`;
                        posterEl.addEventListener('click', () => openLightbox(largeImgSrc)); // Убрана подпись
                        postersGrid.appendChild(posterEl);
                        postersAdded++;
                    });
                }
                 if (postersAdded === 0 && postersGrid.innerHTML === '') { 
                    postersGrid.innerHTML = '<p class="empty-tab-message">Постеры отсутствуют или не удалось загрузить.</p>';
                }
            }

            if (videosGrid) {
                videosGrid.innerHTML = ''; 
                const trailers = currentItemData.videos?.results?.filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || [];
                if (trailers.length > 0) {
                    trailers.slice(0, 12).forEach(video => { 
                        const videoEl = document.createElement('div');
                        videoEl.className = 'video-item media-item';
                        videoEl.innerHTML = `
                            <img src="https://i.ytimg.com/vi/${video.key}/mqdefault.jpg" alt="${video.name}" onerror="this.onerror=null; this.src='https://placehold.co/320x180/1A1A1A/555555?text=No+Trailer+Thumb'; this.alt='Нет превью трейлера';">
                            <div class="play-icon"><i class="fas fa-play"></i></div>
                        `;
                        videoEl.addEventListener('click', () => {
                            window.open(`https://www.youtube.com/watch?v=${video.key}`, '_blank');
                        });
                        videosGrid.appendChild(videoEl);
                    });
                } else {
                    videosGrid.innerHTML = '<p class="empty-tab-message">Трейлеры отсутствуют.</p>';
                }
            }
            
            const similarTab = document.getElementById('tab-similar');
            const recommendationsTab = document.getElementById('tab-recommendations');
            
            if (similarTab) {
                similarTab.innerHTML = ''; 
                if (currentItemData.similar?.results?.length > 0) {
                    const shelf = createShelfElement('similar-shelf', '', currentItemData.similar.results.length === 0);
                    renderShelf(shelf, currentItemData.similar.results.map(item => ({...item, tmdb_id: item.id, media_type: mediaType})));
                    similarTab.appendChild(shelf);
                } else {
                    similarTab.innerHTML = '<p class="empty-tab-message">Похожих не найдено.</p>';
                }
            }

            if (recommendationsTab) {
                recommendationsTab.innerHTML = ''; 
                if (currentItemData.recommendations?.results?.length > 0) {
                    const shelf = createShelfElement('recommendations-shelf', '', currentItemData.recommendations.results.length === 0);
                    renderShelf(shelf, currentItemData.recommendations.results.map(item => ({...item, tmdb_id: item.id, media_type: mediaType})));
                    recommendationsTab.appendChild(shelf);
                } else {
                    recommendationsTab.innerHTML = '<p class="empty-tab-message">Рекомендаций не найдено.</p>';
                }
            }

            const userId = localStorage.getItem('userId');
            if (userId && currentItemData) { 
                const listItemData = await getItemListStatus(userId, currentItemData.id, currentItemData.media_type);
                currentItemData.userListCategory = listItemData ? listItemData.category : null;
            }
            updateListCategoryDropdownCheckmarks();

        } catch (error) {
            if (watchPageContainer) watchPageContainer.innerHTML = `<h1>Ошибка загрузки. Пожалуйста, попробуйте позже.</h1><p>${error.message}</p>`;
        }
    }

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
            currentItemData.userListCategory = listItemData ? listItemData.category : null;
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
                const { id: tmdb_id, media_type, title, name, poster_path } = currentItemData;
                const itemTitle = title || name;
                const dataToSend = {
                    tmdb_id: parseInt(tmdb_id, 10),
                    media_type: media_type,
                    category: selectedCategory,
                    title: itemTitle,
                    poster_path: poster_path,
                    rating: null 
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
                    } else {
                        showToastNotification(`Ошибка: ${result.error || 'Не удалось обновить список.'}`, true);
                    }
                } catch (error) {
                    console.error('Сетевая ошибка или ошибка сервера:', error);
                    showToastNotification('Сетевая ошибка при обновлении списка.', true);
                } finally {
                    catalogCategoryDropdown.classList.remove('active');
                }
            });
        });
    }

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
                if (targetPane) targetPane.classList.add('active');
            }
        });
    }

    if (watchNowMainBtn) {
        watchNowMainBtn.addEventListener('click', () => {
            if (currentTmdbId && currentMediaType) {
                showToastNotification(`Запуск плеера для ID ${currentTmdbId} (${currentMediaType})... (демо)`, false);
            } else {
                showToastNotification('Не удалось определить ID или тип контента для просмотра.', true);
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    const tmdbIdParam = params.get('tmdbId');
    const mediaTypeParam = params.get('type');
    
    if (tmdbIdParam && mediaTypeParam) {
        fetchAndDisplayDetails(tmdbIdParam, mediaTypeParam);
    } else {
        if (watchPageContainer) watchPageContainer.innerHTML = '<h1>Ошибка: ID или тип контента не указаны в URL.</h1>';
    }
    
    updateUserProfileDisplay();
});
