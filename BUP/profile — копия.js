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
    const navbar = document.querySelector('.navbar'); // Navbar для эффекта прокрутки

    let cropper;
    let currentFieldToEdit;
    let currentItemIdToDeleteOrEdit;
    let currentCategoryFilter = 'Все категории';
    let currentPageInCatalog = 1;
    const itemsPerPage = 12;

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
        });
    }

    // --- Функция установки цвета для рейтинга ---
    function setRatingColor(ratingElement, ratingValue) {
        if (!ratingElement) return;
        const rating = parseFloat(ratingValue);
        ratingElement.classList.remove('rating-red', 'rating-gray', 'rating-green');
        ratingElement.style.backgroundColor = ''; // Сбрасываем инлайн стиль, если был

        if (isNaN(rating) || rating === null || rating === undefined) {
            ratingElement.textContent = '–'; // Для отсутствующего рейтинга
            ratingElement.style.backgroundColor = '#4a4a4a'; // Нейтральный фон для "нет оценки"
            ratingElement.style.color = '#ccc';
            return;
        }
        
        ratingElement.textContent = `★ ${rating.toFixed(1)}`; // Показываем с одной цифрой после запятой

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
        profileContainer.classList.remove('hidden');
        profileHeader.classList.add('visible');
        listsContainer.classList.add('hidden');
        listsContainer.classList.remove('visible');
        accountBtn.classList.add('active');
        catalogHeader.classList.remove('visible'); // Убедимся, что заголовок каталога скрыт
        categorySelector.classList.remove('visible'); // И селектор категорий тоже
        pagination.classList.remove('visible'); // И пагинация
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
                } else { alert('Ошибка загрузки аватара: ' + (data.error || 'Неизвестная ошибка')); }
            } catch (error) { alert('Ошибка сети при загрузке аватара: ' + error.message); }
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
            if (!newValue) return alert('Поле не может быть пустым');
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
                } else { alert('Ошибка: ' + (data.error || 'Неизвестная ошибка')); }
            } catch (error) { alert('Ошибка сети: ' + error.message); }
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

            if (!currentPassword || !newPassword || !confirmPassword) return alert('Все поля обязательны');
            if (newPassword !== confirmPassword) return alert('Новые пароли не совпадают');
            try {
                const response = await fetch(`http://localhost:3000/api/user/${userId}/password`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Пароль успешно изменён');
                    closeAndResetPasswordModal();
                } else { alert('Ошибка: ' + (data.error || 'Неизвестная ошибка')); }
            } catch (error) { alert('Ошибка сети: ' + error.message); }
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

    // Переключение вкладок Аккаунт/Каталог
    if (accountBtn && catalogBtn && profileContainer && listsContainer && profileHeader && catalogHeader && categorySelector && pagination) {
        accountBtn.addEventListener('click', () => {
            accountBtn.classList.add('active'); catalogBtn.classList.remove('active');
            listsContainer.classList.remove('visible'); listsContainer.classList.add('hidden');
            profileContainer.classList.remove('hidden'); profileContainer.classList.add('visible');
            profileHeader.classList.add('visible'); catalogHeader.classList.remove('visible');
            categorySelector.classList.remove('visible'); pagination.classList.remove('visible');
        });
        catalogBtn.addEventListener('click', async () => {
            catalogBtn.classList.add('active'); accountBtn.classList.remove('active');
            profileContainer.classList.remove('visible'); profileContainer.classList.add('hidden');
            profileHeader.classList.remove('visible');
            listsContainer.classList.remove('hidden'); listsContainer.classList.add('visible');
            if(itemsGrid) itemsGrid.classList.add('loading'); // Показываем индикатор загрузки
            await loadItems(currentCategoryFilter, 1);
            if(itemsGrid) itemsGrid.classList.remove('loading'); // Убираем индикатор загрузки
        });
    }

    // Выпадающий список категорий в каталоге
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('open');
        });
        document.querySelectorAll('.lists-container .dropdown-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                currentCategoryFilter = item.dataset.category;
                const selectedCategorySpan = document.getElementById('selected-category');
                if(selectedCategorySpan) selectedCategorySpan.textContent = currentCategoryFilter;
                dropdownContent.classList.remove('open');
                if(itemsGrid) itemsGrid.classList.add('loading');
                await loadItems(currentCategoryFilter, 1);
                if(itemsGrid) itemsGrid.classList.remove('loading');
            });
        });
    }

    // Загрузка элементов каталога
    async function loadItems(category, page) {
        currentPageInCatalog = parseInt(page);
        if (!itemsGrid || !emptyState || !pagination || !catalogHeader || !categorySelector) {
            console.error("UI элементы каталога не найдены."); return;
        }
        try {
            itemsGrid.classList.remove('slide-in'); // Сначала убираем slide-in, если он был
            itemsGrid.classList.add('slide-out');    // Добавляем slide-out для анимации исчезновения
            
            // Ждем завершения анимации slide-out перед очисткой и загрузкой новых данных
            await new Promise(resolve => setTimeout(resolve, itemsGrid.children.length > 0 ? 300 : 0));


            const response = await fetch(`http://localhost:3000/api/user/${userId}/lists?category=${encodeURIComponent(category)}&page=${currentPageInCatalog}&limit=${itemsPerPage}`);
            const data = await response.json();
            
            itemsGrid.innerHTML = ''; // Очищаем сетку ПОСЛЕ анимации slide-out

            if (response.ok) {
                const itemsToDisplay = data.items || [];
                const totalItemsInResponse = data.totalItems || 0;
                if (itemsToDisplay.length === 0) {
                    if(emptyState) emptyState.style.display = 'block';
                    if(pagination) { pagination.classList.remove('visible'); pagination.classList.add('hidden');}
                    if (catalogHeader) { catalogHeader.style.opacity = '0'; setTimeout(() => catalogHeader.classList.remove('visible'), 300); }
                    if (categorySelector) { categorySelector.style.opacity = '0'; setTimeout(() => categorySelector.classList.remove('visible'), 300); }
                } else {
                    if(emptyState) emptyState.style.display = 'none';
                    const totalPages = Math.ceil(totalItemsInResponse / itemsPerPage);
                    if (totalItemsInResponse > itemsPerPage) {
                       if(pagination) { pagination.classList.remove('hidden'); pagination.classList.add('visible');}
                    } else {
                       if(pagination) { pagination.classList.remove('visible'); pagination.classList.add('hidden');}
                    }
                    if (catalogHeader && !catalogHeader.classList.contains('visible')) {
                        catalogHeader.style.opacity = '0'; catalogHeader.classList.add('visible');
                        setTimeout(() => { catalogHeader.style.opacity = '1'; }, 10);
                    }
                    if (categorySelector && !categorySelector.classList.contains('visible')) {
                        categorySelector.style.opacity = '0'; categorySelector.classList.add('visible');
                        setTimeout(() => { categorySelector.style.opacity = '1'; }, 10);
                    }
                    itemsToDisplay.forEach(item => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'item';
                        itemDiv.dataset.id = item.item_id; // Используем item_id
                        itemDiv.dataset.category = item.category;
                        let posterSrc = DEFAULT_POSTER_PATH;
                        if (item.poster) {
                            if (item.poster.startsWith('http://') || item.poster.startsWith('https://')) {
                                posterSrc = item.poster;
                            } else {
                                posterSrc = item.poster.startsWith('/') ? item.poster : `/${item.poster.replace(/\\/g, "/")}`;
                            }
                        }
                        
                        const ratingValue = item.rating === null || item.rating === undefined ? '-' : item.rating;
                        const ratingSpan = document.createElement('span');
                        ratingSpan.className = 'rating';
                        // Текст и цвет будут установлены функцией setRatingColor
                        
                        itemDiv.innerHTML = `
                            <img src="${posterSrc}" alt="${item.title || 'Постер'}" onerror="this.onerror=null;this.src='${DEFAULT_POSTER_PATH}';">
                            <h4>${item.title || 'Без названия'}</h4>
                            <div class="item-actions">
                                <button class="action-btn edit-btn"><i class="fas fa-pen"></i></button>
                                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                            </div>
                        `;
                        itemDiv.insertBefore(ratingSpan, itemDiv.querySelector('.item-actions')); // Вставляем рейтинг перед кнопками
                        setRatingColor(ratingSpan, ratingValue); // Устанавливаем цвет и текст рейтинга
                        itemsGrid.appendChild(itemDiv);
                    });
                    setupItemInteractivity();
                    updatePaginationControls(totalPages, currentPageInCatalog);
                    itemsGrid.classList.remove('slide-out'); // Убираем класс для анимации исчезновения
                    // Задержка перед slide-in для более плавной смены контента
                    setTimeout(() => {
                        itemsGrid.classList.add('slide-in'); // Добавляем класс для анимации появления
                    }, 50); 
                }
            } else { console.error('Ошибка загрузки списка:', data.error); }
        } catch (error) { console.error('Ошибка fetch при загрузке элементов:', error); if(emptyState) emptyState.style.display = 'block'; if(itemsGrid) itemsGrid.innerHTML = '';}
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
                await loadItems(currentCategoryFilter, currentPageInCatalog);
            } else { const data = await response.json(); throw new Error(data.error || 'Ошибка удаления'); }
        } catch (error) { alert('Ошибка: ' + error.message); }
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
                        await loadItems(currentCategoryFilter, currentPageInCatalog);
                    } else { const data = await response.json(); throw new Error(data.error || 'Ошибка изменения категории');}
                } catch (error) { alert('Ошибка: ' + error.message); }
            } else if (!selectedCategoryInput) { alert("Пожалуйста, выберите категорию."); }
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
        if (dropdownContent && dropdownContent.classList.contains('open') && !e.target.closest('.custom-dropdown')) dropdownContent.classList.remove('open');
    });

    // Функция блокировки/разблокировки интерактивных элементов
    function disableInteractiveElements(disable, excludeElement = null) {
        const elements = [
            homeBtn, avatarContainer, accountBtn, catalogBtn, dropdownBtn,
            ...(document.querySelectorAll('.info-row') || []),
            ...(document.querySelectorAll('.items-grid .action-btn') || []), // Кнопки на плитках
            ...(document.querySelectorAll('.pagination button') || []) // Кнопки пагинации
        ].filter(el => el && el !== excludeElement);
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
        if (!pagination) return;
        pagination.innerHTML = '';
        if (totalPages > 1) {
            if (currentPageInCatalog > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'pagination-btn action-button';
                prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                prevBtn.addEventListener('click', () => loadItems(currentCategoryFilter, currentPageInCatalog - 1));
                pagination.appendChild(prevBtn);
            }
            const pageInfo = document.createElement('span');
            pageInfo.className = 'page-info';
            pageInfo.textContent = `${currentPageInCatalog}/${totalPages}`;
            pagination.appendChild(pageInfo);
            if (currentPageInCatalog < totalPages) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'pagination-btn action-button';
                nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                nextBtn.addEventListener('click', () => loadItems(currentCategoryFilter, currentPageInCatalog + 1));
                pagination.appendChild(nextBtn);
            }
        }
    }
}); // Конец DOMContentLoaded
