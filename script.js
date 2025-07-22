import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  update,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const pendingTokensList = document.getElementById("pendingTokensList");

let editKey = null;
let currentApps = [];

function loadApps() {
  const repo = repoSelect.value;
  const appsPath = `${repo}`; // ✅ Исправлено: убрали /apps

  onValue(ref(db, appsPath), (snapshot) => {
    output.innerHTML = "";
    currentApps = [];

    if (!snapshot.exists()) {
      output.innerHTML = `<p>Нет приложений в этом репозитории.</p>`;
      return;
    }

    snapshot.forEach((child) => {
      const appData = child.val();
      currentApps.push({ key: child.key, ...appData });
    });

    currentApps.sort((a, b) => new Date(b.appUpdateTime || 0) - new Date(a.appUpdateTime || 0));
    filterAndDisplayApps();
  });
}

function filterAndDisplayApps() {
  const repo = repoSelect.value;
  output.innerHTML = `<h2>📱 ${repo === 'vipApps' ? 'VIP' : 'Обычные'} приложения</h2>`;
  output.innerHTML += `<p><small>Путь: ${repo}</small></p><hr>`;

  const searchTerm = appSearchInput.value.toLowerCase();
  const filteredApps = currentApps.filter(app =>
    app.name.toLowerCase().includes(searchTerm) || app.bundleID.toLowerCase().includes(searchTerm)
  );

  if (filteredApps.length === 0) {
    output.innerHTML += `<p>Приложения не найдены.</p>`;
    return;
  }

  filteredApps.forEach(app => {
    const appDiv = document.createElement("div");
    appDiv.className = "appCard";
    appDiv.innerHTML = `
      <img src="${app.iconURL || 'placeholder.png'}" alt="${app.name} icon">
      <div class="app-info">
        <strong>${app.name}</strong> (${app.version})<br>
        <small>${app.bundleID}</small>
      </div>
      <div class="app-actions">
        <button class="editBtn" data-id="${app.key}">✏️ Редактировать</button>
        <button class="deleteBtn" data-repo="${repo}" data-id="${app.key}">🗑️ Удалить</button>
      </div>
    `;
    output.appendChild(appDiv);

    appDiv.querySelector(".editBtn").addEventListener("click", () => editApp(app.key, app));
    appDiv.querySelector(".deleteBtn").addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm(`Удалить приложение "${app.name}"?`)) {
        await remove(ref(db, `${repo}/${id}`));
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
  form.scrollIntoView({ behavior: "smooth" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const finalIconURL = form.iconURL.value.includes("github.com") && !form.iconURL.value.endsWith("?raw=true")
    ? form.iconURL.value + "?raw=true"
    : form.iconURL.value;

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
  const path = `${repo}`;

  if (editKey) {
    await update(ref(db, `${path}/${editKey}`), appData);
    editKey = null;
  } else {
    await push(ref(db, path), appData);
  }

  form.reset();
  loadApps();
});

generateVipTokenButton.addEventListener("click", async () => {
  const expireDateValue = vipExpireDateInput.value;
  if (!expireDateValue) return alert("Выберите дату окончания токена.");

  const token = Math.random().toString(36).substring(2, 12);
  const expireDate = new Date(expireDateValue).toISOString();

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

  loadPendingTokens();
});

function loadPendingTokens() {
  onValue(ref(db, "vipTokens"), (snapshot) => {
    pendingTokensList.innerHTML = "";

    snapshot.forEach((childSnap) => {
      const token = childSnap.key;
      const data = childSnap.val();
      if (!data.approved) {
        const el = document.createElement("div");
        el.className = "appCard";
        el.innerHTML = `
          <div class="app-info">
            <strong>🔑 ${token}</strong>
            <br><small>Истекает: ${new Date(data.expiresAt).toLocaleString()}</small>
          </div>
          <div class="app-actions">
            <button class="approveBtn">✅ Подтвердить</button>
            <button class="deleteBtn">🗑️ Удалить</button>
          </div>
        `;

        el.querySelector(".approveBtn").addEventListener("click", async () => {
          await update(ref(db, `vipTokens/${token}`), { approved: true });
          loadPendingTokens();
        });

        el.querySelector(".deleteBtn").addEventListener("click", async () => {
          if (confirm(`Удалить токен ${token}?`)) {
            await remove(ref(db, `vipTokens/${token}`));
            loadPendingTokens();
          }
        });

        pendingTokensList.appendChild(el);
      }
    });

    if (pendingTokensList.innerHTML === "") {
      pendingTokensList.innerHTML = "<p>Нет ожидающих токенов.</p>";
    }
  });
}

appSearchInput.addEventListener("input", filterAndDisplayApps);

document.addEventListener("DOMContentLoaded", () => {
  loadApps();
  loadPendingTokens();
  const now = new Date();
  now.setMonth(now.getMonth() + 1);
  vipExpireDateInput.value = now.toISOString().substring(0, 16);
});

window.deleteApp = deleteApp;
