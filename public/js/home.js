// home.js
document.addEventListener('DOMContentLoaded', () => {
    // Элементы для Hero секции, Navbar, и т.д.
    const heroVideo = document.querySelector('.hero-video');
    const heroFallback = document.querySelector('.hero-fallback');
    const soundButton = document.querySelector('.sound-button');
    const soundIcon = soundButton?.querySelector('i');
    const navbarButtons = document.querySelectorAll('.navbar-button');
    const profileButton = document.querySelector('.navbar-right a[href="profile.html"]');
    const heroSection = document.getElementById('hero-section');
    const heroContentVideoPlaying = document.querySelector('.hero-content-video-playing');
    const heroContentPosterActive = document.querySelector('.hero-content-poster-active');

    if (!heroVideo) console.error('Элемент .hero-video не найден!');
    if (!heroSection) console.error('Элемент #hero-section не найден!');
    if (!soundButton) console.error('Элемент .sound-button не найден!');
    if (!heroContentVideoPlaying) console.error('Элемент .hero-content-video-playing не найден!');
    if (!heroContentPosterActive) console.error('Элемент .hero-content-poster-active не найден!');

    // --- Код для модального окна поиска ---
    const newSearchButton = document.getElementById('search-button');
    const newSearchModal = document.getElementById('search-modal');
    let newSearchModalContent = null;

    if (newSearchModal) {
        newSearchModalContent = newSearchModal.querySelector('.search-modal-content');
    } else {
        console.error('[Модальное окно] Элемент #search-modal не найден на странице.');
    }

    if (newSearchButton && newSearchModal && newSearchModalContent) {
        console.log('[Модальное окно] Основные элементы для модального окна поиска найдены.');

        function openSearchModalWindow() {
            if (newSearchModal) {
                newSearchModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeSearchModalWindow() {
            if (newSearchModal) {
                newSearchModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        newSearchButton.addEventListener('click', function(event) {
            event.preventDefault();
            openSearchModalWindow();
        });

        newSearchModal.addEventListener('click', function(event) {
            if (event.target === newSearchModal) {
                closeSearchModalWindow();
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && newSearchModal.classList.contains('active')) {
                closeSearchModalWindow();
            }
        });
        console.log('[Модальное окно] Обработчики событий для модального окна поиска успешно прикреплены.');
    } else {
        if (!newSearchButton) console.error('[Модальное окно] Кнопка поиска (id="search-button") не найдена.');
        if (newSearchModal && !newSearchModalContent) console.error('[Модальное окно] Контент модального окна (class="search-modal-content") не найден.');
        console.error('[Модальное окно] Не удалось инициализировать функционал модального окна.');
    }

    // --- Логика для кастомных выпадающих списков в сайдбаре ---
    const customDropdowns = document.querySelectorAll('.search-modal-sidebar .custom-dropdown');

    customDropdowns.forEach(dropdown => {
        const toggleButton = dropdown.querySelector('.dropdown-toggle');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        // const applyButton = dropdownMenu.querySelector('.dropdown-apply-btn'); // Кнопка "Применить" больше не нужна
        const toggleSpan = toggleButton.querySelector('span');
        const initialToggleText = toggleSpan.textContent;

        if (toggleButton && dropdownMenu) {
            toggleButton.addEventListener('click', (event) => {
                event.stopPropagation();
                customDropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown && otherDropdown.classList.contains('open')) {
                        otherDropdown.classList.remove('open');
                    }
                });
                dropdown.classList.toggle('open');
            });

            const checkboxes = dropdownMenu.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    updateToggleText(dropdown, toggleSpan, initialToggleText); // Обновляем текст сразу
                    // Здесь можно добавить логику немедленного применения фильтров, если нужно
                    const selectedValues = [];
                    const checkedInMenu = dropdownMenu.querySelectorAll('input[type="checkbox"]:checked');
                    checkedInMenu.forEach(cb => selectedValues.push(cb.value));
                    console.log(`Фильтр "${dropdown.dataset.dropdownId}" изменен. Выбрано:`, selectedValues);
                });
            });
        }
    });

    function updateToggleText(dropdownElement, textElement, defaultText) {
        const selectedCheckboxes = dropdownElement.querySelectorAll('.dropdown-menu input[type="checkbox"]:checked');
        if (selectedCheckboxes.length > 0) {
            let selectedTexts = [];
            selectedCheckboxes.forEach(cb => {
                selectedTexts.push(cb.closest('label').textContent.trim());
            });
            if (selectedTexts.length <= 1) {
                textElement.textContent = selectedTexts.join(', ');
            } else {
                textElement.textContent = `${selectedTexts.length} выбрано`;
            }
        } else {
            textElement.textContent = defaultText;
        }
    }
    
    // --- Логика для кастомных стрелок у input[type="number"] ---
    document.querySelectorAll('.number-input-container').forEach(container => {
        const input = container.querySelector('input[type="number"]');
        const upArrow = container.querySelector('.up-arrow');
        const downArrow = container.querySelector('.down-arrow');

        if (input && upArrow && downArrow) {
            upArrow.addEventListener('click', () => {
                input.stepUp();
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });

            downArrow.addEventListener('click', () => {
                input.stepDown();
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
    });

    // Глобальный обработчик кликов
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
                activeTile.querySelector('.movie-details').style.transform = 'translateY(100%)';
            });
        }
    });

    // --- Существующий код для Hero секции ---
    if (heroVideo && heroFallback && heroSection && heroContentVideoPlaying && heroContentPosterActive) {
        heroVideo.volume = 0.1;
        heroVideo.muted = true;
        heroSection.classList.add('video-playing');
        heroSection.classList.remove('poster-active');
        heroVideo.style.opacity = '1';
        heroFallback.classList.remove('active');

        heroVideo.play().catch(error => {
            console.error('Ошибка воспроизведения видео:', error);
            heroVideo.style.opacity = '0';
            heroFallback.classList.add('active');
            heroVideo.style.pointerEvents = 'none';
            heroSection.classList.remove('video-playing');
            heroSection.classList.add('poster-active');
        });
        heroVideo.addEventListener('loadeddata', () => {
            heroSection.classList.add('video-playing');
            heroSection.classList.remove('poster-active');
            heroVideo.style.opacity = '1';
            heroFallback.classList.remove('active');
        });
        heroVideo.addEventListener('error', () => {
            heroVideo.style.opacity = '0';
            heroFallback.classList.add('active');
            heroSection.classList.remove('video-playing');
            heroSection.classList.add('poster-active');
        });
        heroVideo.addEventListener('ended', () => {
            heroVideo.style.opacity = '0';
            heroFallback.classList.add('active');
            heroVideo.style.pointerEvents = 'none';
            heroSection.classList.remove('video-playing');
            heroSection.classList.add('poster-active');
        });
        setTimeout(() => {
            if (heroVideo.paused && !heroSection.classList.contains('poster-active')) {
                heroVideo.style.opacity = '0';
                heroFallback.classList.add('active');
                heroVideo.style.pointerEvents = 'none';
                heroSection.classList.remove('video-playing');
                heroSection.classList.add('poster-active');
            }
        }, 10000);
    }

    // --- Существующий код для Navbar ---
    navbarButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            navbarButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const sectionId = this.dataset.section;
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                const offset = document.querySelector('.navbar').offsetHeight;
                window.scrollTo({
                    top: targetSection.offsetTop - offset,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Существующий код для кнопки звука ---
    if (soundButton && soundIcon && heroVideo) {
        soundButton.addEventListener('click', () => {
            if (heroVideo.muted) {
                heroVideo.muted = false;
                soundIcon.classList.remove('fa-volume-mute');
                soundIcon.classList.add('fa-volume-up');
            } else {
                heroVideo.muted = true;
                soundIcon.classList.remove('fa-volume-up');
                soundIcon.classList.add('fa-volume-mute');
            }
        });
    }

    // --- Существующий код для кнопки профиля ---
    profileButton?.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = 'profile.html';
    });

    // --- Существующий код для Movie Tile Interactivity ---
    function initMovieTileInteractivity() {
        document.querySelectorAll('.movie-tile').forEach(tile => {
            tile.removeEventListener('click', handleMovieTileClick);
            tile.addEventListener('click', handleMovieTileClick);
        });
    }

    function handleMovieTileClick(event) {
        const tile = event.currentTarget;
        const details = tile.querySelector('.movie-details');
        if (event.target.tagName === 'BUTTON') return;

        document.querySelectorAll('.movie-tile.active-details').forEach(activeTile => {
            if (activeTile !== tile) {
                activeTile.classList.remove('active-details');
                activeTile.querySelector('.movie-details').style.transform = 'translateY(100%)';
            }
        });

        if (tile.classList.contains('active-details')) {
            tile.classList.remove('active-details');
            details.style.transform = 'translateY(100%)';
        } else {
            tile.classList.add('active-details');
            details.style.transform = 'translateY(0)';
        }
    }
    
    // --- Код для цвета оценок ---
    function setRatingColor(ratingElement, ratingValue) {
        const rating = parseFloat(ratingValue);
        ratingElement.classList.remove('rating-red', 'rating-gray', 'rating-green'); // Сначала удаляем все классы цвета

        if (rating < 5) {
            ratingElement.classList.add('rating-red');
        } else if (rating >= 5 && rating <= 7) {
            ratingElement.classList.add('rating-gray');
        } else if (rating > 7) {
            ratingElement.classList.add('rating-green');
        }
    }


    // --- Существующий код для Placeholder Data и рендеринга фильмов ---
    const popularMoviesGrid = document.querySelector('#popular .movie-grid');
    const nowPlayingMoviesGrid = document.querySelector('#now-playing .movie-grid');
    const movies = [
        { title: 'Фильм 1: Начало', poster: 'https://placehold.co/200x300/1a1a1a/ffffff?text=Фильм+1', rating: '8.5', description: 'Очень интересный фильм о приключениях...' },
        { title: 'Сериал 2: Возвращение', poster: 'https://placehold.co/200x300/1a1a1a/ffffff?text=Сериал+2', rating: '4.1', description: 'Захватывающий сериал...' },
        { title: 'Фильм 3: Комедия', poster: 'https://placehold.co/200x300/1a1a1a/ffffff?text=Фильм+3', rating: '6.2', description: 'Легкая комедия для всей семьи...' },
        { title: 'Фильм 4: Триллер', poster: 'https://placehold.co/200x300/1a1a1a/ffffff?text=Фильм+4', rating: '7.0', description: 'Драматический триллер...' },
        { title: 'Сериал 5: Фантастика', poster: 'https://placehold.co/200x300/1a1a1a/ffffff?text=Сериал+5', rating: '9.5', description: 'Фантастический сериал о далеких мирах...' },
    ];

    function renderMovies(gridElement, movieList) {
        if (!gridElement) {
            console.error('Grid element for rendering movies not found');
            return;
        }
        gridElement.innerHTML = '';
        movieList.forEach(movie => {
            const movieTile = document.createElement('div');
            movieTile.classList.add('movie-tile');
            
            const ratingSpan = document.createElement('span');
            ratingSpan.classList.add('movie-rating');
            ratingSpan.textContent = movie.rating;
            setRatingColor(ratingSpan, movie.rating); // Устанавливаем цвет рейтинга

            movieTile.innerHTML = `
                <img src="${movie.poster}" alt="${movie.title}" onerror="this.onerror=null;this.src='https://placehold.co/200x300/1a1a1a/ffffff?text=Image+Not+Found';">
                <div class="movie-details">
                    <h3>${movie.title}</h3>
                    <p>${movie.description}</p>
                    <button class="action-button">Смотреть</button> 
                </div>
            `;
            movieTile.insertBefore(ratingSpan, movieTile.querySelector('.movie-details')); // Вставляем рейтинг перед деталями
            gridElement.appendChild(movieTile);
        });
        initMovieTileInteractivity();
    }

    if (popularMoviesGrid) renderMovies(popularMoviesGrid, movies);
    if (nowPlayingMoviesGrid) renderMovies(nowPlayingMoviesGrid, movies.slice().reverse());

}); // Конец DOMContentLoaded
