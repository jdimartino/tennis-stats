// ============================================
// PANEL DE ADMINISTRACIÓN - ADMIN.JS
// Gestión de jugadores, partidos, edición y estadísticas
// ============================================

// ============================================

console.log("Admin JS v1.3 loaded");

let jugadoresAdmin = {};
let clubesAdmin = {};
let partidosAdmin = [];
let seccionActual = 'jugadores';

/**
 * Inicializa el panel de administración
 */
async function inicializarAdmin() {
    try {
        // Verificar autenticación
        await verificarAutenticacion();

        // Mostrar contenido de la app
        mostrarApp();

        // Configurar navegación
        configurarNavegacion();

        // Cargar jugadores y clubes
        await Promise.all([
            cargarJugadoresAdmin(),
            cargarClubesAdmin()
        ]);

        // Mostrar sección de jugadores por defecto
        mostrarSeccion('jugadores');

        // Configurar listeners de formularios
        configurarFormularios();

    } catch (error) {
        console.error('Error al inicializar admin:', error);
        mostrarLogin();
    }
}

/**
 * Configura la navegación entre secciones
 */
function configurarNavegacion() {
    const navButtons = document.querySelectorAll('[data-seccion]');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const seccion = btn.getAttribute('data-seccion');
            mostrarSeccion(seccion);

            // Actualizar estado activo de botones
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

/**
 * Muestra una sección específica
 */
function mostrarSeccion(nombreSeccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar la sección seleccionada
    const seccion = document.getElementById(`${nombreSeccion}-section`);
    if (seccion) {
        seccion.classList.add('active');
    }

    seccionActual = nombreSeccion;

    // Cargar datos según la sección
    if (nombreSeccion === 'partidos') {
        cargarSelectoresJugadores();
        // Resetear fecha a hoy si es nuevo registro
        if (!document.getElementById('edit-match-id').value) {
            document.getElementById('partido-fecha').valueAsDate = new Date();
        }
    } else if (nombreSeccion === 'gestion') {
        cargarHistorialGestion();
    } else if (nombreSeccion === 'estadisticas') {
        cargarSelectorEstadisticas();
    } else if (nombreSeccion === 'clubes') {
        mostrarClubesGestion();
    }
}

// ============================================
// GESTIÓN DE JUGADORES
// ============================================

/**
 * Carga todos los jugadores desde Firestore
 */
async function cargarJugadoresAdmin() {
    try {
        const snapshot = await db.collection('players').orderBy('apellido').get();
        jugadoresAdmin = {};

        snapshot.forEach((doc) => {
            jugadoresAdmin[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });

        mostrarJugadores();
    } catch (error) {
        console.error('Error al cargar jugadores:', error);
    }
}

/**
 * Muestra la lista de jugadores
 */
function mostrarJugadores() {
    const container = document.getElementById('jugadores-lista');

    if (!container) return;

    const jugadoresArray = Object.values(jugadoresAdmin);

    if (jugadoresArray.length === 0) {
        container.innerHTML = `<div class="p-4 text-center">No hay jugadores registrados.</div>`;
        return;
    }

    // Ordenar por Club (A-Z) y luego por Nombre (A-Z)
    jugadoresArray.sort((a, b) => {
        const clubA = clubesAdmin[a.clubId]?.nombre || 'ZZZ'; // Peculiaridad para que 'Sin Club' vaya al final si se desea, o 'Sin Club' literal
        const clubB = clubesAdmin[b.clubId]?.nombre || 'ZZZ';

        const clubSort = clubA.localeCompare(clubB);
        if (clubSort !== 0) return clubSort;

        const nameA = `${a.nombre} ${a.apellido}`;
        const nameB = `${b.nombre} ${b.apellido}`;
        return nameA.localeCompare(nameB);
    });

    container.innerHTML = `
    <div class="player-list">
      ${jugadoresArray.map(jugador => {
        const clubNombre = clubesAdmin[jugador.clubId]?.nombre || 'Sin Club';
        return `
        <div class="player-item">
          <div class="player-info">
              <div style="font-weight: 800; font-size: 1.25rem; color: #fff; line-height: 1.2;">${jugador.nombre} ${jugador.apellido}</div>
              <small style="color: var(--color-text-muted); font-size: 0.9rem; font-weight: 500;">
                ${jugador.categoria || 'Sin Cat.'} • ${clubNombre}
              </small>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-action btn-action-edit" onclick="prepararEdicionJugador('${jugador.id}')" title="Editar">✏️</button>
            <button class="btn btn-action btn-action-danger" onclick="eliminarJugador('${jugador.id}')" title="Borrar">🗑️</button>
          </div>
        </div>
      `}).join('')}
    </div>`;
}

/**
 * Agrega o actualiza un jugador
 */
async function guardarJugador(nombre, apellido, categoria, clubId) {
    const editId = document.getElementById('edit-jugador-id').value;
    const playerData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        categoria: categoria,
        clubId: clubId,
    };

    try {
        if (editId) {
            await db.collection('players').doc(editId).update(playerData);
            mostrarAlerta('Jugador actualizado exitosamente');
        } else {
            await db.collection('players').add({
                ...playerData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            mostrarAlerta('Jugador agregado exitosamente');
        }
        await cargarJugadoresAdmin();
        resetFormJugador();

    } catch (error) {
        console.error('Error al guardar jugador:', error);
        mostrarAlerta('Error al guardar jugador', 'error');
    }
}

/**
 * Prepara el formulario para editar un jugador
 */
async function prepararEdicionJugador(id) {
    try {
        const doc = await db.collection('players').doc(id).get();
        const data = doc.data();

        document.getElementById('edit-jugador-id').value = id;
        document.getElementById('jugador-nombre').value = data.nombre;
        document.getElementById('jugador-apellido').value = data.apellido;
        document.getElementById('jugador-categoria').value = data.categoria || "";
        document.getElementById('jugador-club').value = data.clubId || "";

        // Cambiar UI
        document.getElementById('form-jugador-titulo').innerText = "✏️ Editar Jugador";
        document.getElementById('btn-submit-jugador').innerText = "💾 Guardar Cambios";
        document.getElementById('btn-cancel-edit-jugador').classList.remove('hidden');

        // Scroll al formulario
        document.querySelector('#form-jugador').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error al preparar edición:', error);
        mostrarAlerta('Error al cargar datos', 'error');
    }
}

/**
 * Resetea el formulario de jugador
 */
function resetFormJugador() {
    document.getElementById('form-jugador').reset();
    document.getElementById('edit-jugador-id').value = "";
    document.getElementById('form-jugador-titulo').innerText = "Registrar Nuevo Jugador";
    document.getElementById('btn-submit-jugador').innerText = "👤 Agregar Jugador";
    document.getElementById('btn-cancel-edit-jugador').classList.add('hidden');
}

/**
 * Elimina un jugador
 */
async function eliminarJugador(jugadorId) {
    if (!confirm('¿Seguro que quieres eliminar este jugador?')) {
        return;
    }

    try {
        await db.collection('players').doc(jugadorId).delete();
        await cargarJugadoresAdmin();
        mostrarAlerta('Jugador eliminado');
    } catch (error) {
        console.error('Error al eliminar jugador:', error);
        mostrarAlerta('Error al eliminar', 'error');
    }
}

// ============================================
// GESTIÓN DE CLUBES
// ============================================

/**
 * Carga todos los clubes desde Firestore
 */
async function cargarClubesAdmin() {
    try {
        const snapshot = await db.collection('clubs').orderBy('nombre').get();
        clubesAdmin = {};

        snapshot.forEach((doc) => {
            clubesAdmin[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });

        cargarSelectoresClubes(); // Actualizar dropdown en formulario jugador
    } catch (error) {
        console.error('Error al cargar clubes:', error);
    }
}

/**
 * Muestra la lista de clubes en la sección de gestión
 */
function mostrarClubesGestion() {
    const container = document.getElementById('clubes-lista');
    if (!container) return;

    const clubesArray = Object.values(clubesAdmin).sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (clubesArray.length === 0) {
        container.innerHTML = `<div class="p-4 text-center">No hay clubes registrados.</div>`;
        return;
    }

    container.innerHTML = `
    <div class="club-list">
      ${clubesArray.map(club => `
        <div class="club-item">
          <span class="player-info">🏢 ${club.nombre}</span>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-action btn-action-danger" onclick="eliminarClub('${club.id}')" title="Borrar">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>`;
}

/**
 * Carga los clubes en el selector del formulario de jugador
 */
function cargarSelectoresClubes() {
    const select = document.getElementById('jugador-club');
    if (!select) return;

    const clubesArray = Object.values(clubesAdmin).sort((a, b) => a.nombre.localeCompare(b.nombre));

    select.innerHTML = `<option value="">Seleccionar...</option>` +
        clubesArray.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

/**
 * Agrega un nuevo club
 */
async function agregarClub(nombre) {
    try {
        await db.collection('clubs').add({
            nombre: nombre.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await cargarClubesAdmin();
        mostrarClubesGestion();
        mostrarAlerta('Club agregado exitosamente');
        document.getElementById('form-club').reset();
    } catch (error) {
        console.error('Error al agregar club:', error);
        mostrarAlerta('Error al agregar club: ' + error.message, 'error');
    }
}

/**
 * Elimina un club
 */
async function eliminarClub(clubId) {
    if (!confirm('¿Seguro que quieres eliminar este club?')) return;

    try {
        await db.collection('clubs').doc(clubId).delete();
        await cargarClubesAdmin();
        mostrarClubesGestion();
        mostrarAlerta('Club eliminado');
    } catch (error) {
        console.error('Error al eliminar club:', error);
        mostrarAlerta('Error al eliminar', 'error');
    }
}

// ============================================
// GESTIÓN DE PARTIDOS
// ============================================

/**
 * Carga los selectores de jugadores para el registro de partidos
 */
function cargarSelectoresJugadores() {
    const ids = ['equipo1-jugador1', 'equipo1-jugador2', 'equipo2-jugador1', 'equipo2-jugador2'];
    const jugadoresArray = Object.values(jugadoresAdmin).sort((a, b) => a.apellido.localeCompare(b.apellido));
    const opciones = `<option value="">Seleccionar...</option>` + jugadoresArray.map(j => `<option value="${j.id}">${j.nombre} ${j.apellido}</option>`).join('');

    ids.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.innerHTML = opciones;
    });
}

/**
 * Carga el historial de partidos para gestionar (editar/eliminar)
 */
async function cargarHistorialGestion() {
    const container = document.getElementById('gestion-partidos-lista');
    container.innerHTML = '<div class="text-center p-4">Cargando...</div>';

    try {
        const snapshot = await db.collection('matches').orderBy('fecha', 'desc').limit(20).get();
        const partidos = [];
        snapshot.forEach(doc => partidos.push({ id: doc.id, ...doc.data() }));

        if (partidos.length === 0) {
            container.innerHTML = '<div class="text-center p-4">No hay partidos registrados.</div>';
            return;
        }

        container.innerHTML = partidos.map(p => {
            const fecha = p.fecha?.toDate ? p.fecha.toDate().toLocaleDateString() : 'Sin fecha';
            const j1 = jugadoresAdmin[p.equipo1.jugador1Id] ? `${jugadoresAdmin[p.equipo1.jugador1Id].nombre} ${jugadoresAdmin[p.equipo1.jugador1Id].apellido}` : 'Jugador 1';
            const j2 = jugadoresAdmin[p.equipo1.jugador2Id] ? `${jugadoresAdmin[p.equipo1.jugador2Id].nombre} ${jugadoresAdmin[p.equipo1.jugador2Id].apellido}` : 'Jugador 2';
            const j3 = jugadoresAdmin[p.equipo2.jugador1Id] ? `${jugadoresAdmin[p.equipo2.jugador1Id].nombre} ${jugadoresAdmin[p.equipo2.jugador1Id].apellido}` : 'Jugador 3';
            const j4 = jugadoresAdmin[p.equipo2.jugador2Id] ? `${jugadoresAdmin[p.equipo2.jugador2Id].nombre} ${jugadoresAdmin[p.equipo2.jugador2Id].apellido}` : 'Jugador 4';

            const setsStr = p.sets.map(s => `${s.equipo1}-${s.equipo2}`).join(' / ');
            const ganadorColor = p.ganador === 'equipo1' ? '#2ECC71' : '#EF4444';

            return `
                <div class="match-card" style="margin-bottom: 1rem; border: 1px solid var(--color-border);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">📅 ${fecha}</span>
                        <span style="font-size: 0.8rem; font-weight: 800; color: ${ganadorColor}; text-transform: uppercase;">GANA ${p.ganador === 'equipo1' ? 'E1' : 'E2'}</span>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span style="font-size: 0.95rem;">${j1} / ${j2}</span>
                            <span style="font-weight: 800; color: #2ECC71;">${p.ganador === 'equipo1' ? '✓' : ''}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-size: 0.95rem;">${j3} / ${j4}</span>
                            <span style="font-weight: 800; color: #EF4444;">${p.ganador === 'equipo2' ? '✓' : ''}</span>
                        </div>
                    </div>
                    <div style="font-weight: 800; text-align: center; margin: 1rem 0; font-size: 1.1rem; letter-spacing: 0.1em; color: var(--color-primary); background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: var(--radius-sm);">${setsStr}</div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-action btn-action-edit" style="flex: 1;" onclick="prepararEdicionMatch('${p.id}')">✏️ EDITAR</button>
                        <button class="btn btn-action btn-action-danger" style="flex: 1;" onclick="eliminarMatch('${p.id}')">🗑️ BORRAR</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="text-center p-4">Error al cargar historial.</div>';
    }
}

/**
 * Carga los datos de un partido en el formulario de registro para editarlo
 */
async function prepararEdicionMatch(id) {
    try {
        const doc = await db.collection('matches').doc(id).get();
        const data = doc.data();

        mostrarSeccion('partidos');

        // Cambiar títulos y visibilidad
        document.getElementById('form-partido-titulo').innerText = "✏️ Modificar Partido";
        document.getElementById('btn-submit-partido').innerText = "💾 Guardar Cambios";
        document.getElementById('btn-cancel-edit').classList.remove('hidden');
        document.getElementById('edit-match-id').value = id;

        // Poblar jugadores (asegurar que selectores estén cargados)
        cargarSelectoresJugadores();
        document.getElementById('equipo1-jugador1').value = data.equipo1.jugador1Id;
        document.getElementById('equipo1-jugador2').value = data.equipo1.jugador2Id;
        document.getElementById('equipo2-jugador1').value = data.equipo2.jugador1Id;
        document.getElementById('equipo2-jugador2').value = data.equipo2.jugador2Id;

        // Fecha
        if (data.fecha) {
            const f = data.fecha.toDate ? data.fecha.toDate() : new Date();
            document.getElementById('partido-fecha').value = f.toISOString().split('T')[0];
        }

        // Sets (limpiar primero)
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`set${i}-equipo1`).value = "";
            document.getElementById(`set${i}-equipo2`).value = "";
        }

        data.sets.forEach((s, i) => {
            const idx = i + 1;
            document.getElementById(`set${idx}-equipo1`).value = s.equipo1;
            document.getElementById(`set${idx}-equipo2`).value = s.equipo2;
        });

    } catch (error) {
        mostrarAlerta('Error al cargar datos del partido', 'error');
    }
}

async function eliminarMatch(id) {
    if (!id) return;
    if (!confirm('¿Borrar este partido del historial?')) return;
    try {
        console.log('Intentando eliminar partido:', id);
        await db.collection('matches').doc(id).delete();
        mostrarAlerta('Partido eliminado correctamente');
        cargarHistorialGestion();
    } catch (error) {
        console.error('Error al borrar partido de Firestore:', error);
        mostrarAlerta('Error al borrar: ' + error.message, 'error');
    }
}

/**
 * Calcula el ganador del partido automáticamente según los sets jugados
 * @param {Array} sets - Array de sets con scores de equipo1 y equipo2
 * @returns {string} - 'equipo1' o 'equipo2'
 */
function calcularGanadorAutomatico(sets) {
    let sets1 = 0;
    let sets2 = 0;

    // Contar sets ganados por cada equipo
    sets.forEach(set => {
        if (set.equipo1 > set.equipo2) {
            sets1++;
        } else if (set.equipo2 > set.equipo1) {
            sets2++;
        }
        // Si hay empate en un set, no se cuenta para ninguno
    });

    // El equipo que ganó más sets es el ganador
    return sets1 > sets2 ? 'equipo1' : 'equipo2';
}

function resetFormPartido() {
    document.getElementById('form-partido').reset();
    document.getElementById('edit-match-id').value = "";
    document.getElementById('form-partido-titulo').innerText = "Registrar Nuevo Partido";
    document.getElementById('btn-submit-partido').innerText = "✅ Registrar Partido";
    document.getElementById('btn-cancel-edit').classList.add('hidden');
    document.getElementById('partido-fecha').valueAsDate = new Date();
}

// ============================================
// ESTADÍSTICAS POR JUGADOR
// ============================================

/**
 * Carga el selector de jugadores para estadísticas
 */
function cargarSelectorEstadisticas() {
    const selector = document.getElementById('jugador-stats-select');

    if (!selector) return;

    const jugadoresArray = Object.values(jugadoresAdmin).sort((a, b) =>
        a.apellido.localeCompare(b.apellido)
    );

    selector.innerHTML = `
    <option value="">Seleccionar jugador...</option>
    ${jugadoresArray.map(j =>
        `<option value="${j.id}">${j.nombre} ${j.apellido}</option>`
    ).join('')}
  `;
}

/**
 * Muestra las estadísticas de un jugador específico
 */
async function mostrarEstadisticasJugador(jugadorId) {
    if (!jugadorId) {
        document.getElementById('stats-display').innerHTML = '';
        return;
    }

    try {
        // Cargar todos los partidos del jugador
        const partidos = await cargarPartidosJugador(jugadorId);

        if (partidos.length === 0) {
            document.getElementById('stats-display').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">No hay estadísticas disponibles</div>
          <p>Este jugador no ha participado en ningún partido.</p>
        </div>
      `;
            return;
        }

        // Calcular estadísticas
        const stats = calcularEstadisticasDetalladas(jugadorId, partidos);

        // Mostrar estadísticas
        mostrarStatsDetalladas(stats);

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        mostrarAlerta('Error al cargar estadísticas', 'error');
    }
}

/**
 * Carga todos los partidos de un jugador
 */
async function cargarPartidosJugador(jugadorId) {
    const partidos = [];

    const snapshot = await db.collection('matches').get();

    snapshot.forEach(doc => {
        const partido = doc.data();
        const jugadoresPartido = [
            partido.equipo1?.jugador1Id,
            partido.equipo1?.jugador2Id,
            partido.equipo2?.jugador1Id,
            partido.equipo2?.jugador2Id
        ];

        if (jugadoresPartido.includes(jugadorId)) {
            partidos.push({
                id: doc.id,
                ...partido
            });
        }
    });

    return partidos;
}

/**
 * Calcula estadísticas detalladas de un jugador
 */
function calcularEstadisticasDetalladas(jugadorId, partidos) {
    const stats = {
        partidos: partidos.length,
        victorias: 0,
        derrotas: 0,
        efectividad: 0,
        parejas: {},
        rivales: {}
    };

    partidos.forEach(partido => {
        let esEquipo1 = false;
        let pareja = null;
        let rivales = [];

        // Determinar en qué equipo jugó
        if (partido.equipo1.jugador1Id === jugadorId) {
            esEquipo1 = true;
            pareja = partido.equipo1.jugador2Id;
            rivales = [partido.equipo2.jugador1Id, partido.equipo2.jugador2Id];
        } else if (partido.equipo1.jugador2Id === jugadorId) {
            esEquipo1 = true;
            pareja = partido.equipo1.jugador1Id;
            rivales = [partido.equipo2.jugador1Id, partido.equipo2.jugador2Id];
        } else if (partido.equipo2.jugador1Id === jugadorId) {
            esEquipo1 = false;
            pareja = partido.equipo2.jugador2Id;
            rivales = [partido.equipo1.jugador1Id, partido.equipo1.jugador2Id];
        } else if (partido.equipo2.jugador2Id === jugadorId) {
            esEquipo1 = false;
            pareja = partido.equipo2.jugador1Id;
            rivales = [partido.equipo1.jugador1Id, partido.equipo1.jugador2Id];
        }

        // Determinar si ganó
        const gano = (esEquipo1 && partido.ganador === 'equipo1') ||
            (!esEquipo1 && partido.ganador === 'equipo2');

        if (gano) {
            stats.victorias++;
        } else {
            stats.derrotas++;
        }

        // Contar parejas
        if (pareja) {
            if (!stats.parejas[pareja]) {
                stats.parejas[pareja] = { partidos: 0, victorias: 0 };
            }
            stats.parejas[pareja].partidos++;
            if (gano) stats.parejas[pareja].victorias++;
        }

        // Contar rivales
        rivales.forEach(rivalId => {
            if (!stats.rivales[rivalId]) {
                stats.rivales[rivalId] = { partidos: 0, victorias: 0 };
            }
            stats.rivales[rivalId].partidos++;
            if (gano) stats.rivales[rivalId].victorias++;
        });
    });

    // Calcular efectividad
    if (stats.partidos > 0) {
        stats.efectividad = (stats.victorias / stats.partidos) * 100;
    }

    return stats;
}

/**
 * Muestra las estadísticas detalladas en la interfaz
 */
function mostrarStatsDetalladas(stats) {
    const container = document.getElementById('stats-display');

    // Resumen general
    let html = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.partidos}</div>
        <div class="stat-label">Partidos Jugados</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.victorias}</div>
        <div class="stat-label">Ganados</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.derrotas}</div>
        <div class="stat-label">Perdidos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.efectividad.toFixed(1)}%</div>
        <div class="stat-label">Efectividad</div>
      </div>
    </div>
  `;

    // Parejas con las que jugó
    const parejasArray = Object.entries(stats.parejas)
        .sort((a, b) => b[1].partidos - a[1].partidos);

    if (parejasArray.length > 0) {
        html += `
      <div class="card mt-4">
        <div class="card-header">
          <h3 class="card-title">Parejas</h3>
        </div>
        <div class="card-body">
          ${parejasArray.map(([parejaId, datos]) => {
            const pareja = jugadoresAdmin[parejaId];
            if (!pareja) return '';
            const efect = (datos.victorias / datos.partidos) * 100;
            return `
              <div class="player-item mb-2">
                <div class="player-info">
                  ${pareja.nombre} ${pareja.apellido}
                  <br>
                  <small style="color: var(--color-text-muted);">
                    ${datos.partidos} partidos • ${datos.victorias}G-${datos.partidos - datos.victorias}P • ${efect.toFixed(1)}%
                  </small>
                </div>
              </div>
            `;
        }).join('')}
        </div>
      </div>
    `;
    }

    // Rivales enfrentados
    const rivalesArray = Object.entries(stats.rivales)
        .sort((a, b) => b[1].partidos - a[1].partidos)
        .slice(0, 10); // Top 10

    if (rivalesArray.length > 0) {
        html += `
      <div class="card mt-4">
        <div class="card-header">
          <h3 class="card-title">Rivales Enfrentados (Top 10)</h3>
        </div>
        <div class="card-body">
          ${rivalesArray.map(([rivalId, datos]) => {
            const rival = jugadoresAdmin[rivalId];
            if (!rival) return '';
            const efect = (datos.victorias / datos.partidos) * 100;
            return `
              <div class="player-item mb-2">
                <div class="player-info">
                  ${rival.nombre} ${rival.apellido}
                  <br>
                  <small style="color: var(--color-text-muted);">
                    ${datos.partidos} partidos • ${datos.victorias}G-${datos.partidos - datos.victorias}P • ${efect.toFixed(1)}%
                  </small>
                </div>
              </div>
            `;
        }).join('')}
        </div>
      </div>
    `;
    }

    container.innerHTML = html;
}

// ============================================
// CONFIGURACIÓN DE FORMULARIOS
// ============================================

/**
 * Configura los listeners de los formularios
 */
function configurarFormularios() {
    // Formulario Jugador
    document.getElementById('form-jugador')?.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarJugador(
            document.getElementById('jugador-nombre').value,
            document.getElementById('jugador-apellido').value,
            document.getElementById('jugador-categoria').value,
            document.getElementById('jugador-club').value
        );
    });

    document.getElementById('btn-cancel-edit-jugador')?.addEventListener('click', resetFormJugador);

    // Formulario Club
    document.getElementById('form-club')?.addEventListener('submit', (e) => {
        e.preventDefault();
        agregarClub(document.getElementById('club-nombre').value);
    });

    // Navegación Enter en scores
    const scoreInputs = document.querySelectorAll('.score-input');
    scoreInputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (index < scoreInputs.length - 1) {
                    scoreInputs[index + 1].focus();
                    scoreInputs[index + 1].select();
                }
            }
        });
        input.addEventListener('focus', (e) => e.target.select());
    });

    // Formulario Partido (Crear o Editar)
    document.getElementById('form-partido')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-match-id').value;
        const fechaVal = document.getElementById('partido-fecha').value;
        const fecha = fechaVal ? new Date(fechaVal + "T12:00:00") : new Date();

        const sets = [];
        for (let i = 1; i <= 3; i++) {
            const e1 = document.getElementById(`set${i}-equipo1`).value;
            const e2 = document.getElementById(`set${i}-equipo2`).value;
            if (e1 !== "" && e2 !== "") {
                sets.push({ equipo1: parseInt(e1), equipo2: parseInt(e2) });
            }
        }

        if (sets.length === 0) return mostrarAlerta('Debes ingresar al menos 1 set', 'error');

        const matchData = {
            equipo1: {
                jugador1Id: document.getElementById('equipo1-jugador1').value,
                jugador2Id: document.getElementById('equipo1-jugador2').value
            },
            equipo2: {
                jugador1Id: document.getElementById('equipo2-jugador1').value,
                jugador2Id: document.getElementById('equipo2-jugador2').value
            },
            sets: sets,
            ganador: calcularGanadorAutomatico(sets),
            fecha: firebase.firestore.Timestamp.fromDate(fecha)
        };

        try {
            if (editId) {
                await db.collection('matches').doc(editId).update(matchData);
                mostrarAlerta('Partido actualizado con éxito');
            } else {
                await db.collection('matches').add(matchData);
                mostrarAlerta('Partido registrado con éxito');
            }
            resetFormPartido();
            mostrarSeccion('gestion');
        } catch (error) {
            mostrarAlerta('Error al guardar partido', 'error');
        }
    });

    document.getElementById('btn-cancel-edit')?.addEventListener('click', resetFormPartido);

    // Selector de jugador para estadísticas
    const jugadorStatsSelect = document.getElementById('jugador-stats-select');
    if (jugadorStatsSelect) {
        jugadorStatsSelect.addEventListener('change', (e) => {
            mostrarEstadisticasJugador(e.target.value);
        });
    }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Muestra una alerta temporal
 */
function mostrarAlerta(mensaje, tipo = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.textContent = mensaje;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// Hacer funciones globales disponibles
window.eliminarJugador = eliminarJugador;
window.mostrarSeccion = mostrarSeccion;
window.prepararEdicionMatch = prepararEdicionMatch;
window.eliminarMatch = eliminarMatch;
window.eliminarClub = eliminarClub;
window.prepararEdicionJugador = prepararEdicionJugador;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Configurar botón de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }

    // Configurar formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                await iniciarSesion(email, password);
                await inicializarAdmin();
            } catch (error) {
                const errorMsg = document.getElementById('login-error');
                if (errorMsg) {
                    errorMsg.textContent = 'Email o contraseña incorrectos';
                    errorMsg.classList.remove('hidden');
                }
            }
        });
    }

    // Esperar a que Firebase esté listo e inicializar
    setTimeout(inicializarAdmin, 500);
});
