document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    const usernameElement = document.querySelector('.username');
    const emailElement = document.querySelector('.email');
    const avatarPreview = document.getElementById('avatar-preview');
    const navAvatar = document.getElementById('nav-avatar');
    const avatarContainer = document.querySelector('.avatar-container');
    const logoutBtn = document.getElementById('logout-btn');
    const avatarInput = document.getElementById('avatar-input');
    const cropModal = document.getElementById('crop-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const cropBtn = document.getElementById('crop-btn');
    const cancelCropBtn = document.getElementById('cancel-crop-btn');
    const passwordModal = document.getElementById('password-modal');
    const savePasswordBtn = document.getElementById('save-password-btn');
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');
    const editModal = document.getElementById('edit-modal');
    const editInput = document.getElementById('edit-input');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const accountBtn = document.querySelector('.account-btn');
    const catalogBtn = document.querySelector('.catalog-btn');
    const homeBtn = document.querySelector('.home-btn');
    const profileContainer = document.querySelector('.profile-container');
    const listsContainer = document.querySelector('.lists-container');
    const itemsGrid = document.querySelector('.items-grid');
    const emptyState = document.querySelector('.empty-state');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.querySelector('.confirm-delete');
    const cancelDeleteModalBtn = deleteModal.querySelector('.cancel-delete');
    const closeDeleteModalBtn = deleteModal.querySelector('.close-btn');
    const categoryModal = document.getElementById('category-modal');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const cancelCategoryModalBtn = document.getElementById('cancel-category-btn');
    const dropdownBtn = document.querySelector('.lists-container .dropdown-btn');
    const dropdownContent = document.querySelector('.lists-container .dropdown-content');
    const categorySelector = document.querySelector('.category-selector');
    const catalogHeader = listsContainer.querySelector('h2');
    const profileHeader = profileContainer.querySelector('h2');
    const pagination = document.querySelector('.pagination');
    const navbar = document.querySelector('.navbar'); 

    let cropper;
    let currentFieldToEdit;
    let currentItemIdToDeleteOrEdit;
    let currentCategoryFilter = 'Все категории';
    let currentPageInCatalog = 1;
    const itemsPerPage = 12; // Это значение должно совпадать с limit на сервере для корректной пагинации

    const DEFAULT_AVATAR_PATH = '/images/default-avatar.png';
    const DEFAULT_POSTER_PATH = '/images/default-poster.jpg';

    if (!userId) {
        window.location.href = 'auth.html';
        return;
    }

    // --- Navbar Scroll Effect ---
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true }); // Добавлено passive:true для лучшей производительности
    }

    // --- Функция установки цвета для рейтинга ---
    function setRatingColor(ratingElement, ratingValue) {
        if (!ratingElement) return;
        const rating = parseFloat(ratingValue);
        ratingElement.classList.remove('rating-red', 'rating-gray', 'rating-green');
        ratingElement.style.backgroundColor = ''; 

        if (isNaN(rating) || rating === null || rating === undefined) {
            ratingElement.textContent = '–'; 
            ratingElement.style.backgroundColor = '#4a4a4a'; 
            ratingElement.style.color = '#ccc';
            return;
        }
        
        ratingElement.textContent = `★ ${rating.toFixed(1)}`; 

        if (rating < 5) {
            ratingElement.classList.add('rating-red');
        } else if (rating >= 5 && rating <= 7) {
            ratingElement.classList.add('rating-gray');
        } else if (rating > 7) {
            ratingElement.classList.add('rating-green');
        }
    }

    // Инициализация состояния страницы
    if (profileContainer && listsContainer && accountBtn && profileHeader && catalogHeader && categorySelector && pagination) {
        profileContainer.classList.add('visible');
        profileContainer.classList.remove('hidden', 'entering'); // Убираем entering, если он был
        profileHeader.classList.add('visible'); // Убедимся, что заголовок профиля видим

        listsContainer.classList.add('hidden');
        listsContainer.classList.remove('visible', 'entering');
        accountBtn.classList.add('active');
        catalogBtn.classList.remove('active'); // Убедимся, что кнопка каталога не активна

        // Скрываем элементы каталога при инициализации, если активна вкладка аккаунта
        if(catalogHeader) catalogHeader.classList.remove('visible'); 
        if(categorySelector) categorySelector.classList.remove('visible'); 
        if(pagination) pagination.classList.remove('visible'); 
    } else {
        console.error("Ошибка: не найдены основные контейнеры профиля или кнопки навигации.");
    }

    // Загрузка данных пользователя
    try {
        const response = await fetch(`http://localhost:3000/api/user/${userId}`);
        const userData = await response.json();
        if (response.ok) {
            if (usernameElement) usernameElement.textContent = userData.username || 'Не указано';
            if (emailElement) emailElement.textContent = '********' + (userData.email || 'скрыто').slice(-5);
            let avatarSrc = DEFAULT_AVATAR_PATH;
            if (userData.avatar) {
                avatarSrc = userData.avatar.startsWith('/') ? userData.avatar : `/${userData.avatar.replace(/\\/g, "/")}`;
            }
            if (navAvatar) {
                navAvatar.src = avatarSrc;
                navAvatar.onerror = () => { navAvatar.src = DEFAULT_AVATAR_PATH; }
            }
            if (avatarPreview) {
                avatarPreview.src = avatarSrc;
                avatarPreview.onerror = () => { avatarPreview.src = DEFAULT_AVATAR_PATH; }
            }
        } else {
            console.error('Ошибка загрузки данных пользователя:', userData.error);
        }
    } catch (error) {
        console.error('Ошибка сети при загрузке данных пользователя:', error.message);
    }

    // --- Логика переключения вкладок (упрощенная для display) ---
    function switchTab(tabToShow, tabToHide) {
        if (tabToHide) {
            tabToHide.classList.remove('visible');
            tabToHide.classList.add('hidden');
        }
        if (tabToShow) {
            tabToShow.classList.remove('hidden');
            tabToShow.classList.add('visible');
        }

        // Управление видимостью элементов каталога
        const catalogHeaderLocal = listsContainer ? listsContainer.querySelector('h2') : null;
        const categorySelectorLocal = listsContainer ? listsContainer.querySelector('.category-selector') : null;
        const paginationLocal = document.querySelector('.pagination');

        if (tabToShow === listsContainer) {
            if(catalogHeaderLocal) catalogHeaderLocal.style.display = 'block';
            if(categorySelectorLocal) categorySelectorLocal.style.display = 'block';
            if(paginationLocal && paginationLocal.querySelector('button')) { 
                paginationLocal.style.display = 'flex';
            } else if (paginationLocal) {
                 paginationLocal.style.display = 'none';
            }
        } else { // Если активна вкладка Аккаунт
            if(catalogHeaderLocal) catalogHeaderLocal.style.display = 'none';
            if(categorySelectorLocal) categorySelectorLocal.style.display = 'none';
            if(paginationLocal) paginationLocal.style.display = 'none';
        }
    }

    if (accountBtn && catalogBtn && profileContainer && listsContainer) {
        accountBtn.addEventListener('click', () => {
            if (!accountBtn.classList.contains('active')) {
                accountBtn.classList.add('active'); catalogBtn.classList.remove('active');
                switchTab(profileContainer, listsContainer);
            }
        });
        catalogBtn.addEventListener('click', async () => {
            if (!catalogBtn.classList.contains('active')) {
                catalogBtn.classList.add('active'); accountBtn.classList.remove('active');
                switchTab(listsContainer, profileContainer); 
                if(itemsGrid) itemsGrid.classList.add('loading'); 
                await loadItems(currentCategoryFilter, 1); 
                if(itemsGrid) itemsGrid.classList.remove('loading');
            }
        });
    }
    
    // Обработчики для строк информации профиля
    document.querySelectorAll('.info-row').forEach(row => {
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = row.dataset.action;
            currentFieldToEdit = action; 
            if (action === 'avatar') {
                if (avatarInput) avatarInput.click();
            } else if (action === 'username' || action === 'email') {
                if(editModal && editInput) {
                    editModal.style.display = 'flex'; editModal.classList.add('active');
                    disableInteractiveElements(true, row);
                    editInput.value = ''; 
                    editInput.placeholder = action === 'username' ? 'Новое имя пользователя' : 'Новая почта';
                    editInput.focus();
                }
            } else if (action === 'password') {
                if(passwordModal) {
                    passwordModal.style.display = 'flex'; passwordModal.classList.add('active');
                    disableInteractiveElements(true, row);
                }
            }
        });
    });

    // Загрузка и обрезка аватара
    if (avatarInput && imageToCrop && cropModal && cropBtn && cancelCropBtn) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imageToCrop.src = event.target.result;
                    cropModal.style.display = 'flex'; cropModal.classList.add('active');
                    disableInteractiveElements(true);
                    if (cropper) cropper.destroy();
                    cropper = new Cropper(imageToCrop, {
                        aspectRatio: 1, viewMode: 1, dragMode: 'move', autoCropArea: 0.8, 
                        cropBoxResizable: true, cropBoxMovable: true, toggleDragModeOnDblclick: false,
                        ready() { if(this.cropper) this.cropper.setCropBoxData({ width: 150, height: 150 }); }
                    });
                };
                reader.readAsDataURL(file);
            }
        });
        cropBtn.addEventListener('click', async () => {
            if (!cropper) return;
            const canvas = cropper.getCroppedCanvas({ width: 150, height: 150 });
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
            const formData = new FormData();
            formData.append('avatar', blob, 'avatar.jpg');
            try {
                const response = await fetch(`http://localhost:3000/api/user/${userId}/avatar`, { method: 'POST', body: formData });
                const data = await response.json();
                if (response.ok && data.avatarUrl) {
                    const newAvatarSrc = `${data.avatarUrl}?t=${new Date().getTime()}`;
                    if(navAvatar) { navAvatar.src = newAvatarSrc; navAvatar.onerror = () => { navAvatar.src = DEFAULT_AVATAR_PATH; }}
                    if(avatarPreview) { avatarPreview.src = newAvatarSrc; avatarPreview.onerror = () => { avatarPreview.src = DEFAULT_AVATAR_PATH; }}
                    closeAndResetCropModal();
                } else { console.error('Ошибка загрузки аватара: ' + (data.error || 'Неизвестная ошибка')); }
            } catch (error) { console.error('Ошибка сети при загрузке аватара: ' + error.message); }
        });
        cancelCropBtn.addEventListener('click', closeAndResetCropModal);
    }
    function closeAndResetCropModal() {
        if(cropModal) cropModal.classList.remove('active');
        disableInteractiveElements(false);
        if (cropper) cropper.destroy(); cropper = null;
        if(avatarInput) avatarInput.value = '';
        if(imageToCrop) imageToCrop.src = '';
        setTimeout(() => { if(cropModal) cropModal.style.display = 'none'; }, 300);
    }

    // Редактирование имени/почты
    if (saveEditBtn && cancelEditBtn && editModal && editInput) {
        saveEditBtn.addEventListener('click', async () => {
            const newValue = editInput.value.trim();
            if (!newValue) { console.error('Поле не может быть пустым'); return; }
            try {
                const response = await fetch(`http://localhost:3000/api/user/${userId}/update`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ field: currentFieldToEdit, value: newValue })
                });
                const data = await response.json();
                if (response.ok) {
                    if (currentFieldToEdit === 'username' && usernameElement) usernameElement.textContent = newValue;
                    else if (currentFieldToEdit === 'email' && emailElement) emailElement.textContent = '********' + newValue.slice(-5);
                    closeAndResetEditModal();
                } else { console.error('Ошибка: ' + (data.error || 'Неизвестная ошибка')); }
            } catch (error) { console.error('Ошибка сети: ' + error.message); }
        });
        cancelEditBtn.addEventListener('click', closeAndResetEditModal);
    }
     function closeAndResetEditModal() {
        if(editInput) editInput.value = '';
        if(editModal) editModal.classList.remove('active');
        disableInteractiveElements(false);
        setTimeout(() => { if(editModal) editModal.style.display = 'none'; }, 300);
    }

    // Смена пароля
    if (savePasswordBtn && cancelPasswordBtn && passwordModal) {
        savePasswordBtn.addEventListener('click', async () => {
            const currentPasswordEl = document.getElementById('current-password');
            const newPasswordEl = document.getElementById('new-password');
            const confirmPasswordEl = document.getElementById('confirm-password');
            if(!currentPasswordEl || !newPasswordEl || !confirmPasswordEl) return;

            const currentPassword = currentPasswordEl.value;
            const newPassword = newPasswordEl.value;
            const confirmPassword = confirmPasswordEl.value;

            if (!currentPassword || !newPassword || !confirmPassword) { console.error('Все поля обязательны'); return; }
            if (newPassword !== confirmPassword) { console.error('Новые пароли не совпадают'); return; }
            try {
                const response = await fetch(`http://localhost:3000/api/user/${userId}/password`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await response.json();
                if (response.ok) {
                    console.log('Пароль успешно изменён');
                    closeAndResetPasswordModal();
                } else { console.error('Ошибка: ' + (data.error || 'Неизвестная ошибка')); }
            } catch (error) { console.error('Ошибка сети: ' + error.message); }
        });
        cancelPasswordBtn.addEventListener('click', closeAndResetPasswordModal);
    }
    function closeAndResetPasswordModal() {
        const currentPasswordEl = document.getElementById('current-password');
        const newPasswordEl = document.getElementById('new-password');
        const confirmPasswordEl = document.getElementById('confirm-password');
        if(currentPasswordEl) currentPasswordEl.value = '';
        if(newPasswordEl) newPasswordEl.value = '';
        if(confirmPasswordEl) confirmPasswordEl.value = '';
        if(passwordModal) passwordModal.classList.remove('active');
        disableInteractiveElements(false);
        setTimeout(() => { if(passwordModal) passwordModal.style.display = 'none'; }, 300);
    }

    // Выпадающий список категорий в каталоге
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('open');
            dropdownBtn.classList.toggle('open'); // Добавлено для изменения состояния кнопки
        });
        document.querySelectorAll('.lists-container .dropdown-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                currentCategoryFilter = item.dataset.category;
                const selectedCategorySpan = document.getElementById('selected-category');
                if(selectedCategorySpan) selectedCategorySpan.textContent = currentCategoryFilter;
                dropdownContent.classList.remove('open');
                dropdownBtn.classList.remove('open'); // Закрываем кнопку
                if(itemsGrid) itemsGrid.classList.add('loading');
                await loadItems(currentCategoryFilter, 1); // Загружаем первую страницу новой категории
                if(itemsGrid) itemsGrid.classList.remove('loading');
            });
        });
    }

    // Загрузка элементов каталога
    async function loadItems(category, page) {
        currentPageInCatalog = parseInt(page);
        // Переменные для элементов каталога, чтобы избежать конфликтов с глобальными
        const localItemsGrid = document.querySelector('.items-grid'); 
        const localEmptyState = document.querySelector('.empty-state');
        const localPagination = document.querySelector('.pagination');
        const localCatalogHeader = listsContainer ? listsContainer.querySelector('h2') : null;
        const localCategorySelector = listsContainer ? listsContainer.querySelector('.category-selector') : null;


        if (!localItemsGrid || !localEmptyState || !localPagination || !localCatalogHeader || !localCategorySelector) {
            console.error("UI элементы каталога не найдены в loadItems."); 
            if(localItemsGrid) localItemsGrid.classList.remove('loading');
            return;
        }
        try {
            // Анимация исчезновения старых элементов
            if (localItemsGrid.children.length > 0) { // Анимация только если есть что убирать
                localItemsGrid.classList.remove('slide-in'); 
                localItemsGrid.classList.add('slide-out');    
                await new Promise(resolve => setTimeout(resolve, 300)); // Даем время на анимацию
            }
            
            localItemsGrid.innerHTML = ''; // Очищаем сетку ПОСЛЕ анимации slide-out (или если ее не было)

            const response = await fetch(`http://localhost:3000/api/user/${userId}/lists?category=${encodeURIComponent(category)}&page=${currentPageInCatalog}&limit=${itemsPerPage}`);
            const data = await response.json();
            
            if (response.ok) {
                const itemsToDisplay = data.items || [];
                const totalItemsInResponse = data.totalItems || 0;

                // Управление видимостью заголовка и селектора категорий
                if (localCatalogHeader) localCatalogHeader.style.display = 'block';
                if (localCategorySelector) localCategorySelector.style.display = 'block';


                if (itemsToDisplay.length === 0 && currentPageInCatalog === 1) { // Если на первой странице нет элементов
                    if(localEmptyState) localEmptyState.style.display = 'flex'; // Показываем emptyState
                    if(localPagination) localPagination.style.display = 'none'; // Скрываем пагинацию
                } else {
                    if(localEmptyState) localEmptyState.style.display = 'none'; // Скрываем emptyState если есть элементы
                }
                
                const totalPages = Math.ceil(totalItemsInResponse / itemsPerPage);
                updatePaginationControls(totalPages, currentPageInCatalog); // Обновляем пагинацию

                if (itemsToDisplay.length > 0) {
                    itemsToDisplay.forEach(itemData => { // Переименовал item в itemData
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'item';
                        itemDiv.dataset.id = itemData.id; // Используем itemData.id (или item_id как было раньше)
                        itemDiv.dataset.category = itemData.category;
                        let posterSrc = DEFAULT_POSTER_PATH;
                        if (itemData.poster) {
                            if (itemData.poster.startsWith('http://') || itemData.poster.startsWith('https://')) {
                                posterSrc = itemData.poster;
                            } else {
                                posterSrc = itemData.poster.startsWith('/') ? itemData.poster : `/${itemData.poster.replace(/\\/g, "/")}`;
                            }
                        }
                        
                        const ratingValue = itemData.rating === null || itemData.rating === undefined ? '-' : itemData.rating;
                        const ratingSpan = document.createElement('span');
                        ratingSpan.className = 'rating';
                        
                        // Создаем оверлей с названием и кнопками
                        const overlayContentDiv = document.createElement('div');
                        overlayContentDiv.className = 'item-overlay-content';
                        overlayContentDiv.innerHTML = `
                            <h4>${itemData.title || 'Без названия'}</h4>
                            <div class="item-actions">
                                <button class="action-btn edit-btn"><i class="fas fa-pen"></i></button>
                                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                            </div>
                        `;
                        
                        itemDiv.innerHTML = `<img src="${posterSrc}" alt="${itemData.title || 'Постер'}" onerror="this.onerror=null;this.src='${DEFAULT_POSTER_PATH}';">`;
                        itemDiv.appendChild(ratingSpan); 
                        itemDiv.appendChild(overlayContentDiv); // Добавляем оверлей
                        
                        setRatingColor(ratingSpan, ratingValue); 
                        localItemsGrid.appendChild(itemDiv);
                    });
                    setupItemInteractivity();
                    // Анимация появления новых элементов
                    localItemsGrid.classList.remove('slide-out'); 
                    setTimeout(() => {
                        localItemsGrid.classList.add('slide-in'); 
                    }, 50); 
                }
            } else { 
                console.error('Ошибка загрузки списка:', data.error); 
                if(localEmptyState) localEmptyState.style.display = 'flex';
            }
        } catch (error) { 
            console.error('Ошибка fetch при загрузке элементов:', error); 
            if(localEmptyState) localEmptyState.style.display = 'flex'; 
            if(localItemsGrid) localItemsGrid.innerHTML = '';
        }
        if(localItemsGrid) localItemsGrid.classList.remove('loading'); // Убираем класс загрузки
    }

    // Интерактивность элементов каталога
    function setupItemInteractivity() {
        document.querySelectorAll('.items-grid .item').forEach(item => {
            const deleteBtn = item.querySelector('.delete-btn');
            const editBtn = item.querySelector('.edit-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); currentItemIdToDeleteOrEdit = item.dataset.id;
                    item.classList.add('dimmed');
                    if(deleteModal) { deleteModal.style.display = 'flex'; deleteModal.classList.add('active'); }
                    disableInteractiveElements(true);
                });
            }
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); currentItemIdToDeleteOrEdit = item.dataset.id;
                    const currentItemCategory = item.dataset.category;
                    document.querySelectorAll('.category-checkboxes input').forEach(checkbox => checkbox.checked = false);
                    if (currentItemCategory) {
                        const checkbox = document.querySelector(`.category-checkboxes input[value="${currentItemCategory}"]`);
                        if (checkbox) checkbox.checked = true;
                    }
                    if(categoryModal) { categoryModal.style.display = 'flex'; categoryModal.classList.add('active'); }
                    disableInteractiveElements(true);
                });
            }
        });
    }

    // Удаление элемента
    async function deleteItemFromList(itemId) {
        try {
            const response = await fetch(`http://localhost:3000/api/user/${userId}/lists/${itemId}`, { method: 'DELETE' });
            if (response.ok) {
                await loadItems(currentCategoryFilter, currentPageInCatalog); // Перезагружаем текущую страницу
            } else { const data = await response.json(); throw new Error(data.error || 'Ошибка удаления'); }
        } catch (error) { console.error('Ошибка: ' + error.message); } // Заменил alert на console.error
    }

    if (confirmDeleteBtn && cancelDeleteModalBtn && closeDeleteModalBtn && deleteModal) {
        confirmDeleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); if (currentItemIdToDeleteOrEdit) await deleteItemFromList(currentItemIdToDeleteOrEdit);
            closeAndDeleteModal();
        });
        cancelDeleteModalBtn.addEventListener('click', (e) => { e.stopPropagation(); closeAndDeleteModal(); });
        closeDeleteModalBtn.addEventListener('click', (e) => { e.stopPropagation(); closeAndDeleteModal(); });
    }
    function closeAndDeleteModal() {
        const dimmedItem = document.querySelector(`.item[data-id="${currentItemIdToDeleteOrEdit}"].dimmed`);
        if (dimmedItem) dimmedItem.classList.remove('dimmed');
        if(deleteModal) deleteModal.classList.remove('active');
        disableInteractiveElements(false);
        setTimeout(() => { if(deleteModal) deleteModal.style.display = 'none'; currentItemIdToDeleteOrEdit = null; }, 300);
    }

    // Изменение категории элемента
    if (saveCategoryBtn && cancelCategoryModalBtn && categoryModal) {
        saveCategoryBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const selectedCategoryInput = document.querySelector('.category-checkboxes input:checked');
            if (selectedCategoryInput && currentItemIdToDeleteOrEdit) {
                try {
                    const response = await fetch(`http://localhost:3000/api/user/${userId}/lists/${currentItemIdToDeleteOrEdit}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ category: selectedCategoryInput.value })
                    });
                    if (response.ok) {
                        closeAndResetCategoryModal();
                        await loadItems(currentCategoryFilter, currentPageInCatalog); // Перезагружаем, чтобы отразить изменения
                    } else { const data = await response.json(); throw new Error(data.error || 'Ошибка изменения категории');}
                } catch (error) { console.error('Ошибка: ' + error.message); }
            } else if (!selectedCategoryInput) { console.error("Пожалуйста, выберите категорию."); }
        });
        cancelCategoryModalBtn.addEventListener('click', (e) => { e.stopPropagation(); closeAndResetCategoryModal();});
    }
    function closeAndResetCategoryModal() {
        if(categoryModal) categoryModal.classList.remove('active');
        disableInteractiveElements(false);
        setTimeout(() => { if(categoryModal) categoryModal.style.display = 'none'; }, 300);
    }

    // Выпадающее меню аватара и выход
    if (avatarContainer && logoutBtn) {
        avatarContainer.addEventListener('click', (e) => { e.stopPropagation(); avatarContainer.classList.toggle('active'); });
        logoutBtn.addEventListener('click', (e) => {
            e.stopPropagation(); localStorage.removeItem('userId'); window.location.href = 'auth.html';
        });
    }
    
    // Глобальный обработчик кликов для закрытия модальных окон и дропдаунов
    document.addEventListener('click', (e) => {
        if (cropModal && cropModal.classList.contains('active') && !e.target.closest('#crop-modal .modal-content')) closeAndResetCropModal();
        if (editModal && editModal.classList.contains('active') && !e.target.closest('#edit-modal .modal-content')) closeAndResetEditModal();
        if (passwordModal && passwordModal.classList.contains('active') && !e.target.closest('#password-modal .modal-content')) closeAndResetPasswordModal();
        if (deleteModal && deleteModal.classList.contains('active') && !e.target.closest('#delete-modal .modal-content')) closeAndDeleteModal();
        if (categoryModal && categoryModal.classList.contains('active') && !e.target.closest('#category-modal .modal-content')) closeAndResetCategoryModal();
        if (avatarContainer && avatarContainer.classList.contains('active') && !e.target.closest('.avatar-container')) avatarContainer.classList.remove('active');
        if (dropdownContent && dropdownContent.classList.contains('open') && !e.target.closest('.custom-dropdown')) {
            dropdownContent.classList.remove('open');
            if(dropdownBtn) dropdownBtn.classList.remove('open'); // Также закрываем кнопку
        }
    });

    // Функция блокировки/разблокировки интерактивных элементов
    function disableInteractiveElements(disable, excludeElement = null) {
        const elements = [
            homeBtn, avatarContainer, accountBtn, catalogBtn, dropdownBtn,
            ...(document.querySelectorAll('.info-row') || []),
            ...(document.querySelectorAll('.items-grid .action-btn') || []), 
            ...(document.querySelectorAll('.pagination button') || [])
        ].filter(el => el && el !== excludeElement && !el.closest('.modal-content')); 

        elements.forEach(el => {
            el.style.pointerEvents = disable ? 'none' : 'auto';
            el.style.opacity = disable ? '0.5' : '1';
            if (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.classList.contains('home-btn'))) {
                if(disable) el.setAttribute('disabled', 'true'); else el.removeAttribute('disabled');
            }
        });
    }
    
    // Обновление пагинации
    function updatePaginationControls(totalPages, page) {
        currentPageInCatalog = parseInt(page);
        const localPagination = document.querySelector('.pagination'); // Используем локальную переменную
        if (!localPagination) return;
        localPagination.innerHTML = ''; 
        if (totalPages > 1) {
            localPagination.style.display = 'flex'; // Показываем пагинацию
            if (currentPageInCatalog > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'pagination-btn action-button';
                prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                prevBtn.addEventListener('click', () => loadItems(currentCategoryFilter, currentPageInCatalog - 1));
                localPagination.appendChild(prevBtn);
            }
            const pageInfo = document.createElement('span');
            pageInfo.className = 'page-info';
            pageInfo.textContent = `${currentPageInCatalog}/${totalPages}`;
            localPagination.appendChild(pageInfo);
            if (currentPageInCatalog < totalPages) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'pagination-btn action-button';
                nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                nextBtn.addEventListener('click', () => loadItems(currentCategoryFilter, currentPageInCatalog + 1));
                localPagination.appendChild(nextBtn);
            }
        } else {
            localPagination.style.display = 'none'; // Скрываем пагинацию, если страниц мало
        }
    }

    // Первоначальное скрытие элементов каталога, если он не активен при загрузке
    if (listsContainer && listsContainer.classList.contains('hidden')) {
        const catalogHeaderLocal = listsContainer.querySelector('h2');
        const categorySelectorLocal = listsContainer.querySelector('.category-selector');
        const paginationLocal = document.querySelector('.pagination');
        if(catalogHeaderLocal) catalogHeaderLocal.style.display = 'none';
        if(categorySelectorLocal) categorySelectorLocal.style.display = 'none';
        if(paginationLocal) paginationLocal.style.display = 'none';
    }

}); // Конец DOMContentLoaded
