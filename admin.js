import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBRmKbekcv6OW8oaMsHPlc8WvfIWnyFAI0",
  authDomain: "appgamesrepo.firebaseapp.com",
  databaseURL: "https://appgamesrepo-default-rtdb.firebaseio.com",
  projectId: "appgamesrepo",
  storageBucket: "appgamesrepo.firebasestorage.app",
  messagingSenderId: "220298514248",
  appId: "1:220298514248:web:f3193a6042d3e1a67a6d7d",
  measurementId: "G-0YVBYHKG2D"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const appsRef = ref(db, "apps");

// DOM
const appList = document.createElement("div");
appList.style.marginTop = "40px";
document.body.appendChild(appList);

// Отображение
onValue(appsRef, (snapshot) => {
  appList.innerHTML = "";
  const apps = snapshot.val();
  if (apps) {
    Object.keys(apps).forEach((key) => {
      const app = apps[key];

      const card = document.createElement("div");
      card.style.border = "1px solid #333";
      card.style.borderRadius = "8px";
      card.style.padding = "12px";
      card.style.marginBottom = "12px";
      card.style.backgroundColor = "#111";
      card.style.color = "#fff";

      card.innerHTML = `
        <strong>${app.name}</strong><br>
        <small>${app.version}</small><br>
        <img src="${app.iconURL}" style="width:50px;height:50px;border-radius:10px;margin-top:8px;"><br>
        <button style="margin-top:10px;background:red;color:#fff;border:none;padding:6px 10px;border-radius:5px;cursor:pointer;" data-key="${key}">Удалить</button>
      `;

      const deleteBtn = card.querySelector("button");
      deleteBtn.addEventListener("click", () => {
        const appRef = ref(db, `apps/${key}`);
        remove(appRef).then(() => alert("Удалено!"));
      });

      appList.appendChild(card);
    });
  }
});
