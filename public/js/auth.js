document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const formContainer = document.querySelector('.form-container');

    // Функция для обновления высоты .form-container
    function updateContainerHeight(activeForm) {
        formContainer.style.height = 'auto';
        const height = activeForm.getBoundingClientRect().height + 'px';
        formContainer.style.height = height;
    }

    // Инициализация высоты при загрузке страницы
    const initialActiveForm = document.querySelector('.form.active');
    updateContainerHeight(initialActiveForm);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            console.log(`Switching to ${targetTab} tab`);

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            forms.forEach(form => {
                form.classList.remove('active', 'slide-out-left', 'slide-in-right');

                if (form.id === `${targetTab}-form`) {
                    console.log(`Activating ${form.id}`);
                    form.classList.add('active', 'slide-in-right');
                    updateContainerHeight(form);
                } else {
                    form.classList.add('slide-out-left');
                    setTimeout(() => {
                        if (!form.classList.contains('active')) {
                            form.classList.remove('slide-out-left');
                        }
                    }, 500);
                }
            });
        });
    });

    // Очистка всех сообщений об ошибках
    function clearAllErrors(form) {
        const formError = form.querySelector('.form-error');
        formError.textContent = '';
        const inputErrors = form.querySelectorAll('.error-message');
        inputErrors.forEach(error => {
            error.textContent = '';
            error.parentElement.classList.remove('error');
        });
    }

    // Показ сообщения об ошибке формы
    function showFormError(form, message) {
        clearAllErrors(form);
        const formError = form.querySelector('.form-error');
        formError.textContent = message;
    }

    // Показ ошибки поля
    function showInputError(group, message) {
        clearAllErrors(group.closest('form'));
        group.classList.add('error');
        const error = group.querySelector('.error-message');
        error.textContent = message;
    }

    // Валидация формы
    function validateForm(form, event) {
        event.preventDefault();
        let isValid = true;
        const inputs = form.querySelectorAll('.input-group');
        inputs.forEach(group => {
            const input = group.querySelector('input');
            if (!input.value.trim()) {
                isValid = false;
                showInputError(group, 'Поле не может быть пустым');
                return;
            } else if (input.type === 'email' && !input.value.includes('@')) {
                isValid = false;
                showInputError(group, 'Введите корректный email');
                return;
            } else if (input.classList.contains('password') && input.value.length < 6) {
                isValid = false;
                showInputError(group, 'Пароль должен содержать минимум 6 символов');
                return;
            }
        });
        if (isValid) {
            clearAllErrors(form);
        }
        return isValid;
    }

    // Обработка формы входа
    loginForm.addEventListener('submit', async (e) => {
        if (!validateForm(loginForm, e)) return;

        const email = loginForm.querySelector('.email').value;
        const password = loginForm.querySelector('.password').value;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('userId', data.id);
                window.location.href = '/';
            } else {
                showFormError(loginForm, data.error || 'Неверно введён адрес электронной почты или пароль');
            }
        } catch (error) {
            showFormError(loginForm, 'Ошибка: ' + error.message);
        }
    });

    // Обработка формы регистрации
    registerForm.addEventListener('submit', async (e) => {
        if (!validateForm(registerForm, e)) return;

        const email = registerForm.querySelector('.email').value;
        const username = registerForm.querySelector('.username').value;
        const password = registerForm.querySelector('.password').value;
        const confirmPassword = registerForm.querySelector('.confirm-password').value;

        if (password !== confirmPassword) {
            const passwordGroup = registerForm.querySelector('.input-group:nth-child(3)');
            showInputError(passwordGroup, 'Пароли не совпадают');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('userId', data.id);
                window.location.href = '/';
            } else {
                showFormError(registerForm, data.error || 'Ошибка регистрации');
            }
        } catch (error) {
            showFormError(registerForm, 'Ошибка: ' + error.message);
        }
    });
});