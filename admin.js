// Firebase SDK compat
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const loginScreen = document.getElementById('authScreen');
const mainPanel = document.getElementById('mainPanel');
const loginBtn = document.getElementById('loginBtn');
const passInput = document.getElementById('adminPass');

const form = document.getElementById('appForm');
const repoSelect = document.getElementById('repoType');
const vipSettings = document.getElementById('vipSettings');
const tokenOutput = document.getElementById('tokenOutput');
const output = document.getElementById('appsList');
const searchInput = document.getElementById('searchInput');
const generateTokenBtn = document.getElementById('generateTokenBtn');
let editKey = null;
let appsCache = []; // Для поиска

// Вход по паролю
loginBtn.onclick = () => {
  if (passInput.value === "001E5C1A36C0001E") {
    loginScreen.classList.add('hidden');
    mainPanel.classList.remove('hidden');
    loadApps();
  } else {
    alert("❌ Неверный пароль");
  }
};

// Генерация отдельного VIP токена
generateTokenBtn.onclick = async () => {
  const expireDate = prompt("Введите дату окончания токена в формате YYYY-MM-DDTHH:mm");
  if (!expireDate) return;

  const token = Math.random().toString(36).substring(2, 12);
  await firebase.database().ref(`vipTokens/${token}`).set({
    createdAt: new Date().toISOString(),
    expiresAt: new Date(expireDate).toISOString()
  });

  tokenOutput.innerHTML = `
    <h3>✅ VIP токен создан</h3>
    <p><b>🔑 Токен:</b> <code>${token}</code></p>
    <p><b>📅 Истекает:</b> ${expireDate}</p>
    <p><b>📥 GBox JSON:</b></p>
    <textarea readonly onclick="this.select()">
https://api-u3vwde53ja-uc.a.run.app/vipRepo.json?token=${token}
    </textarea>`;
};

repoSelect.onchange = () => {
  vipSettings.style.display = repoSelect.value === 'vipApps' ? 'block' : 'none';
  loadApps();
};

// Обработка формы добавления / редактирования
form.onsubmit = async (e) => {
  e.preventDefault();

  const iconUrl = form.iconURL.value.includes('?raw=true')
    ? form.iconURL.value
    : form.iconURL.value + '?raw=true';

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
  const path = `${repo}/apps`;

  if (editKey) {
    await firebase.database().ref(`${path}/${editKey}`).update(appData);
    editKey = null;
  } else {
    await firebase.database().ref(path).push(appData);
  }

  if (repo === 'vipApps' && form.expireDate.value) {
    const token = Math.random().toString(36).substring(2, 12);
    const expireDate = new Date(form.expireDate.value).toISOString();
    await firebase.database().ref(`vipTokens/${token}`).set({
      createdAt: new Date().toISOString(),
      expiresAt: expireDate
    });

    tokenOutput.innerHTML = `
      <h3>✅ VIP токен создан</h3>
      <p><b>🔑 Токен:</b> <code>${token}</code></p>
      <p><b>📅 Истекает:</b> ${expireDate}</p>
      <p><b>📥 GBox JSON:</b></p>
      <textarea readonly onclick="this.select()">
https://api-u3vwde53ja-uc.a.run.app/vipRepo.json?token=${token}
      </textarea>`;
  } else {
    tokenOutput.innerHTML = '';
  }

  form.reset();
  loadApps();
};

// Загрузка приложений
function loadApps() {
  const repo = repoSelect.value;
  const path = `${repo}/apps`;

  firebase.database().ref(path).once('value', (snapshot) => {
    output.innerHTML = '';
    appsCache = [];

    snapshot.forEach((child) => {
      const data = child.val();
      data.id = child.key;
      appsCache.push(data);
    });

    renderApps(appsCache);
  });
}

// Рендер списка
function renderApps(list) {
  output.innerHTML = '';
  list.forEach(app => {
    const appDiv = document.createElement('div');
    appDiv.className = 'appCard';
    appDiv.innerHTML = `
      <img src="${app.iconURL}" />
      <div>
        <strong>${app.name}</strong> (${app.version})<br>
        <small>${app.bundleID}</small><br>
        <button class="editBtn">✏️ Редактировать</button>
        <button class="deleteBtn">🗑️ Удалить</button>
      </div>
    `;

    appDiv.querySelector('.editBtn').onclick = () => {
      form.name.value = app.name;
      form.bundleID.value = app.bundleID;
      form.version.value = app.version;
      form.size.value = app.size;
      form.downloadURL.value = app.downloadURL;
      form.iconURL.value = app.iconURL.replace('?raw=true', '');
      form.description.value = app.localizedDescription;
      editKey = app.id;
    };

    appDiv.querySelector('.deleteBtn').onclick = async () => {
      await firebase.database().ref(`${repoSelect.value}/apps/${app.id}`).remove();
      loadApps();
    };

    output.appendChild(appDiv);
  });
}

// Поиск
searchInput.oninput = () => {
  const q = searchInput.value.toLowerCase().trim();
  const filtered = appsCache.filter(app =>
    app.name.toLowerCase().includes(q) || app.bundleID.toLowerCase().includes(q)
  );
  renderApps(filtered);
};
