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
  apiKey: "AIzaSyCz_yKIVfV1NqnNPO4wM7h52C9vmnjVoXk",
  authDomain: "tennis-stats-6b669.firebaseapp.com",
  projectId: "tennis-stats-6b669",
  storageBucket: "tennis-stats-6b669.firebasestorage.app",
  messagingSenderId: "503407429192",
  appId: "1:503407429192:web:c350748b6fcb25cc3a3a7d"
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
