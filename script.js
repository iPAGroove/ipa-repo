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

const form = document.getElementById("appForm");
const output = document.getElementById("appsList");
const repoSelect = document.getElementById("repoType");
const tokenOutput = document.getElementById("tokenOutput");
const vipExpireDateInput = document.getElementById("vipExpireDate");
const generateVipTokenButton = document.getElementById("generateVipTokenButton");
const appSearchInput = document.getElementById("appSearchInput");

let editKey = null;
let currentApps = [];

function loadApps() {
  const repo = repoSelect.value;
  const appsPath = `${repo}/apps`;

  onValue(ref(db, appsPath), (snapshot) => {
    output.innerHTML = '';
    currentApps = [];

    if (!snapshot.exists()) {
      output.innerHTML = `<p>Нет приложений в этом репозитории.</p>`;
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
    output.innerHTML = `<p class="error-message">Ошибка загрузки данных: ${error.message}</p>`;
  });
}

function filterAndDisplayApps() {
  output.innerHTML = `<h2>📱 ${repoSelect.value === 'vipApps' ? 'VIP' : 'Обычные'} приложения</h2>`;
  output.innerHTML += `<p><small>Путь: ${repoSelect.value}/apps</small></p><hr>`;

  const searchTerm = appSearchInput.value.toLowerCase();
  const filteredApps = currentApps.filter(app =>
    app.name.toLowerCase().includes(searchTerm) ||
    app.bundleID.toLowerCase().includes(searchTerm)
  );

  if (filteredApps.length === 0) {
    output.innerHTML += `<p>Приложения не найдены.</p>`;
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
        <button class="deleteBtn" data-repo="${repoSelect.value}" data-id="${app.key}">🗑️ Удалить</button>
      </div>
    `;
    output.appendChild(appDiv);

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

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

  const repo = repoSelect.value;
  const path = `${repo}/apps`;

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
});

generateVipTokenButton.addEventListener("click", async () => {
  const expireDateValue = vipExpireDateInput.value;
  if (!expireDateValue) return alert("Выберите дату окончания токена.");

  const token = Math.random().toString(36).substring(2, 12);
  const expireDate = new Date(expireDateValue).toISOString();

  try {
    await set(ref(db, `vipTokens/${token}`), {
      createdAt: new Date().toISOString(),
      expiresAt: expireDate,
      approved: false,
      used: false
    });

    tokenOutput.innerHTML = `
      <h3>✅ VIP токен создан</h3>
      <p><b>🔑 Токен:</b> <code>${token}</code></p>
      <p><b>📅 Истекает:</b> ${new Date(expireDate).toLocaleString()}</p>
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
});

repoSelect.addEventListener('change', () => {
  loadApps();
});

appSearchInput.addEventListener('input', filterAndDisplayApps);

document.addEventListener("DOMContentLoaded", () => {
  loadApps();
  const now = new Date();
  now.setMonth(now.getMonth() + 1);
  vipExpireDateInput.value = now.toISOString().substring(0, 16);
});
