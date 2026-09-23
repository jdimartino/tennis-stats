# 🎾 Tennis Stats - Aplicación de Estadísticas de Tenis Dobles

Aplicación web móvil para llevar estadísticas de partidos de tenis dobles, con panel de administración, gestión de jugadores, registro de resultados y ranking por efectividad.

## 🚀 Características

- ✅ **Dashboard público** con resultados recientes y ranking de jugadores
- ✅ **Panel de administración** protegido con autenticación
- ✅ **Gestión de jugadores** (agregar, listar, eliminar)
- ✅ **Registro de partidos** con formatos flexibles:
  - 1 set a 4 juegos
  - 2 sets (mejor de 2)
  - 2 sets + super tie-break
- ✅ **Estadísticas detalladas** por jugador (parejas, rivales, efectividad)
- ✅ **Ranking automático** ordenado por efectividad (% de victorias)
- ✅ **Diseño mobile-first** optimizado para celular
- ✅ **PWA** (Progressive Web App) - se puede instalar en el celular

## 📋 Requisitos Previos

1. Una cuenta de Google (para crear proyecto de Firebase)
2. Navegador web moderno (Chrome, Firefox, Safari, Edge)

## 🔧 Instalación y Configuración

### Paso 1: Crear Proyecto de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Nombra tu proyecto (ej: "tennis-stats")
4. Acepta los términos y crea el proyecto

### Paso 2: Configurar Firebase Authentication

1. En tu proyecto de Firebase, ve a **Authentication** en el menú lateral
2. Haz clic en "Comenzar"
3. Habilita el método de inicio de sesión **Email/Password**
4. Ve a la pestaña "Users"
5. Haz clic en "Add user" y crea tu cuenta de administrador:
   - Email: `tu-email@example.com`
   - Password: `tu-contraseña-segura`

### Paso 3: Configurar Firestore Database

1. En tu proyecto de Firebase, ve a **Firestore Database** en el menú lateral
2. Haz clic en "Crear base de datos"
3. Selecciona **"Modo de producción"**
4. Elige la ubicación más cercana (ej: `southamerica-east1` para Chile/Argentina)
5. Haz clic en "Habilitar"

### Paso 4: Configurar Reglas de Seguridad de Firestore

1. Ve a la pestaña **"Reglas"** en Firestore
2. Reemplaza las reglas con las siguientes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura pública de jugadores y partidos
    match /statsPlayers/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /statsMatches/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Haz clic en "Publicar"

### Paso 5: Obtener Credenciales de Firebase

1. En Firebase Console, haz clic en el ícono de configuración ⚙️ (arriba a la izquierda)
2. Selecciona "Configuración del proyecto"
3. Desplázate hasta "Tus aplicaciones"
4. Haz clic en el ícono `</>` (Web)
5. Registra tu app con un nombre (ej: "Tennis Stats Web")
6. **NO** marques "Firebase Hosting" por ahora
7. Copia las credenciales que aparecen

### Paso 6: Configurar las Credenciales en la App

1. Abre el archivo `js/firebase-config.js`
2. Reemplaza las credenciales de ejemplo con las tuyas:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Paso 7: Probar Localmente

1. Instala un servidor HTTP local. Opción 1 (Python):
   ```bash
   cd tennis-stats
   python3 -m http.server 8000
   ```
   
   Opción 2 (Node.js):
   ```bash
   npx http-server -p 8000
   ```

2. Abre tu navegador en `http://localhost:8000`

3. Verifica que funcione:
   - La página principal debe cargar (vacía por ahora)
   - Ve a `http://localhost:8000/admin.html`
   - Inicia sesión con las credenciales de administrador que creaste
   - Agrega algunos jugadores
   - Registra un partido
   - Verifica que aparezca en el dashboard público

### Paso 8: Desplegar en Firebase Hosting (GRATIS)

1. Instala Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Inicia sesión en Firebase:
   ```bash
   firebase login
   ```

3. Inicializa Firebase Hosting desde la carpeta del proyecto:
   ```bash
   cd tennis-stats
   firebase init hosting
   ```
   
   Responde:
   - **Project**: Selecciona tu proyecto de Firebase
   - **Public directory**: presiona Enter (usa `public` por defecto o escribe `.` para usar la carpeta actual)
   - **Configure as single-page app**: `No`
   - **Set up automatic builds**: `No`
   - **Overwrite index.html**: `No`

4. Si elegiste `public` como directorio, mueve todos los archivos a una carpeta `public`:
   ```bash
   mkdir -p public
   mv *.html *.json css js public/
   ```
   
   Si elegiste `.` (carpeta actual), salta este paso.

5. Despliega tu aplicación:
   ```bash
   firebase deploy
   ```

6. Firebase te dará una URL como: `https://tu-proyecto.web.app`

¡Listo! Tu aplicación ya está en línea y disponible desde cualquier dispositivo.

## 📱 Instalar como PWA en el Celular

### En Android (Chrome):
1. Abre la URL de tu app en Chrome
2. Toca el menú (⋮) y selecciona "Agregar a pantalla de inicio"
3. Confirma el nombre y toca "Agregar"

### En iOS (Safari):
1. Abre la URL de tu app en Safari
2. Toca el botón de compartir (□↑)
3. Selecciona "Agregar a pantalla de inicio"
4. Confirma el nombre y toca "Agregar"

## 🎮 Uso de la Aplicación

### Dashboard Público (`index.html`)
- Ver ranking de jugadores ordenados por efectividad
- Ver resultados de partidos recientes
- Accesible para todos sin autenticación

### Panel de Administración (`admin.html`)

#### Gestión de Jugadores
1. Ve a la sección "Jugadores"
2. Ingresa nombre y apellido
3. Haz clic en "Agregar Jugador"
4. Los jugadores aparecerán en la lista
5. Puedes eliminar jugadores con el botón 🗑️

#### Registrar Partido
1. Ve a la sección "Registrar Partido"
2. Selecciona el formato de partido:
   - **1 Set a 4 juegos**: Para partidos rápidos
   - **2 Sets**: Mejor de 2 sets
   - **2 Sets + Super Tie-break**: Si hay empate 1-1, se juega super tie-break
3. Selecciona los 4 jugadores (2 por equipo)
4. Ingresa los resultados de cada set
5. Si seleccionaste "Super Tie-break" y hubo empate 1-1, llena el resultado del super tie-break
6. Haz clic en "Registrar Partido"
7. El ganador se calcula automáticamente

#### Ver Estadísticas
1. Ve a la sección "Estadísticas"
2. Selecciona un jugador del menú desplegable
3. Verás:
   - Partidos jugados, victorias, derrotas
   - Porcentaje de efectividad
   - Parejas con las que ha jugado (y su récord juntos)
   - Rivales enfrentados (y su récord contra ellos)

## 🔒 Seguridad

- Solo usuarios autenticados pueden:
  - Agregar/eliminar jugadores
  - Registrar partidos
  - Ver el panel de administración
- El dashboard público es accesible para todos
- Las credenciales de Firebase deben mantenerse en el archivo `firebase-config.js`
- Recuerda crear contraseñas seguras para las cuentas de administrador

## 💡 Tips

- **Backup**: Firebase hace backup automático de tus datos
- **Límites gratuitos de Firebase**:
  - Firestore: 1GB de almacenamiento, 50K lecturas/día, 20K escrituras/día
  - Hosting: 10GB de transferencia/mes
  - Auth: Ilimitado para email/password
- **Agregar más administradores**: Ve a Firebase Console > Authentication > Users > Add user
- **Ver datos**: Puedes ver todos los datos en Firebase Console > Firestore Database

## 🐛 Solución de Problemas

### No puedo iniciar sesión
- Verifica que creaste el usuario en Firebase Authentication
- Verifica que el email y contraseña sean correctos
- Abre la consola del navegador (F12) para ver errores

### Los datos no se cargan
- Verifica que las credenciales en `firebase-config.js` sean correctas
- Verifica que las reglas de Firestore estén configuradas correctamente
- Abre la consola del navegador (F12) para ver errores

### La app no se ve bien en el celular
- Asegúrate de que estés accediendo por HTTPS (Firebase Hosting usa HTTPS automáticamente)
- Prueba limpiar el caché del navegador

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal o comercial.

## 👨‍💻 Soporte

Si tienes problemas o preguntas, revisa:
1. La consola del navegador (F12 > Console)
2. Firebase Console > Firestore Database (para ver los datos)
3. Firebase Console > Authentication (para ver usuarios)

---

¡Disfruta llevando las estadísticas de tus partidos de tenis! 🎾🏆
