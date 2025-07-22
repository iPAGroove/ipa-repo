import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRmKbekcv6OW8oaMsHPlc8WvfIWnyFAI0",
  authDomain: "appgamesrepo.firebaseapp.com",
  databaseURL: "https://appgamesrepo-default-rtdb.firebaseio.com",
  projectId: "appgamesrepo",
  storageBucket: "appgamesrepo.appspot.com",
  messagingSenderId: "220298514248",
  appId: "1:220298514248:web:f3193a6042d3e1a67a6d7d",
  measurementId: "G-0YVBYHKG2D"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const contentArea = document.getElementById("content-area");
const navFreeButton = document.getElementById("nav-free");
const navVipButton = document.getElementById("nav-vip");
const navTokenButton = document.getElementById("nav-token");
const navListButton = document.getElementById("nav-list");

let editKey = null;
let currentApps = [];
let currentRepoType = 'apps'; // По умолчанию показываем FREE

// --- Функции для управления контентом ---

function showSection(sectionId) {
  contentArea.innerHTML = ''; // Очищаем текущий контент
  let sectionContent = '';

  switch (sectionId) {
    case 'free':
    case 'vip':
      currentRepoType = (sectionId === 'free') ? 'apps' : 'vipApps';
      sectionContent = `
        <div class="panel-section">
          <h2>Добавить / Редактировать ${sectionId === 'free' ? 'FREE' : 'VIP'} приложение</h2>
          <form id="appForm">
            <input type="hidden" id="repoType" value="${currentRepoType}" />
            <input type="text" id="name" placeholder="Название" required />
            <input type="text" id="bundleID" placeholder="Bundle ID" required />
            <input type="text" id="version" placeholder="Версия" required />
            <input type="number" id="size" placeholder="Размер (в байтах)" required />
            <input type="text" id="downloadURL" placeholder="Ссылка на IPA" required />
            <input type="text" id="iconURL" placeholder="Ссылка на иконку" required />
            <textarea id="description" placeholder="Описание"></textarea>
            <button type="submit">💾 Сохранить приложение</button>
          </form>
        </div>

        <div class="panel-section">
          <h2>Список ${sectionId === 'free' ? 'FREE' : 'VIP'} приложений</h2>
          <input type="text" id="appSearchInput" placeholder="Поиск по названию или Bundle ID..." />
          <div id="appsList"></div>
        </div>
      `;
      break;

    case 'token':
      sectionContent = `
        <div class="panel-section">
          <h2>Генерация VIP токена</h2>
          <div id="vipTokenGenerator">
            <label for="tokenDuration">Срок действия токена:</label>
            <select id="tokenDuration">
              <option value="1">1 месяц</option>
              <option value="3">3 месяца</option>
              <option value="6">6 месяцев</option>
            </select>
            <button id="generateVipTokenButton">🔑 Сгенерировать VIP токен</button>
            <div id="tokenOutput"></div>
          </div>
        </div>
      `;
      break;

    case 'list':
      sectionContent = `
        <div class="panel-section">
          <h2>Список всех токенов</h2>
          <h3>✅ Подтвержденные токены</h3>
          <div id="approvedTokensList"></div>
          <h3>🕒 Токены, ожидающие подтверждения</h3>
          <div id="pendingTokensList"></div>
        </div>
      `;
      break;
  }

  contentArea.innerHTML = sectionContent;
  initializeSection(sectionId);
}

function initializeSection(sectionId) {
  switch (sectionId) {
    case 'free':
    case 'vip':
      const appForm = document.getElementById("appForm");
      const appsListOutput = document.getElementById("appsList");
      const appSearchInput = document.getElementById("appSearchInput");

      // Привязка формы
      appForm.addEventListener("submit", handleAppFormSubmit);

      // Привязка поиска
      appSearchInput.addEventListener('input', filterAndDisplayApps);

      loadApps(); // Загружаем приложения для текущего типа репозитория
      break;

    case 'token':
      const generateVipTokenButton = document.getElementById("generateVipTokenButton");
      generateVipTokenButton.addEventListener("click", generateVipToken);
      break;

    case 'list':
      loadAllTokens();
      break;
  }
}

// --- Функции для работы с приложениями (FREE/VIP) ---

function loadApps() {
  const appsPath = `${currentRepoType}/apps`;

  onValue(ref(db, appsPath), (snapshot) => {
    const appsListOutput = document.getElementById("appsList");
    if (!appsListOutput) return; // Проверка, что элемент существует

    appsListOutput.innerHTML = '';
    currentApps = [];

    if (!snapshot.exists()) {
      appsListOutput.innerHTML = `<p>Нет приложений в этом репозитории.</p>`;
      return;
    }

    snapshot.forEach(child => {
      const appData = child.val();
      currentApps.push({ key: child.key, ...appData });
    });

    currentApps.sort((a, b) => new Date(b.appUpdateTime || 0) - new Date(a.appUpdateTime || 0));
    filterAndDisplayApps();
  }, (error) => {
    console.error("Ошибка загрузки приложений:", error);
    const appsListOutput = document.getElementById("appsList");
    if (appsListOutput) {
      appsListOutput.innerHTML = `<p class="error-message">Ошибка загрузки данных: ${error.message}</p>`;
    }
  });
}

function filterAndDisplayApps() {
  const appsListOutput = document.getElementById("appsList");
  const appSearchInput = document.getElementById("appSearchInput");

  if (!appsListOutput || !appSearchInput) return;

  appsListOutput.innerHTML = `<h2>📱 ${currentRepoType === 'vipApps' ? 'VIP' : 'Обычные'} приложения</h2>`;
  appsListOutput.innerHTML += `<p><small>Путь: ${currentRepoType}/apps</small></p><hr>`;

  const searchTerm = appSearchInput.value.toLowerCase();
  const filteredApps = currentApps.filter(app =>
    app.name.toLowerCase().includes(searchTerm) ||
    app.bundleID.toLowerCase().includes(searchTerm)
  );

  if (filteredApps.length === 0) {
    appsListOutput.innerHTML += `<p>Приложения не найдены.</p>`;
    return;
  }

  filteredApps.forEach(app => {
    const appDiv = document.createElement('div');
    appDiv.className = 'appCard';
    appDiv.innerHTML = `
      <img src="${app.iconURL || 'placeholder.png'}" alt="${app.name} icon">
      <div class="app-info">
        <strong>${app.name}</strong> (${app.version})<br>
        <small>${app.bundleID}</small>
      </div>
      <div class="app-actions">
        <button class="editBtn" data-id="${app.key}">✏️ Редактировать</button>
        <button class="deleteBtn" data-repo="${currentRepoType}" data-id="${app.key}">🗑️ Удалить</button>
      </div>
    `;
    appsListOutput.appendChild(appDiv);

    appDiv.querySelector('.editBtn').addEventListener('click', () => editApp(app.key, app));
    appDiv.querySelector('.deleteBtn').addEventListener('click', async (e) => {
      const repo = e.target.dataset.repo;
      const id = e.target.dataset.id;
      if (confirm(`Удалить приложение "${app.name}"?`)) {
        await remove(ref(db, `${repo}/apps/${id}`));
        loadApps();
      }
    });
  });
}

function editApp(key, app) {
  const form = document.getElementById("appForm");
  if (!form) return;

  form.name.value = app.name;
  form.bundleID.value = app.bundleID;
  form.version.value = app.version;
  form.size.value = app.size;
  form.downloadURL.value = app.downloadURL;
  form.iconURL.value = app.iconURL.endsWith('?raw=true') ? app.iconURL : app.iconURL + '?raw=true';
  form.description.value = app.localizedDescription;
  editKey = key;
  form.scrollIntoView({ behavior: 'smooth' });
}

async function handleAppFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const iconUrlValue = form.iconURL.value;
  const finalIconURL = iconUrlValue.includes('github.com') && !iconUrlValue.endsWith('?raw=true')
    ? iconUrlValue + '?raw=true'
    : iconUrlValue;

  const appData = {
    name: form.name.value,
    type: 1,
    bundleID: form.bundleID.value,
    bundleIdentifier: form.bundleID.value,
    version: form.version.value,
    size: parseInt(form.size.value),
    down: form.downloadURL.value,
    downloadURL: form.downloadURL.value,
    developerName: "",
    localizedDescription: form.description.value,
    icon: finalIconURL,
    iconURL: finalIconURL,
    appUpdateTime: new Date().toISOString()
  };

  const path = `${currentRepoType}/apps`;

  try {
    if (editKey) {
      await update(ref(db, `${path}/${editKey}`), appData);
      alert('Приложение успешно обновлено!');
      editKey = null;
    } else {
      await push(ref(db, path), appData);
      alert('Приложение успешно добавлено!');
    }
    form.reset();
    loadApps();
  } catch (error) {
    console.error("Ошибка сохранения приложения:", error);
    alert(`Ошибка сохранения: ${error.message}`);
  }
}

// --- Функции для работы с токенами ---

async function generateVipToken() {
  const tokenDurationSelect = document.getElementById("tokenDuration");
  const tokenOutput = document.getElementById("tokenOutput");
  if (!tokenDurationSelect || !tokenOutput) return;

  const durationMonths = parseInt(tokenDurationSelect.value);
  const now = new Date();
  const expireDate = new Date(now.setMonth(now.getMonth() + durationMonths));

  const token = Math.random().toString(36).substring(2, 12);

  try {
    await set(ref(db, `vipTokens/${token}`), {
      createdAt: new Date().toISOString(),
      expiresAt: expireDate.toISOString(),
      approved: false,
      used: false
    });

    tokenOutput.innerHTML = `
      <h3>✅ VIP токен создан</h3>
      <p><b>🔑 Токен:</b> <code>${token}</code></p>
      <p><b>📅 Истекает:</b> ${expireDate.toLocaleString()}</p>
      <p><b>📥 GBox JSON:</b></p>
      <textarea readonly onclick="this.select()" style="width:100%; height:55px; font-size:13px;">
https://api-u3vwde53ja-uc.a.run.app/vipRepo.json?token=${token}
      </textarea>
      <p><small>Скопируйте токен или полную ссылку для GBox JSON.</small></p>
    `;
  } catch (error) {
    console.error("Ошибка генерации VIP токена:", error);
    tokenOutput.innerHTML = `<p class="error-message">Ошибка генерации токена: ${error.message}</p>`;
  }
}

function loadAllTokens() {
  const approvedTokensList = document.getElementById("approvedTokensList");
  const pendingTokensList = document.getElementById("pendingTokensList");
  if (!approvedTokensList || !pendingTokensList) return;

  onValue(ref(db, "vipTokens"), (snapshot) => {
    approvedTokensList.innerHTML = "";
    pendingTokensList.innerHTML = "";

    if (!snapshot.exists()) {
      approvedTokensList.innerHTML = "<p>Нет подтвержденных токенов.</p>";
      pendingTokensList.innerHTML = "<p>Нет токенов в ожидании.</p>";
      return;
    }

    snapshot.forEach((child) => {
      const token = child.key;
      const data = child.val();

      const createdAt = new Date(data.createdAt);
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();

      const expired = expiresAt < now;
      const approved = data.approved === true;
      const used = data.used === true;

      const timeRemainingMs = expiresAt.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));
      const daysLeftText = daysRemaining > 0 ? `${daysRemaining} дн. осталось` : 'Истёк';


      const item = document.createElement("div");
      item.className = "appCard";
      item.innerHTML = `
        <div class="app-info">
          <strong>Токен:</strong> <code>${token}</code><br>
          <small>Создан: ${createdAt.toLocaleDateString()}</small><br>
          <small>Истекает: ${expiresAt.toLocaleString()}</small><br>
          <small>${daysLeftText}</small>
        </div>
        <div class="app-actions">
          ${!approved && !expired && !used ? '<button class="approveBtn">✅ Подтвердить</button>' : ''}
          <button class="deleteBtn">🗑 Удалить</button>
        </div>
      `;

      item.querySelector(".deleteBtn").addEventListener("click", async () => {
        if (confirm(`Удалить токен ${token}?`)) {
          await remove(ref(db, `vipTokens/${token}`));
        }
      });

      if (!approved && !expired && !used) {
        item.querySelector(".approveBtn")?.addEventListener("click", async () => {
          await update(ref(db, `vipTokens/${token}`), { approved: true });
          alert("Токен подтверждён ✅");
        });
        pendingTokensList.appendChild(item);
      } else if (approved) {
        approvedTokensList.appendChild(item);
      }
    });
  });
}

// --- Обработчики навигации ---

navFreeButton.addEventListener('click', () => {
  showSection('free');
  setActiveNavButton(navFreeButton);
});

navVipButton.addEventListener('click', () => {
  showSection('vip');
  setActiveNavButton(navVipButton);
});

navTokenButton.addEventListener('click', () => {
  showSection('token');
  setActiveNavButton(navTokenButton);
});

navListButton.addEventListener('click', () => {
  showSection('list');
  setActiveNavButton(navListButton);
});

function setActiveNavButton(button) {
  document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

// --- Инициализация при загрузке страницы ---

document.addEventListener("DOMContentLoaded", () => {
  // Показываем секцию FREE по умолчанию при загрузке
  showSection('free');
  setActiveNavButton(navFreeButton);
});

// Добавлен для отслеживания изменения статуса аутентификации (из auth.js)
window.addEventListener('auth-success', () => {
  showSection('free');
  setActiveNavButton(navFreeButton);
});
