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

const passwordInput = document.getElementById("passwordInput");
const loginScreen = document.getElementById("loginScreen");
const mainPanel = document.getElementById("mainPanel");
const form = document.getElementById('appForm');
const output = document.getElementById('appsList');
const repoSelect = document.getElementById('repoType');
const vipSettings = document.getElementById('vipSettings');
const tokenOutput = document.getElementById('tokenOutput');
const searchInput = document.getElementById('searchInput');
let editKey = null;

window.checkPassword = () => {
  const password = passwordInput.value.trim();
  if (password === "001E5C1A36C0001E") {
    loginScreen.style.display = "none";
    mainPanel.style.display = "block";
    loadApps();
  } else {
    alert("❌ Неверный пароль!");
  }
};

repoSelect.addEventListener('change', () => {
  vipSettings.style.display = repoSelect.value === 'vipApps' ? 'block' : 'none';
  loadApps();
});

document.getElementById("generateToken").addEventListener("click", async () => {
  const token = Math.random().toString(36).substring(2, 12);
  const expireDate = new Date(document.getElementById("expireDate").value).toISOString();
  await set(ref(db, `vipTokens/${token}`), {
    createdAt: new Date().toISOString(),
    expiresAt: expireDate
  });
  tokenOutput.innerHTML = \`
    <h3>✅ VIP токен создан</h3>
    <p><b>🔑 Токен:</b> <code>\${token}</code></p>
    <p><b>📅 Истекает:</b> \${expireDate}</p>
    <textarea readonly onclick="this.select()" style="width:100%; height:55px; font-size:13px;">
https://api-u3vwde53ja-uc.a.run.app/vipRepo.json?token=\${token}
    </textarea>\`;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const iconUrl = form.iconURL.value.includes("?raw=true") ? form.iconURL.value : form.iconURL.value + "?raw=true";
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
    icon: iconUrl,
    iconURL: iconUrl,
    appUpdateTime: new Date().toISOString()
  };

  const repo = repoSelect.value;
  const path = \`\${repo}/apps\`;

  if (editKey) {
    await update(ref(db, \`\${path}/\${editKey}\`), appData);
    editKey = null;
  } else {
    await push(ref(db, path), appData);
  }

  form.reset();
  vipSettings.style.display = 'none';
  loadApps();
});

function loadApps() {
  const repo = repoSelect.value;
  const appsPath = \`\${repo}/apps\`;

  onValue(ref(db, appsPath), (snapshot) => {
    output.innerHTML = "";
    snapshot.forEach(child => {
      const app = child.val();
      if (!app.name.toLowerCase().includes(searchInput.value.toLowerCase())) return;
      const appDiv = document.createElement('div');
      appDiv.className = 'appCard';
      appDiv.innerHTML = \`
        <img src="\${app.iconURL}" width="48" height="48">
        <strong>\${app.name}</strong> (\${app.version})<br>
        <small>\${app.bundleID}</small><br>
        <button class="editBtn" data-id="\${child.key}">✏️ Редактировать</button>
        <button class="deleteBtn" onclick="deleteApp('\${repo}', '\${child.key}')">🗑️ Удалить</button>
      \`;
      appDiv.querySelector('.editBtn').addEventListener('click', () => {
        form.name.value = app.name;
        form.bundleID.value = app.bundleID;
        form.version.value = app.version;
        form.size.value = app.size;
        form.downloadURL.value = app.downloadURL;
        form.iconURL.value = app.iconURL.replace("?raw=true", "");
        form.description.value = app.localizedDescription;
        editKey = child.key;
      });
      output.appendChild(appDiv);
    });
  });
}

function deleteApp(repo, key) {
  remove(ref(db, \`\${repo}/apps/\${key}\`)).then(() => loadApps());
}
window.deleteApp = deleteApp;

searchInput.addEventListener("input", () => loadApps());