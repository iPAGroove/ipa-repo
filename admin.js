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

const form = document.getElementById('appForm');
const output = document.getElementById('appsList');
const repoSelect = document.getElementById('repoType');
const vipSettings = document.getElementById('vipSettings');
const tokenOutput = document.getElementById('tokenOutput');
const passwordInput = document.getElementById('passwordInput');
const loginScreen = document.getElementById('loginScreen');
const loginError = document.getElementById('loginError');
let editKey = null;

const PASSWORD = "001E5C1A36C0001E";

function checkPassword() {
  if (passwordInput.value === PASSWORD) {
    loginScreen.style.display = "none";
  } else {
    loginError.innerText = "❌ Неверный пароль";
  }
}

repoSelect.addEventListener('change', () => {
  vipSettings.style.display = repoSelect.value === 'vipApps' ? 'block' : 'none';
  loadApps();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const iconRaw = form.iconURL.value.endsWith("?raw=true")
    ? form.iconURL.value
    : form.iconURL.value + "?raw=true";

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
    icon: iconRaw,
    iconURL: iconRaw,
    appUpdateTime: new Date().toISOString()
  };

  const repo = repoSelect.value;
  const path = `${repo}/apps`;

  if (editKey) {
    await db.ref(`${path}/${editKey}`).update(appData);
    editKey = null;
  } else {
    await db.ref(path).push(appData);
  }

  if (repo === 'vipApps') {
    const token = Math.random().toString(36).substring(2, 12);
    const expireDate = new Date(document.getElementById('expireDate').value).toISOString();

    await db.ref(`vipTokens/${token}`).set({
      createdAt: new Date().toISOString(),
      expiresAt: expireDate
    });

    tokenOutput.innerHTML = `
      <h3>✅ VIP токен создан</h3>
      <p><b>🔑 Токен:</b> <code>${token}</code></p>
      <p><b>📅 Истекает:</b> ${expireDate}</p>
      <textarea readonly onclick="this.select()" style="width:100%; height:55px; font-size:13px;">
https://api-u3vwde53ja-uc.a.run.app/vipRepo.json?token=${token}
      </textarea>`;
  } else {
    tokenOutput.innerHTML = '';
  }

  form.reset();
  vipSettings.style.display = 'none';
  loadApps();
});

function loadApps() {
  const repo = repoSelect.value;
  const appsPath = `${repo}/apps`;

  db.ref(appsPath).once('value', (snapshot) => {
    output.innerHTML = `<h2>📱 ${repo === 'vipApps' ? 'VIP' : 'Обычные'} приложения</h2>`;
    output.innerHTML += `<p><small>Путь: ${appsPath}</small></p><hr>`;
    snapshot.forEach(child => {
      const app = child.val();
      const appDiv = document.createElement('div');
      appDiv.className = 'appCard';
      appDiv.innerHTML = `
        <img src="${app.iconURL}" width="48" height="48">
        <strong>${app.name}</strong> (${app.version})<br>
        <small>${app.bundleID}</small><br>
        <button class="editBtn">✏️ Редактировать</button>
        <button class="deleteBtn">🗑️ Удалить</button>
      `;
      output.appendChild(appDiv);

      appDiv.querySelector('.editBtn').onclick = () => {
        form.name.value = app.name;
        form.bundleID.value = app.bundleID;
        form.version.value = app.version;
        form.size.value = app.size;
        form.downloadURL.value = app.downloadURL;
        form.iconURL.value = app.iconURL;
        form.description.value = app.localizedDescription;
        editKey = child.key;
      };

      appDiv.querySelector('.deleteBtn').onclick = () => {
        db.ref(`${repo}/apps/${child.key}`).remove().then(() => loadApps());
      };
    });
  });
}

loadApps();
