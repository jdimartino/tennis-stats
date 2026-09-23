// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================

// TODO: Reemplazar con tus credenciales de Firebase
// Obtén estas credenciales desde Firebase Console:
// 1. Ve a https://console.firebase.google.com/
// 2. Selecciona tu proyecto o crea uno nuevo
// 3. Ve a Project Settings > General
// 4. En "Your apps", selecciona Web app o crea una
// 5. Copia la configuración y pégala aquí

const firebaseConfig = {
  apiKey: "AIzaSyAvU8uKaivoZH_401zpXyM5-OOGgi5OGcw",
  authDomain: "torneos-tenis-jdm.firebaseapp.com",
  projectId: "torneos-tenis-jdm",
  storageBucket: "torneos-tenis-jdm.firebasestorage.app",
  messagingSenderId: "951550758841",
  appId: "1:951550758841:web:b4baab45dde503d0717068"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Configuración de Firestore para persistencia offline
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistencia no disponible: múltiples pestañas abiertas');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistencia no disponible en este navegador');
    }
  });

// Exportar para uso global
window.auth = auth;
window.db = db;
