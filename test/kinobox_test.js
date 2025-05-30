document.addEventListener('DOMContentLoaded', () => {
    const episodeItems = document.querySelectorAll('.episode-item');
    let activePlayerCardElement = null; 

    // Скрипт Kinobox загружается в HTML, поэтому ensureKinoboxScript не нужен.
    // Мы просто проверяем наличие window.kbox перед использованием.

    function openPlayer(clickedEpisodeItem) {
        const playerWrapper = clickedEpisodeItem.querySelector('.episode-player-wrapper');
        // Целевой div для Kinobox теперь всегда есть в HTML
        const kinoboxPlayerDiv = playerWrapper.querySelector('.kinobox-active-player-target.kinobox_player'); 
        const tmdbId = clickedEpisodeItem.dataset.tmdbId;

        if (!playerWrapper || !kinoboxPlayerDiv || !tmdbId) {
            console.error("Не найдены необходимые элементы (wrapper, target или TMDB ID) для карточки:", clickedEpisodeItem.id);
            return;
        }

        const isCurrentlyActive = playerWrapper.classList.contains('active');

        // 1. Закрыть все другие активные плееры
        episodeItems.forEach(item => {
            const otherPlayerWrapper = item.querySelector('.episode-player-wrapper');
            if (otherPlayerWrapper !== playerWrapper && otherPlayerWrapper.classList.contains('active')) {
                console.log("Закрытие другого активного плеера для:", item.id);
                otherPlayerWrapper.classList.remove('active');
                otherPlayerWrapper.querySelector('.kinobox_player').innerHTML = ''; // Очищаем содержимое старого плеера
            }
        });

        if (isCurrentlyActive) {
            // 2. Если кликнули на уже активный, закрываем его
            console.log("Закрытие текущего активного плеера для:", clickedEpisodeItem.id);
            playerWrapper.classList.remove('active');
            kinoboxPlayerDiv.innerHTML = ''; // Очищаем содержимое
            activePlayerCardElement = null;
        } else {
            // 3. Открываем новый или закрытый ранее
            console.log("Открытие плеера для:", clickedEpisodeItem.id, "TMDB ID:", tmdbId);
            kinoboxPlayerDiv.innerHTML = ''; // Очищаем на случай, если там было сообщение об ошибке
            
            activePlayerCardElement = clickedEpisodeItem;

            const initializeActualPlayer = () => {
                if (activePlayerCardElement !== clickedEpisodeItem) {
                    console.log("Открытие отменено для", clickedEpisodeItem.id, "так как активной стала другая карточка.");
                    return;
                }
                if (typeof window.kbox === 'function') {
                    console.log(`Инициализация Kinobox для TMDB ID: ${tmdbId} в`, kinoboxPlayerDiv);
                    try {
                        window.kbox(kinoboxPlayerDiv, { 
                            search: { tmdb: tmdbId },
                            menu: { enable: true, default: 'menu_list', mobile: 'menu_button' },
                            players: { alloha: { enable: true, position: 1 }, kodik: { enable: true, position: 2 } },
                            notFoundMessage: 'К сожалению, видео не найдено.'
                        });
                    } catch (e) {
                        console.error("Ошибка при вызове kbox():", e);
                        kinoboxPlayerDiv.innerHTML = '<p>Ошибка при вызове kbox().</p>';
                    }
                } else {
                    console.error('Kinobox SDK (kbox) не доступен. Убедитесь, что скрипт kinobox.min.js загружен и выполнен.');
                    kinoboxPlayerDiv.innerHTML = '<p>Ошибка: функция kbox не найдена.</p>';
                }
            };
            
            // Задержка перед инициализацией и показом, чтобы CSS успел примениться, если нужно
            requestAnimationFrame(() => {
                initializeActualPlayer();

                // Добавляем класс active для анимации выезда ПОСЛЕ вызова kbox
                // (или по крайней мере после попытки его вызвать)
                setTimeout(() => {
                    if (activePlayerCardElement === clickedEpisodeItem) { 
                        playerWrapper.classList.add('active');
                        console.log("Контейнер плеера сделан активным для:", clickedEpisodeItem.id);

                        setTimeout(() => {
                            if (playerWrapper.classList.contains('active')) {
                                const rect = playerWrapper.getBoundingClientRect();
                                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                                const isOutOfView = rect.top < 0 || rect.bottom > viewportHeight || 
                                                    rect.top > viewportHeight || rect.bottom < 0;
                                if (isOutOfView) {
                                     console.log("Прокрутка плеера в видимую зону (nearest). Top:", rect.top, "Bottom:", rect.bottom);
                                     playerWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                } else {
                                     console.log("Плеер уже достаточно видим. Прокрутка не требуется.");
                                }
                            }
                        }, 150);
                    }
                }, 50); // Задержка перед активацией CSS анимации выезда
            });
        }
    }

    episodeItems.forEach(item => {
        const tile = item.querySelector('.episode-item-main-content');
        const closeButton = item.querySelector('.close-inline-player-btn');

        if (tile) {
            tile.addEventListener('click', () => {
                openPlayer(item); 
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const parentCard = e.target.closest('.episode-item');
                if (parentCard) {
                    const playerWrapper = parentCard.querySelector('.episode-player-wrapper');
                    const kinoboxPlayerDiv = playerWrapper.querySelector('.kinobox_player');
                    playerWrapper.classList.remove('active');
                    kinoboxPlayerDiv.innerHTML = '';
                    if(activePlayerCardElement === parentCard) {
                        activePlayerCardElement = null;
                    }
                    console.log("Плеер закрыт кнопкой для:", parentCard.id);
                }
            });
        }
    });
});
