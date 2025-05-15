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
    const cancelDeleteBtn = document.querySelector('.cancel-delete');
    const closeDeleteBtn = document.querySelector('.close-btn');
    const categoryModal = document.getElementById('category-modal');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    const categorySelector = document.querySelector('.category-selector');
    const catalogHeader = listsContainer.querySelector('h2');
    const profileHeader = profileContainer.querySelector('h2');
    const pagination = document.querySelector('.pagination');
    let cropper;
    let currentField;
    let currentItemId = null;
    let currentCategory = 'Все категории';
    let currentPage = 1;
    const itemsPerPage = 12;

    if (!userId) {
        window.location.href = 'auth.html';
        return;
    }

    profileContainer.classList.add('visible');
    profileContainer.classList.remove('hidden');
    profileHeader.classList.add('visible');
    listsContainer.classList.add('hidden');
    listsContainer.classList.remove('visible');
    accountBtn.classList.add('active');

    try {
        const response = await fetch(`http://localhost:3000/api/user/${userId}`);
        const data = await response.json();
        if (response.ok) {
            usernameElement.textContent = data.username || 'UserTest';
            emailElement.textContent = '********' + (data.email || 'test@example.com').slice(-5);
            if (data.avatar) {
                navAvatar.src = data.avatar;
                avatarPreview.src = data.avatar;
            }
        } else {
            alert('Ошибка загрузки данных: ' + data.error);
            window.location.href = 'auth.html';
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
        window.location.href = 'auth.html';
    }

    document.querySelectorAll('.info-row').forEach(row => {
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = row.dataset.action;
            if (action === 'avatar') {
                if (avatarInput) {
                    avatarInput.click();
                }
            } else if (action === 'username' || action === 'email') {
                currentField = action;
                editModal.style.display = 'flex';
                editModal.classList.add('active');
                disableInteractiveElements(true, row);
                editInput.value = '';
                editInput.placeholder = action === 'username' ? 'Новое имя пользователя' : 'Новая почта';
                editInput.focus();
            } else if (action === 'password') {
                passwordModal.style.display = 'flex';
                passwordModal.classList.add('active');
                disableInteractiveElements(true, row);
            }
        });
    });

    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imageToCrop.src = event.target.result;
                    cropModal.style.display = 'flex';
                    cropModal.classList.add('active');
                    disableInteractiveElements(true);
                    cropper = new Cropper(imageToCrop, {
                        aspectRatio: 1,
                        viewMode: 1,
                        dragMode: 'move',
                        autoCropArea: 0.8,
                        cropBoxResizable: true,
                        cropBoxMovable: true,
                        toggleDragModeOnDblclick: false,
                        ready() {
                            this.cropper.setCropBoxData({
                                width: 150,
                                height: 150
                            });
                        }
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    cropBtn.addEventListener('click', async () => {
        const canvas = cropper.getCroppedCanvas({
            width: 150,
            height: 150
        });
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');

        try {
            const response = await fetch(`http://localhost:3000/api/user/${userId}/avatar`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                navAvatar.src = data.avatarUrl + '?t=' + new Date().getTime();
                avatarPreview.src = data.avatarUrl + '?t=' + new Date().getTime();
                cropModal.classList.remove('active');
                disableInteractiveElements(false);
                cropper.destroy();
            } else {
                alert('Ошибка загрузки аватара: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    });

    cancelCropBtn.addEventListener('click', () => {
        cropModal.classList.remove('active');
        disableInteractiveElements(false);
        cropper.destroy();
        avatarInput.value = '';
    });

    saveEditBtn.addEventListener('click', async () => {
        const newValue = editInput.value.trim();
        if (!newValue) {
            alert('Поле не может быть пустым');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/user/${userId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field: currentField, value: newValue })
            });
            const data = await response.json();
            if (response.ok) {
                if (currentField === 'username') {
                    usernameElement.textContent = newValue;
                } else if (currentField === 'email') {
                    emailElement.textContent = '********' + newValue.slice(-5);
                }
                editInput.value = '';
                editModal.classList.remove('active');
                disableInteractiveElements(false);
            } else {
                alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    });

    cancelEditBtn.addEventListener('click', () => {
        editInput.value = '';
        editModal.classList.remove('active');
        disableInteractiveElements(false);
    });

    savePasswordBtn.addEventListener('click', async () => {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Все поля обязательны');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Новые пароли не совпадают');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/user/${userId}/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Пароль успешно изменён');
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                passwordModal.classList.remove('active');
                disableInteractiveElements(false);
            } else {
                alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    });

    cancelPasswordBtn.addEventListener('click', () => {
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        passwordModal.classList.remove('active');
        disableInteractiveElements(false);
    });

    accountBtn.addEventListener('click', () => {
        accountBtn.classList.add('active');
        catalogBtn.classList.remove('active');
        listsContainer.classList.remove('visible');
        listsContainer.classList.add('hidden');
        profileContainer.classList.remove('hidden');
        profileContainer.classList.add('visible');
        profileHeader.classList.add('visible');
        catalogHeader.classList.remove('visible');
        categorySelector.classList.remove('visible');
        pagination.classList.remove('visible');
    });

    catalogBtn.addEventListener('click', async () => {
        catalogBtn.classList.add('active');
        accountBtn.classList.remove('active');
        profileContainer.classList.remove('visible');
        profileContainer.classList.add('hidden');
        profileHeader.classList.remove('visible');
        listsContainer.classList.remove('hidden');
        listsContainer.classList.add('visible');
        itemsGrid.classList.add('loading');
        await loadItems(currentCategory, 1);
        itemsGrid.classList.remove('loading');
    });

    dropdownBtn.addEventListener('click', () => {
        dropdownContent.classList.toggle('open');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.stopPropagation();
            currentCategory = item.dataset.category;
            document.querySelector('.dropdown-btn span').textContent = currentCategory;
            dropdownContent.classList.remove('open');
            setTimeout(() => {
                itemsGrid.classList.add('loading');
                loadItems(currentCategory, 1).then(() => {
                    itemsGrid.classList.remove('loading');
                });
            }, 300);
        });
    });

async function loadItems(category, page) {
    console.log(`Loading items for category: ${category}, page: ${page}`);
    try {
        // Активируем анимацию исчезновения
        if (itemsGrid.classList.contains('slide-in') || itemsGrid.children.length > 0) {
            itemsGrid.classList.remove('slide-in');
            itemsGrid.classList.add('slide-out');
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        const response = await fetch(`http://localhost:3000/api/user/${userId}/lists?page=${page}&limit=${itemsPerPage}`);
        const data = await response.json();
        console.log('Server response:', data);
        console.log('Total items from server:', data.totalItems);
        if (response.ok) {
            itemsGrid.innerHTML = '';
            let items = data.items || [];
            let totalItemsInCategory;

            if (category === 'Все категории') {
                totalItemsInCategory = data.totalItems || items.length;
            } else {
                const allItemsResponse = await fetch(`http://localhost:3000/api/user/${userId}/lists?page=1&limit=1000`);
                const allItemsData = await allItemsResponse.json();
                const allItems = allItemsData.items || [];
                totalItemsInCategory = allItems.filter(item => item.category === category).length;
                items = items.filter(item => item.category === category);
            }

            console.log(`Total items in category "${category}": ${totalItemsInCategory}`);
            console.log('Items after filtering:', items);

            if (items.length === 0) {
                emptyState.style.display = 'block';
                if (pagination.classList.contains('visible')) {
                    pagination.classList.remove('visible');
                    pagination.classList.add('hidden');
                    console.log('Pagination hidden');
                }
                if (catalogHeader.classList.contains('visible')) {
                    catalogHeader.style.opacity = '0';
                    setTimeout(() => {
                        catalogHeader.classList.remove('visible');
                    }, 500);
                }
                if (categorySelector.classList.contains('visible')) {
                    categorySelector.style.opacity = '0';
                    setTimeout(() => {
                        categorySelector.classList.remove('visible');
                    }, 500);
                }
            } else {
                emptyState.style.display = 'none';
                const totalPages = Math.ceil(totalItemsInCategory / itemsPerPage);
                if (totalItemsInCategory > itemsPerPage) {
                    pagination.classList.remove('hidden');
                    pagination.classList.add('visible');
                    console.log('Pagination visible');
                } else {
                    pagination.classList.remove('visible');
                    pagination.classList.add('hidden');
                    console.log('Pagination hidden');
                }
                if (!catalogHeader.classList.contains('visible')) {
                    catalogHeader.style.opacity = '0';
                    catalogHeader.classList.add('visible');
                    setTimeout(() => {
                        catalogHeader.style.opacity = '1';
                    }, 10);
                }
                if (!categorySelector.classList.contains('visible')) {
                    categorySelector.style.opacity = '0';
                    categorySelector.classList.add('visible');
                    setTimeout(() => {
                        categorySelector.style.opacity = '1';
                    }, 10);
                }
                items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'item';
                    itemDiv.dataset.id = item.id;
                    itemDiv.dataset.category = item.category;
                    itemDiv.innerHTML = `
                        <img src="${item.poster || '/uploads/posters/default.jpg'}" alt="${item.title}">
                        <h4>${item.title}</h4>
                        <span class="rating">★ ${item.rating || 0}</span>
                        <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                        <button class="action-btn edit-btn"><i class="fas fa-pen"></i></button>
                    `;
                    itemsGrid.appendChild(itemDiv);
                });
                setupInteractivity();
                console.log('Total pages:', totalPages, 'Current page:', page);
                updatePagination(totalPages, page);

                itemsGrid.classList.remove('slide-out');
                itemsGrid.classList.add('slide-in');
            }
        } else {
            alert('Ошибка загрузки списка: ' + data.error);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Ошибка: ' + error.message);
    }
}

    function setupInteractivity() {
        document.querySelectorAll('.item').forEach(item => {
            const deleteBtn = item.querySelector('.delete-btn');
            const editBtn = item.querySelector('.edit-btn');

            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentItemId = item.dataset.id;
                    deleteModal.dataset.target = item;
                    item.classList.add('dimmed');
                    deleteModal.style.display = 'flex';
                    deleteModal.classList.add('active');
                });
            }

            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentItemId = item.dataset.id;
                    const currentItemCategory = item.dataset.category;

                    document.querySelectorAll('.category-checkboxes input').forEach(checkbox => {
                        checkbox.checked = false;
                    });

                    if (currentItemCategory) {
                        const checkbox = document.querySelector(`.category-checkboxes input[value="${currentItemCategory}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                            console.log(`Checked category: ${currentItemCategory}`);
                        } else {
                            console.warn(`Category ${currentItemCategory} not found in checkboxes`);
                        }
                    } else {
                        console.warn('No category found for item:', item.dataset.id);
                    }

                    categoryModal.style.display = 'flex';
                    categoryModal.classList.add('active');
                    disableInteractiveElements(true);
                });
            }
        });
    }

    async function deleteItem(itemId) {
        try {
            const response = await fetch(`http://localhost:3000/api/user/${userId}/lists/${itemId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                const item = document.querySelector(`.item[data-id="${itemId}"]`);
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                    if (itemsGrid.children.length === 0) {
                        emptyState.style.display = 'block';
                        pagination.classList.remove('visible');
                        catalogHeader.classList.remove('visible');
                        categorySelector.classList.remove('visible');
                    } else {
                        adjustGrid();
                    }
                }, 300);
            } else {
                throw new Error('Ошибка удаления элемента');
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    function adjustGrid() {
        const items = Array.from(itemsGrid.children);
        items.forEach((item, index) => {
            item.style.transition = 'transform 0.5s ease';
            const row = Math.floor(index / 6);
            const col = index % 6;
            item.style.transform = `translate(${col * 270}px, ${row * 360}px)`;
            setTimeout(() => {
                item.style.transition = '';
                item.style.transform = '';
            }, 500);
        });
    }

    confirmDeleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (currentItemId) {
            await deleteItem(currentItemId);
            closeDeleteModal();
        }
    });

    cancelDeleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDeleteModal();
    });

    closeDeleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDeleteModal();
    });

    function closeDeleteModal() {
        const target = document.querySelector(`.item[data-id="${currentItemId}"]`);
        if (target) {
            target.classList.remove('dimmed');
        }
        deleteModal.classList.remove('active');
        setTimeout(() => {
            deleteModal.style.display = 'none';
            deleteModal.dataset.target = null;
            currentItemId = null;
        }, 500);
    }

    saveCategoryBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const categories = Array.from(document.querySelectorAll('.category-checkboxes input:checked'))
            .map(input => input.value);
        if (categories.length > 0 && currentItemId) {
            try {
                const response = await fetch(`http://localhost:3000/api/user/${userId}/lists/${currentItemId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category: categories[0] })
                });
                if (response.ok) {
                    categoryModal.classList.remove('active');
                    disableInteractiveElements(false);
                    loadItems(currentCategory, currentPage);
                } else {
                    throw new Error('Ошибка изменения категории');
                }
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        }
    });

    cancelCategoryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        categoryModal.classList.remove('active');
        disableInteractiveElements(false);
    });

    avatarContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarContainer.classList.toggle('active');
    });

    logoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        localStorage.removeItem('userId');
        window.location.href = 'auth.html';
    });

    document.addEventListener('click', (e) => {
        if (cropModal.classList.contains('active')) {
            const modalContent = e.target.closest('#crop-modal .modal-content');
            if (!modalContent) {
                cropModal.classList.remove('active');
                disableInteractiveElements(false);
                cropper.destroy();
                avatarInput.value = '';
            }
        }

        if (editModal.classList.contains('active')) {
            const modalContent = e.target.closest('#edit-modal .modal-content');
            if (!modalContent) {
                editInput.value = '';
                editModal.classList.remove('active');
                disableInteractiveElements(false);
            }
        }

        if (passwordModal.classList.contains('active')) {
            const modalContent = e.target.closest('#password-modal .modal-content');
            if (!modalContent) {
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                passwordModal.classList.remove('active');
                disableInteractiveElements(false);
            }
        }

        if (deleteModal.classList.contains('active')) {
            const modalContent = e.target.closest('#delete-modal .modal-content');
            if (!modalContent) {
                closeDeleteModal();
            }
        }

        if (categoryModal.classList.contains('active')) {
            const modalContent = e.target.closest('#category-modal .modal-content');
            if (!modalContent) {
                categoryModal.classList.remove('active');
                disableInteractiveElements(false);
            }
        }

        if (avatarContainer.classList.contains('active') && !e.target.closest('.avatar-container')) {
            avatarContainer.classList.remove('active');
        }
    });

    function disableInteractiveElements(disable, currentRow = null) {
        const interactiveElements = [
            homeBtn,
            avatarContainer,
            accountBtn,
            catalogBtn,
            ...document.querySelectorAll('.info-row'),
            ...document.querySelectorAll('.action-btn')
        ].filter(el => el !== currentRow && el);

        interactiveElements.forEach(el => {
            if (el) el.style.pointerEvents = disable ? 'none' : 'auto';
            if (el.tagName === 'BUTTON') el.disabled = disable;
        });
    }

    function updatePagination(totalPages, page) {
        currentPage = page;
        pagination.innerHTML = '';
        if (totalPages > 1) {
            if (page > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'pagination-btn';
                prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                prevBtn.addEventListener('click', () => loadItems(currentCategory, page - 1));
                pagination.appendChild(prevBtn);
            }
            const pageInfo = document.createElement('span');
            pageInfo.className = 'page-info';
            pageInfo.textContent = `${page}/${totalPages}`;
            pagination.appendChild(pageInfo);
            if (page < totalPages) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'pagination-btn';
                nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                nextBtn.addEventListener('click', () => loadItems(currentCategory, page + 1));
                pagination.appendChild(nextBtn);
            }
        }
    }
});