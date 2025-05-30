document.addEventListener('DOMContentLoaded', () => {
    // Select all series cards from the DOM
    // Выбираем все карточки серий из DOM
    const seriesCards = document.querySelectorAll('.series-card');
    // Flag to track if the main Kinobox script has been loaded
    // Флаг для отслеживания, был ли загружен основной скрипт Kinobox
    let kinoboxScriptLoaded = false;

    // Iterate over each series card to attach event listeners
    // Перебираем каждую карточку серии для добавления обработчиков событий
    seriesCards.forEach(card => {
        // Find the clickable tile and the player container within each card
        // Находим кликабельную плитку и контейнер плеера внутри каждой карточки
        const tile = card.querySelector('.series-tile');
        const playerContainer = card.querySelector('.player-container');

        // Safety check: if card structure is not as expected, log a warning and skip
        // Проверка безопасности: если структура карточки не соответствует ожидаемой, выводим предупреждение и пропускаем
        if (!tile || !playerContainer) {
            console.warn('Card structure incorrect. Expected .series-tile and .player-container within:', card);
            return;
        }

        // Add click event listener to the series tile
        // Добавляем обработчик клика на плитку серии
        tile.addEventListener('click', () => {
            // Get the TMDB ID from the data attribute of the tile
            // Получаем TMDB ID из data-атрибута плитки
            const tmdbId = tile.getAttribute('data-tmdb-id');
            // Check if the current player container is already active
            // Проверяем, активен ли уже текущий контейнер плеера
            const isActive = playerContainer.classList.contains('active');

            // Close all other active player containers
            // Закрываем все другие активные контейнеры плееров
            document.querySelectorAll('.player-container.active').forEach(activePlayerEl => {
                if (activePlayerEl !== playerContainer) {
                    activePlayerEl.classList.remove('active');
                    activePlayerEl.innerHTML = ''; // Clear content of other players
                                                  // Очищаем содержимое других плееров
                }
            });

            if (isActive) {
                // If the clicked player is already active, close it
                // Если кликнутый плеер уже активен, закрываем его
                playerContainer.classList.remove('active');
                playerContainer.innerHTML = ''; // Clear its content
                                              // Очищаем его содержимое
            } else {
                // If the clicked player is not active, open it

                // 1. Create the placeholder div for the Kinobox player
                // 1. Создаем div-заполнитель для плеера Kinobox
                playerContainer.innerHTML = '<div class="kinobox_player"></div>';
                const kinoboxPlayerDiv = playerContainer.querySelector('.kinobox_player');

                // 2. CRITICAL CHECK: Ensure the .kinobox_player div was created
                // 2. КРИТИЧЕСКАЯ ПРОВЕРКА: Убеждаемся, что div .kinobox_player был создан
                if (!kinoboxPlayerDiv) {
                    console.error('Critical Error: Failed to create or find .kinobox_player div within playerContainer.');
                    // Display an error message within the player container itself
                    // Отображаем сообщение об ошибке в самом контейнере плеера
                    playerContainer.innerHTML = '<p style="color: #ff6b6b; padding: 20px; text-align: center; font-size: 0.9em;">Ошибка: Не удалось подготовить область для загрузки плеера.</p>';
                    // Make the container visible to show the error
                    // Делаем контейнер видимым, чтобы показать ошибку
                    setTimeout(() => { playerContainer.classList.add('active'); }, 10);
                    return; // Stop further execution as the player cannot be initialized
                            // Прекращаем дальнейшее выполнение, так как плеер не может быть инициализирован
                }
                
                // Function to initialize the Kinobox player
                // Функция для инициализации плеера Kinobox
                const initializePlayer = () => {
                    if (typeof kbox === 'function') {
                        // If kbox function is available, initialize the player
                        // Если функция kbox доступна, инициализируем плеер
                        kbox(kinoboxPlayerDiv, { search: { tmdb: tmdbId } });
                    } else {
                        // If kbox function is not available, display an error
                        // Если функция kbox недоступна, отображаем ошибку
                        console.error('Kinobox SDK (kbox) is not available.');
                        if(kinoboxPlayerDiv) kinoboxPlayerDiv.innerHTML = '<p style="color: #ccc; font-size: 0.9em;">Ошибка: функция kbox не найдена.<br>Возможно, скрипт плеера не загрузился или заблокирован.</p>';
                    }
                };

                // Load the main Kinobox script if it hasn't been loaded yet
                // Загружаем основной скрипт Kinobox, если он еще не был загружен
                if (!kinoboxScriptLoaded && !document.querySelector('script[src="https://kinobox.tv/kinobox.min.js"]')) {
                    const script = document.createElement('script');
                    script.src = 'https://kinobox.tv/kinobox.min.js';
                    script.async = true; // Load asynchronously
                                         // Загружаем асинхронно
                    script.onload = () => {
                        kinoboxScriptLoaded = true; // Set flag to true
                                                    // Устанавливаем флаг в true
                        initializePlayer(); // Initialize player after script loads
                                            // Инициализируем плеер после загрузки скрипта
                    };
                    script.onerror = () => {
                        // Handle script loading errors
                        // Обрабатываем ошибки загрузки скрипта
                        console.error('Failed to load Kinobox script.');
                        if(kinoboxPlayerDiv) kinoboxPlayerDiv.innerHTML = '<p style="color: #ccc; font-size: 0.9em;">Не удалось загрузить скрипт плеера Kinobox.</p>';
                    }
                    document.head.appendChild(script); // Add script to head
                                                       // Добавляем скрипт в head
                } else {
                    // If script is already loaded or kbox is globally available
                    // Если скрипт уже загружен или kbox доступен глобально
                    if (typeof kbox === 'function') {
                        kinoboxScriptLoaded = true; // Ensure flag is set
                                                    // Убеждаемся, что флаг установлен
                        initializePlayer();
                    } else {
                        // Fallback: if kbox is not immediately available, try after a short delay
                        // Запасной вариант: если kbox недоступен сразу, пробуем через небольшую задержку
                        setTimeout(() => {
                            if (typeof kbox === 'function') {
                                kinoboxScriptLoaded = true;
                                initializePlayer();
                            } else {
                                 console.error('kbox still not available after delay.');
                                 if(kinoboxPlayerDiv) kinoboxPlayerDiv.innerHTML = '<p style="color: #ccc; font-size: 0.9em;">Плеер Kinobox не может быть инициализирован в данный момент.</p>';
                            }
                        }, 500); // 500ms delay
                    }
                }
                
                // Add 'active' class to show the player container with animation
                // Добавляем класс 'active' для отображения контейнера плеера с анимацией
                // A slight delay can help ensure CSS transitions trigger reliably
                // Небольшая задержка может помочь CSS-переходам срабатывать надежнее
                setTimeout(() => {
                   playerContainer.classList.add('active');
                }, 10); // 10ms delay

                // Optional: Scroll the card into view if it's not fully visible
                // Опционально: прокручиваем карточку в поле зрения, если она не полностью видна
                // card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    });
});
