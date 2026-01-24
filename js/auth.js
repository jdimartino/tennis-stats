// ============================================
// GESTIÓN DE AUTENTICACIÓN
// ============================================

/**
 * Verifica si el usuario está autenticado
 * Si no está autenticado, redirige al login
 */
function verificarAutenticacion() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                resolve(user);
            } else {
                // Redirigir al login si no está autenticado
                if (window.location.pathname.includes('admin.html')) {
                    mostrarLogin();
                    reject(new Error('No autenticado'));
                }
            }
        });
    });
}

/**
 * Inicia sesión con email y contraseña
 */
async function iniciarSesion(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        throw error;
    }
}

/**
 * Cierra la sesión actual
 */
async function cerrarSesion() {
    try {
        await auth.signOut();
        mostrarLogin();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        throw error;
    }
}

/**
 * Obtiene el usuario actual
 */
function obtenerUsuarioActual() {
    return auth.currentUser;
}

/**
 * Muestra la pantalla de login
 */
function mostrarLogin() {
    const appContent = document.getElementById('app-content');
    const loginSection = document.getElementById('login-section');

    if (appContent) appContent.classList.add('hidden');
    if (loginSection) loginSection.classList.remove('hidden');
}

/**
 * Muestra el contenido de la aplicación
 */
function mostrarApp() {
    const appContent = document.getElementById('app-content');
    const loginSection = document.getElementById('login-section');

    if (loginSection) loginSection.classList.add('hidden');
    if (appContent) appContent.classList.remove('hidden');
}

// Exportar funciones para uso global
window.verificarAutenticacion = verificarAutenticacion;
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.mostrarLogin = mostrarLogin;
window.mostrarApp = mostrarApp;
