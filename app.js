const API_URL = 'http://127.0.0.1:8000/api/';
let pendingRedirect = 'home';

document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    loadTournaments();
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('message').innerText = '';

    if (pageId === 'dashboard' && !localStorage.getItem('access')) {
        pendingRedirect = 'dashboard';
        showPage('login');
        document.getElementById('message').innerText = 'Будь ласка, увійдіть у систему.';
        return;
    }

    if ((pageId === 'login' || pageId === 'register') && localStorage.getItem('access')) {
        pageId = 'dashboard';
    }

    document.getElementById('page-' + pageId).style.display = 'block';
    if (pageId === 'home') loadTournaments();
}

function updateNav() {
    const authNav = document.getElementById('auth-nav');
    const username = localStorage.getItem('username');

    if (username) {
        authNav.innerHTML = `
            <a href="#" onclick="showPage('dashboard')">Панель</a>
            <span>Вітаю, <b>${username}</b></span>
            <button onclick="logout()">Вийти</button>
        `;
    } else {
        authNav.innerHTML = `
            <a href="#" onclick="showPage('login')">Логін</a>
            <a href="#" onclick="showPage('register')">Реєстрація</a>
        `;
    }
}

async function loadTournaments() {
    try {
        const res = await fetch(API_URL + 'tournaments/');
        const data = await res.json();
        const container = document.getElementById('tournaments-list');
        container.innerHTML = data.map(t => `
            <div class="tournament-card">
                <h3>${t.title} (${t.game})</h3>
                <p>Статус: ${t.status}</p>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(API_URL + 'auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        localStorage.setItem('username', username);
        updateNav();
        showPage(pendingRedirect);
        pendingRedirect = 'home';
    } else {
        document.getElementById('message').innerText = 'Помилка входу';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const first_name = document.getElementById('reg-first-name').value;
    const last_name = document.getElementById('reg-last-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const password_confirmation = document.getElementById('reg-password-conf').value;

    const res = await fetch(API_URL + 'auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, first_name, last_name, email, password, password_confirmation })
    });

    if (res.ok) {
        alert('Реєстрація успішна! Увійдіть.');
        showPage('login');
    } else {
        const err = await res.json();
        document.getElementById('message').innerText = JSON.stringify(err);
    }
}

async function apiRequest(url, options = {}) {
    let token = localStorage.getItem('access');
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;
    if (options.body && typeof options.body === 'object') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    let res = await fetch(url, options);
    if (res.status === 401 && localStorage.getItem('refresh')) {
        const refreshed = await refreshToken();
        if (refreshed) {
            options.headers['Authorization'] = `Bearer ${localStorage.getItem('access')}`;
            res = await fetch(url, options);
        } else {
            logout();
            showPage('login');
        }
    }
    return res;
}

async function refreshToken() {
    const refresh = localStorage.getItem('refresh');
    const res = await fetch(API_URL + 'auth/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
    });
    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access', data.access);
        return true;
    }
    return false;
}

async function handleCreateTournament(e) {
    e.preventDefault();
    const title = document.getElementById('t-title').value;
    const game = document.getElementById('t-game').value;
    const start_date = document.getElementById('t-start').value;
    const end_date = document.getElementById('t-end').value;

    const res = await apiRequest(API_URL + 'tournaments/', {
        method: 'POST',
        body: { title, game, start_date, end_date, organizer_id: 1 }
    });

    if (res.ok) {
        alert('Турнір створено!');
        showPage('home');
    } else {
        document.getElementById('message').innerText = 'Помилка створення';
    }
}

function logout() {
    localStorage.clear();
    updateNav();
    showPage('home');
}