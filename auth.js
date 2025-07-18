// auth.js
const CORRECT_PASSWORD = '001E5C1A36C0001E'; // Ваш пароль
const PASSWORD_KEY = 'adminPanelAuth'; // Ключ для sessionStorage

document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('auth-screen');
    const adminPanel = document.getElementById('admin-panel');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const authError = document.getElementById('authError');

    const isAuthenticated = sessionStorage.getItem(PASSWORD_KEY) === 'true';

    if (isAuthenticated) {
        authScreen.style.display = 'none';
        adminPanel.style.display = 'block';
    } else {
        authScreen.style.display = 'block';
        adminPanel.style.display = 'none';
    }

    loginButton.addEventListener('click', () => {
        if (passwordInput.value === CORRECT_PASSWORD) {
            sessionStorage.setItem(PASSWORD_KEY, 'true');
            authScreen.style.display = 'none';
            adminPanel.style.display = 'block';
            authError.textContent = '';
        } else {
            authError.textContent = 'Неверный пароль. Попробуйте еще раз.';
            passwordInput.value = '';
        }
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    });
});
