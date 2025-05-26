document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    // Элементы для вкладки "Аккаунт"
    const usernameElement = document.querySelector('.username');
    const emailElement = document.querySelector('.email');
    const avatarPreview = document.getElementById('avatar-preview');
    const navAvatar = document.getElementById('nav-avatar'); // Аватар в навбаре
    const avatarContainer = document.querySelector('.avatar-container');
    const logoutBtn = document.getElementById('logout-btn');
    const avatarInput = document.getElementById('avatar-input');

    // Элементы для вкладки "Мой каталог"
    const itemsGrid = document.getElementById('items-grid');
    const emptyState = document.getElementById('empty-state');
    const categoryDropdownBtn = document.getElementById('category-dropdown-btn');
    const categoryDropdownContent = document.getElementById('category-dropdown-content');
    const selectedCategorySpan = document.getElementById('selected-category');
    const sortDropdownBtn = document.getElementById('sort-dropdown-btn');
    const sortDropdownContent = document.getElementById('sort-dropdown-content');
    const selectedSortSpan = document.getElementById('selected-sort');
    const paginationControls = document.getElementById('pagination-controls');

    // Контейнеры вкладок
    const profileContainer = document.querySelector('.profile-container');
    const listsContainer = document.querySelector('.lists-container');

    // Кнопки переключения вкладок
    const accountBtn = document.querySelector('.account-btn');
    const catalogBtn = document.querySelector('.catalog-btn');

    // Модальные окна
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
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.querySelector('.confirm-delete');
    const cancelDeleteModalBtn = deleteModal.querySelector('.cancel-delete');
    const closeDeleteModalBtn = deleteModal.querySelector('.close-btn');
    const categoryChangeModal = document.getElementById('category-modal');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const cancelCategoryModalBtn = document.getElementById('cancel-category-btn');

    const homeBtn = document.querySelector('.home-btn');
    const navbar = document.querySelector('.navbar');
    const catalogHeader = document.getElementById('catalog-header');
    const filtersAndSortContainer = document.getElementById('filters-and-sort');


    let cropper;
    let currentFieldToEdit;
    let currentItemIdToDeleteOrEdit;
    let currentCategoryFilter = 'Все категории';
    let currentSortOrder = 'date_desc';
    let currentPageInCatalog = 1;
    const itemsPerPage = 12;

    const DEFAULT_AVATAR_PATH = '/images/default-avatar.png';
    const DEFAULT_POSTER_PATH = '/images/default-poster.jpg';

    if (!userId) {
        window.location.href = 'auth.html';
        return;
    }

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

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
        if (rating < 5) ratingElement.classList.add('rating-red');
        else if (rating >= 5 && rating <= 7) ratingElement.classList.add('rating-gray');
        else if (rating > 7) ratingElement.classList.add('rating-green');
    }

    async function fetchUserData() {
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
    }
    fetchUserData();

    function switchTab(tabToShow, tabToHide) {
        const isCatalogTabTarget = tabToShow === listsContainer;
        if (catalogHeader) catalogHeader.style.display = isCatalogTabTarget ? 'block' : 'none';
        if (filtersAndSortContainer) filtersAndSortContainer.style.display = isCatalogTabTarget ? 'flex' : 'none';
        if (paginationControls) paginationControls.style.display = (isCatalogTabTarget && paginationControls.children.length > 0) ? 'flex' : 'none';

        if (tabToHide && tabToHide !== tabToShow) {
            tabToHide.classList.remove('is-active-tab');
            tabToHide.classList.add('is-inactive-tab-left');
            tabToHide.classList.remove('is-inactive-tab-right');
        }

        if (tabToShow) {
            tabToShow.classList.remove('is-inactive-tab-left', 'is-inactive-tab-right');
            tabToShow.classList.add('is-active-tab');
        }
    }

    if (accountBtn && catalogBtn && profileContainer && listsContainer) {
        switchTab(profileContainer, listsContainer);

        accountBtn.addEventListener('click', () => {
            if (!accountBtn.classList.contains('active')) {
                accountBtn.classList.add('active');
                catalogBtn.classList.remove('active');
                switchTab(profileContainer, listsContainer);
            }
        });

        catalogBtn.addEventListener('click', async () => {
            if (!catalogBtn.classList.contains('active')) {
                catalogBtn.classList.add('active');
                accountBtn.classList.remove('active');
                switchTab(listsContainer, profileContainer);
                if (itemsGrid && itemsGrid.children.length === 0) {
                    itemsGrid.classList.add('loading');
                    await loadItems(currentCategoryFilter, currentSortOrder, 1);
                    itemsGrid.classList.remove('loading');
                }
            }
        });
    }

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

    if (categoryDropdownBtn && categoryDropdownContent && selectedCategorySpan) {
        categoryDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sortDropdownContent && sortDropdownContent.classList.contains('open')) {
                sortDropdownContent.classList.remove('open');
                sortDropdownBtn.classList.remove('open');
            }
            categoryDropdownContent.classList.toggle('open');
            categoryDropdownBtn.classList.toggle('open');
        });
        document.querySelectorAll('#category-dropdown-content .dropdown-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                currentCategoryFilter = item.dataset.category;
                selectedCategorySpan.textContent = currentCategoryFilter;
                categoryDropdownContent.classList.remove('open');
                categoryDropdownBtn.classList.remove('open');
                if(itemsGrid) itemsGrid.classList.add('loading');
                await loadItems(currentCategoryFilter, currentSortOrder, 1);
                if(itemsGrid) itemsGrid.classList.remove('loading');
            });
        });
    }

    if (sortDropdownBtn && sortDropdownContent && selectedSortSpan) {
        sortDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (categoryDropdownContent && categoryDropdownContent.classList.contains('open')) {
                categoryDropdownContent.classList.remove('open');
                categoryDropdownBtn.classList.remove('open');
            }
            sortDropdownContent.classList.toggle('open');
            sortDropdownBtn.classList.toggle('open');
        });
        document.querySelectorAll('#sort-dropdown-content .dropdown-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                currentSortOrder = item.dataset.sort;
                selectedSortSpan.textContent = `${item.textContent}`;
                sortDropdownContent.classList.remove('open');
                sortDropdownBtn.classList.remove('open');
                if(itemsGrid) itemsGrid.classList.add('loading');
                await loadItems(currentCategoryFilter, currentSortOrder, 1);
                if(itemsGrid) itemsGrid.classList.remove('loading');
            });
        });
    }

    async function loadItems(category, sort, page) {
        currentPageInCatalog = parseInt(page);

        if (!itemsGrid || !emptyState || !paginationControls ) {
            console.error("UI элементы каталога (grid, emptyState, paginationControls) не найдены в loadItems.");
            if(itemsGrid) itemsGrid.classList.remove('loading'); // Убираем загрузку, если элементы не найдены
            return;
        }
        try {
            if (itemsGrid.children.length > 0) {
                itemsGrid.classList.remove('slide-in');
                itemsGrid.classList.add('slide-out');
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            itemsGrid.innerHTML = '';

            const response = await fetch(`http://localhost:3000/api/user/${userId}/lists?category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&page=${currentPageInCatalog}&limit=${itemsPerPage}`);
            const data = await response.json();

            if (response.ok) {
                const itemsToDisplay = data.items || [];
                const totalItemsInResponse = data.totalItems || 0;

                if (itemsToDisplay.length === 0 && currentPageInCatalog === 1) {
                    emptyState.style.display = 'flex';
                } else {
                    emptyState.style.display = 'none';
                }

                const totalPages = Math.ceil(totalItemsInResponse / itemsPerPage);
                updatePaginationControlsUI(totalPages, currentPageInCatalog);

                if (itemsToDisplay.length > 0) {
                    itemsToDisplay.forEach(itemData => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'item';
                        itemDiv.dataset.id = itemData.id;
                        itemDiv.dataset.category = itemData.category;

                        let posterSrc = DEFAULT_POSTER_PATH;
                        if (itemData.poster && itemData.poster.trim() !== '') {
                            const pathCandidate = itemData.poster.replace(/\\/g, "/");
                            if (pathCandidate.startsWith('http://') || pathCandidate.startsWith('https://')) {
                                posterSrc = pathCandidate;
                            } else {
                                posterSrc = pathCandidate.startsWith('/') ? pathCandidate : `/${pathCandidate}`;
                            }
                        }

                        const ratingValue = itemData.rating;
                        const ratingSpan = document.createElement('span');
                        ratingSpan.className = 'rating';

                        const overlayContentDiv = document.createElement('div');
                        overlayContentDiv.className = 'item-overlay-content';
                        overlayContentDiv.innerHTML = `
                            <h4>${itemData.title || 'Без названия'}</h4>
                            <div class="item-actions">
                                <button class="action-btn edit-btn"><i class="fas fa-pen"></i></button>
                                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                            </div>`;
                        itemDiv.innerHTML = `<img src="${posterSrc}" alt="${itemData.title || 'Постер'}" onerror="this.onerror=null;this.src='${DEFAULT_POSTER_PATH}';">`;
                        itemDiv.appendChild(ratingSpan);
                        itemDiv.appendChild(overlayContentDiv);
                        setRatingColor(ratingSpan, ratingValue);
                        itemsGrid.appendChild(itemDiv);
                    });
                    setupItemInteractivity();
                    itemsGrid.classList.remove('slide-out');
                    setTimeout(() => itemsGrid.classList.add('slide-in'), 50);
                } else {
                     itemsGrid.classList.remove('slide-in', 'slide-out');
                }
            } else {
                console.error('Ошибка загрузки списка:', data.error);
                emptyState.style.display = 'flex';
                if (paginationControls) paginationControls.style.display = 'none';
            }
        } catch (error) {
            console.error('Ошибка fetch при загрузке элементов:', error);
            emptyState.style.display = 'flex';
            if (paginationControls) paginationControls.style.display = 'none';
            if (itemsGrid) itemsGrid.innerHTML = '';
        }
        if(itemsGrid) itemsGrid.classList.remove('loading');
    }

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
                    if(categoryChangeModal) { categoryChangeModal.style.display = 'flex'; categoryChangeModal.classList.add('active'); }
                    disableInteractiveElements(true);
                });
            }
        });
    }

    async function deleteItemFromList(itemId) {
        try {
            const response = await fetch(`http://localhost:3000/api/user/${userId}/lists/${itemId}`, { method: 'DELETE' });
            if (response.ok) {
                await loadItems(currentCategoryFilter, currentSortOrder, currentPageInCatalog);
            } else { const data = await response.json(); throw new Error(data.error || 'Ошибка удаления'); }
        } catch (error) { console.error('Ошибка: ' + error.message); }
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

    if (saveCategoryBtn && cancelCategoryModalBtn && categoryChangeModal) {
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
                        closeAndResetCategoryChangeModal();
                        await loadItems(currentCategoryFilter, currentSortOrder, currentPageInCatalog);
                    } else { const data = await response.json(); throw new Error(data.error || 'Ошибка изменения категории');}
                } catch (error) { console.error('Ошибка: ' + error.message); }
            } else if (!selectedCategoryInput) { console.error("Пожалуйста, выберите категорию."); }
        });
        cancelCategoryModalBtn.addEventListener('click', (e) => { e.stopPropagation(); closeAndResetCategoryChangeModal();});
    }
    function closeAndResetCategoryChangeModal() {
        if(categoryChangeModal) categoryChangeModal.classList.remove('active');
        disableInteractiveElements(false);
        setTimeout(() => { if(categoryChangeModal) categoryChangeModal.style.display = 'none'; }, 300);
    }

    if (avatarContainer && logoutBtn) {
        avatarContainer.addEventListener('click', (e) => { e.stopPropagation(); avatarContainer.classList.toggle('active'); });
        logoutBtn.addEventListener('click', (e) => {
            e.stopPropagation(); localStorage.removeItem('userId'); window.location.href = 'auth.html';
        });
    }

    document.addEventListener('click', (e) => {
        if (cropModal && cropModal.classList.contains('active') && !e.target.closest('#crop-modal .modal-content')) closeAndResetCropModal();
        if (editModal && editModal.classList.contains('active') && !e.target.closest('#edit-modal .modal-content')) closeAndResetEditModal();
        if (passwordModal && passwordModal.classList.contains('active') && !e.target.closest('#password-modal .modal-content')) closeAndResetPasswordModal();
        if (deleteModal && deleteModal.classList.contains('active') && !e.target.closest('#delete-modal .modal-content')) closeAndDeleteModal();
        if (categoryChangeModal && categoryChangeModal.classList.contains('active') && !e.target.closest('#category-modal .modal-content')) closeAndResetCategoryChangeModal();
        if (avatarContainer && avatarContainer.classList.contains('active') && !e.target.closest('.avatar-container')) avatarContainer.classList.remove('active');

        if (categoryDropdownContent && categoryDropdownContent.classList.contains('open') && !e.target.closest('#category-dropdown-btn') && !e.target.closest('#category-dropdown-content')) {
            categoryDropdownContent.classList.remove('open');
            if(categoryDropdownBtn) categoryDropdownBtn.classList.remove('open');
        }
        if (sortDropdownContent && sortDropdownContent.classList.contains('open') && !e.target.closest('#sort-dropdown-btn') && !e.target.closest('#sort-dropdown-content')) {
            sortDropdownContent.classList.remove('open');
            if(sortDropdownBtn) sortDropdownBtn.classList.remove('open');
        }
    });

    function disableInteractiveElements(disable, excludeElement = null) {
        const elements = [
            homeBtn, avatarContainer, accountBtn, catalogBtn,
            categoryDropdownBtn, sortDropdownBtn,
            ...(document.querySelectorAll('.info-row') || []),
            ...(document.querySelectorAll('.items-grid .action-btn') || []),
            ...(document.querySelectorAll('#pagination-controls button') || [])
        ].filter(el => el && el !== excludeElement && !el.closest('.modal-content'));

        elements.forEach(el => {
            el.style.pointerEvents = disable ? 'none' : 'auto';
            el.style.opacity = disable ? '0.5' : '1';
            if (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.classList.contains('home-btn'))) {
                if(disable) el.setAttribute('disabled', 'true'); else el.removeAttribute('disabled');
            }
        });
    }

    function updatePaginationControlsUI(totalPages, page) {
        currentPageInCatalog = parseInt(page);
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        if (totalPages > 1) {
            paginationControls.style.display = 'flex';
            paginationControls.classList.add('visible');
            paginationControls.classList.remove('hidden');

            if (currentPageInCatalog > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'pagination-btn action-button';
                prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                prevBtn.addEventListener('click', () => loadItems(currentCategoryFilter, currentSortOrder, currentPageInCatalog - 1));
                paginationControls.appendChild(prevBtn);
            }
            const pageInfo = document.createElement('span');
            pageInfo.className = 'page-info';
            pageInfo.textContent = `${currentPageInCatalog}/${totalPages}`;
            paginationControls.appendChild(pageInfo);
            if (currentPageInCatalog < totalPages) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'pagination-btn action-button';
                nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                nextBtn.addEventListener('click', () => loadItems(currentCategoryFilter, currentSortOrder, currentPageInCatalog + 1));
                paginationControls.appendChild(nextBtn);
            }
        } else {
            paginationControls.style.display = 'none';
            paginationControls.classList.add('hidden');
            paginationControls.classList.remove('visible');
        }
    }
});
