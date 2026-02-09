// ============================================
// DASHBOARD PÚBLICO - APP.JS
// Muestra resultados recientes y ranking de jugadores
// ============================================

let jugadores = {};
let partidos = [];
let leagueId = new URLSearchParams(window.location.search).get('equipo');
let clubTachiraId = null;

/**
 * Inicializa la aplicación
 */
async function inicializarApp() {
    try {
        if (!leagueId) {
            await mostrarSelectorDeEquipos();
            return;
        }

        // Obtener ID del Club Táchira para filtrar ranking
        await obtenerIdClubTachira();

        // Cargar jugadores (Filtrado por equipo)
        await cargarJugadores();

        // Cargar partidos recientes (Filtrado por equipo)
        await cargarPartidosRecientes();

        // Calcular y mostrar ranking
        mostrarRanking();

        // Actualizar UI con nombre del equipo
        actualizarTituloEquipo();

    } catch (error) {
        console.error('Error al inicializar app:', error);
        mostrarError('Error al cargar los datos. Por favor, recarga la página.');
    }
}

async function mostrarSelectorDeEquipos() {
    const main = document.querySelector('.main .container');
    main.innerHTML = '<div class="loading"><div class="spinner"></div><span>Cargando equipos...</span></div>';

    try {
        const snapshot = await db.collection('leagues').where('active', '==', true).get();
        if (snapshot.empty) {
            main.innerHTML = '<div class="alert alert-error">No hay equipos activos disponibles.</div>';
            return;
        }

        let html = `
            <div class="section-header" style="text-align: center; margin-bottom: 2rem;">
                <h2 class="section-title">Selecciona tu Equipo</h2>
            </div>
            <div class="league-grid">
        `;

        snapshot.forEach(doc => {
            const league = doc.data();
            html += `
                <a href="?equipo=${doc.id}" class="team-card">
                    <div class="team-card-content">
                        <div class="team-icon">🎾</div>
                        <h3 class="team-name">${league.nombre}</h3>
                    </div>
                    <div class="team-card-glow"></div>
                </a>
            `;
        });

        html += '</div>';
        main.innerHTML = html;

    } catch (error) {
        console.error(error);
        main.innerHTML = '<div class="alert alert-error">Error cargando equipos.</div>';
    }
}

/**
 * Obtiene el ID del Club Táchira para filtrar el ranking
 */
async function obtenerIdClubTachira() {
    try {
        const snapshot = await db.collection('clubs').where('nombre', '==', 'Club Táchira').get();
        if (!snapshot.empty) {
            clubTachiraId = snapshot.docs[0].id;
            console.log('Club Táchira ID:', clubTachiraId);
        }
    } catch (error) {
        console.error('Error al cargar Club Táchira:', error);
    }
}

async function actualizarTituloEquipo() {
    try {
        const doc = await db.collection('leagues').doc(leagueId).get();
        if (doc.exists) {
            const nombre = doc.data().nombre;
            document.title = `${nombre} - Tenis Tachira Stats`;
            const titulo = document.querySelector('.logo span');
            if (titulo) titulo.innerText = nombre; // Cambiar texto del logo

            // Update Admin link to include league context
            const adminLink = document.querySelector('header .btn-primary');
            if (adminLink && leagueId) {
                adminLink.href = `admin.html?equipo=${leagueId}`;
            }
        }
    } catch (e) { console.error(e); }
}

/**
 * Carga todos los jugadores desde Firestore
 */
async function cargarJugadores() {
    try {
        const snapshot = await db.collection('players').where('leagueId', '==', leagueId).get();
        jugadores = {};

        snapshot.forEach((doc) => {
            jugadores[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });

        console.log(`${Object.keys(jugadores).length} jugadores cargados`);
    } catch (error) {
        console.error('Error al cargar jugadores:', error);
        throw error;
    }
}

/**
 * Carga todos los partidos desde Firestore ordenados por fecha desc
 */
async function cargarPartidosRecientes() {
    try {
        const snapshot = await db.collection('matches')
            .where('leagueId', '==', leagueId)
            .orderBy('fecha', 'desc')
            .get();

        partidos = [];
        snapshot.forEach((doc) => {
            partidos.push({
                id: doc.id,
                ...doc.data()
            });
        });

        mostrarPartidos();
        console.log(`${partidos.length} partidos cargados`);
    } catch (error) {
        console.error('Error al cargar partidos:', error);
        throw error;
    }
}

/**
 * Muestra los partidos en la interfaz
 */
function mostrarPartidos() {
    const container = document.getElementById('partidos-container');

    if (!container) return;

    if (partidos.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎾</div>
        <div class="empty-state-text">No hay partidos registrados aún</div>
        <p>Los partidos aparecerán aquí una vez que se registren desde el panel de administración.</p>
      </div>
    `;
        return;
    }

    container.innerHTML = partidos.map(partido => {
        const equipo1 = obtenerNombresEquipo(partido.equipo1);
        const equipo2 = obtenerNombresEquipo(partido.equipo2);
        const fecha = formatearFecha(partido.fecha);
        const ganadorClase1 = partido.ganador === 'equipo1' ? 'winner' : '';
        const ganadorClase2 = partido.ganador === 'equipo2' ? 'winner' : '';

        return `
      <div class="match-card">
        <div class="match-date">📅 ${fecha}</div>
        <div class="match-teams">
          <div class="team ${ganadorClase1}">
            <div class="team-players">${equipo1}</div>
          </div>
          <span class="vs-separator">vs</span>
          <div class="team ${ganadorClase2}">
            <div class="team-players">${equipo2}</div>
          </div>
        </div>
        <div class="match-score">
          ${mostrarScore(partido)}
        </div>
      </div>
    `;
    }).join('');
}

/**
 * Obtiene los nombres de los jugadores de un equipo
 */
function obtenerNombresEquipo(equipo) {
    const jugador1 = jugadores[equipo.jugador1Id];
    const jugador2 = jugadores[equipo.jugador2Id];

    if (!jugador1 || !jugador2) return 'Jugadores desconocidos';

    return `${jugador1.nombre} ${jugador1.apellido} / ${jugador2.nombre} ${jugador2.apellido}`;
}

/**
 * Muestra el score del partido
 */
function mostrarScore(partido) {
    let html = '';

    // Mostrar sets
    if (partido.sets && partido.sets.length > 0) {
        partido.sets.forEach((set, index) => {
            html += `<span class="score-set">${set.equipo1}-${set.equipo2}</span>`;
        });
    }

    // Mostrar super tie-break si existe
    if (partido.supertiebreak) {
        html += `<span class="score-set">STB: ${partido.supertiebreak.equipo1}-${partido.supertiebreak.equipo2}</span>`;
    }

    return html || '<span class="score-set">Sin resultado</span>';
}

/**
 * Calcula estadísticas de cada jugador y muestra el ranking
 */
function mostrarRanking() {
    const rankingContainer = document.getElementById('ranking-container');

    if (!rankingContainer) return;

    // Calcular estadísticas de cada jugador
    const stats = calcularEstadisticas();

    // Filtrar solo jugadores de Club Táchira (si se encontró el ID)
    // Ordenar por efectividad (porcentaje de victorias)
    const ranking = Object.values(stats)
        .filter(p => !clubTachiraId || jugadores[p.id].clubId === clubTachiraId)
        .sort((a, b) => b.efectividad - a.efectividad);

    if (ranking.length === 0) {
        rankingContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏆</div>
        <div class="empty-state-text">No hay estadísticas disponibles</div>
        <p>El ranking aparecerá una vez que se registren partidos.</p>
      </div>
    `;
        return;
    }

    const tableHTML = `
    <table class="ranking-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Jugador</th>
          <th>PJ</th>
          <th>PG</th>
          <th>PP</th>
          <th>EF%</th>
        </tr>
      </thead>
      <tbody>
        ${ranking.map((jugador, index) => `
          <tr onclick="abrirDetalleJugador('${jugador.id}')" title="Ver estadísticas detalladas">
            <td><span class="rank-number">${index + 1}</span></td>
            <td><span class="player-name">${jugador.nombre}</span></td>
            <td>${jugador.partidos}</td>
            <td>${jugador.victorias}</td>
            <td>${jugador.derrotas}</td>
            <td><span class="effectiveness">${jugador.efectividad.toFixed(1)}%</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

    rankingContainer.innerHTML = tableHTML;
}

/**
 * Abre el modal con las estadísticas detalladas del jugador
 */
function abrirDetalleJugador(jugadorId) {
    const jugador = jugadores[jugadorId];
    if (!jugador) return;

    const modal = document.getElementById('stats-modal');
    const modalName = document.getElementById('modal-player-name');
    const modalBody = document.getElementById('modal-body');

    modalName.innerText = `${jugador.nombre} ${jugador.apellido}`;

    // Calcular estadísticas detalladas solo para este jugador
    const stats = calcularStatsUnJugador(jugadorId);

    modalBody.innerHTML = `
        <div class="stats-summary-grid">
            <div class="modal-stat-card">
                <span class="modal-stat-value">${stats.partidos}</span>
                <span class="modal-stat-label">Partidos</span>
            </div>
            <div class="modal-stat-card">
                <span class="modal-stat-value" style="color: #2ECC71;">${stats.victorias}</span>
                <span class="modal-stat-label">GANADOS</span>
            </div>
            <div class="modal-stat-card">
                <span class="modal-stat-value" style="color: #EF4444;">${stats.derrotas}</span>
                <span class="modal-stat-label">PERDIDOS</span>
            </div>
            <div class="modal-stat-card">
                <span class="modal-stat-value">${stats.efectividad.toFixed(1)}%</span>
                <span class="modal-stat-label">Efectividad</span>
            </div>
        </div>

        <div class="details-section">
            <h3 class="details-title">📜 Historial de Partidos</h3>
            <div class="match-history-list">
                ${generarHistorialHTML(stats.historial)}
            </div>
        </div>

        <div class="details-section" style="margin-top: 2rem;">
            <h3 class="details-title">🤝 Mejores Parejas (Ganados)</h3>
            ${generarListaStats(stats.parejas, true)}
        </div>
    `;

    modal.style.display = 'block';

    // Cerrar modal
    const closeBtn = document.querySelector('.close-modal');
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    };
}

// Hacer global explícitamente para el onclick
window.abrirDetalleJugador = abrirDetalleJugador;

/**
 * Calcula estadísticas detalladas para un solo jugador
 */
function calcularStatsUnJugador(jugadorId) {
    const stats = {
        partidos: 0,
        victorias: 0,
        derrotas: 0,
        efectividad: 0,
        parejas: {},
        rivales: {},
        historial: []
    };

    partidos.forEach(p => {
        let enEquipo1 = p.equipo1.jugador1Id === jugadorId || p.equipo1.jugador2Id === jugadorId;
        let enEquipo2 = p.equipo2.jugador1Id === jugadorId || p.equipo2.jugador2Id === jugadorId;

        if (enEquipo1 || enEquipo2) {
            stats.partidos++;
            const gano = (enEquipo1 && p.ganador === 'equipo1') || (enEquipo2 && p.ganador === 'equipo2');

            if (gano) stats.victorias++;
            else stats.derrotas++;

            // Stats de Pareja
            const parejaId = enEquipo1
                ? (p.equipo1.jugador1Id === jugadorId ? p.equipo1.jugador2Id : p.equipo1.jugador1Id)
                : (p.equipo2.jugador1Id === jugadorId ? p.equipo2.jugador2Id : p.equipo2.jugador1Id);

            if (parejaId) {
                if (!stats.parejas[parejaId]) stats.parejas[parejaId] = { partidos: 0, victorias: 0 };
                stats.parejas[parejaId].partidos++;
                if (gano) stats.parejas[parejaId].victorias++;
            }

            // Stats de Rivales
            const rivalesIds = enEquipo1
                ? [p.equipo2.jugador1Id, p.equipo2.jugador2Id]
                : [p.equipo1.jugador1Id, p.equipo1.jugador2Id];

            rivalesIds.forEach(rid => {
                if (rid) {
                    if (!stats.rivales[rid]) stats.rivales[rid] = { partidos: 0, victorias: 0 };
                    stats.rivales[rid].partidos++;
                    if (gano) stats.rivales[rid].victorias++;

                }
            });

            // Agregar al historial
            stats.historial.push({
                fecha: p.fecha,
                pareja: parejaId ? (jugadores[parejaId]?.nombre + ' ' + jugadores[parejaId]?.apellido) : 'Desconocido',
                rivales: rivalesIds.map(rid => jugadores[rid] ? (jugadores[rid]?.nombre + ' ' + jugadores[rid]?.apellido) : 'Desconocido').join(' / '),
                gano: gano,
                sets: p.sets,
                supertiebreak: p.supertiebreak
            });
        }
    });

    if (stats.partidos > 0) stats.efectividad = (stats.victorias / stats.partidos) * 100;
    return stats;
}

/**
 * Genera HTML para las listas de parejas/rivales
 */
function generarListaStats(objeto, filtrarPorVictorias = false) {
    const items = Object.entries(objeto)
        .map(([id, s]) => ({ id, ...s, nombre: jugadores[id] ? `${jugadores[id].nombre} ${jugadores[id].apellido}` : 'Jugador Desconocido' }))
        .sort((a, b) => b.partidos - a.partidos);

    if (items.length === 0) return '<p style="color: var(--color-text-muted); font-size: 0.9rem;">No hay datos aún.</p>';

    return items.slice(0, 5).map(item => `
        <div class="mini-list-item">
            <span class="mini-list-label">${item.nombre}</span>
            <span class="mini-list-value">${item.victorias}G - ${item.partidos - item.victorias}P (${item.partidos} total)</span>
        </div>
    `).join('');
}

/**
 * Calcula estadísticas de todos los jugadores
 */
function calcularEstadisticas() {
    const stats = {};

    // Inicializar estadísticas para cada jugador
    Object.keys(jugadores).forEach(id => {
        stats[id] = {
            id: id,
            nombre: `${jugadores[id].nombre} ${jugadores[id].apellido}`,
            partidos: 0,
            victorias: 0,
            derrotas: 0,
            efectividad: 0
        };
    });

    // Procesar cada partido
    partidos.forEach(partido => {
        const jugadoresEquipo1 = [partido.equipo1.jugador1Id, partido.equipo1.jugador2Id];
        const jugadoresEquipo2 = [partido.equipo2.jugador1Id, partido.equipo2.jugador2Id];

        // Actualizar estadísticas de equipo 1
        jugadoresEquipo1.forEach(jugadorId => {
            if (stats[jugadorId]) {
                stats[jugadorId].partidos++;
                if (partido.ganador === 'equipo1') {
                    stats[jugadorId].victorias++;
                } else {
                    stats[jugadorId].derrotas++;
                }
            }
        });

        // Actualizar estadísticas de equipo 2
        jugadoresEquipo2.forEach(jugadorId => {
            if (stats[jugadorId]) {
                stats[jugadorId].partidos++;
                if (partido.ganador === 'equipo2') {
                    stats[jugadorId].victorias++;
                } else {
                    stats[jugadorId].derrotas++;
                }
            }
        });
    });

    // Calcular efectividad (porcentaje de victorias)
    Object.keys(stats).forEach(id => {
        if (stats[id].partidos > 0) {
            stats[id].efectividad = (stats[id].victorias / stats[id].partidos) * 100;
        }
    });

    return stats;
}

/**
 * Formatea una fecha de Firestore a formato legible
 */
function formatearFecha(timestamp) {
    if (!timestamp) return 'Fecha desconocida';

    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const opciones = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return fecha.toLocaleDateString('es-ES', opciones);
}

/**
 * Muestra un mensaje de error
 */
function mostrarError(mensaje) {
    const main = document.querySelector('.main');
    if (main) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.textContent = mensaje;
        main.insertBefore(alert, main.firstChild);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que Firebase esté listo
    setTimeout(inicializarApp, 500);
});

/**
 * Genera HTML para el historial de partidos en el modal
 */
function generarHistorialHTML(historial) {
    if (!historial || historial.length === 0) return '<p style="color: var(--color-text-muted);">No hay partidos registrados.</p>';

    return historial.map(h => {
        const fechaStr = formatearFecha(h.fecha);
        const claseResultado = h.gano ? 'win' : 'loss';
        const textoResultado = h.gano ? 'VICTORIA' : 'DERROTA';

        let scoreStr = '';
        if (h.sets) {
            scoreStr = h.sets.map(s => `${s.equipo1}-${s.equipo2}`).join(' / ');
        }
        if (h.supertiebreak) {
            scoreStr += ` (STB: ${h.supertiebreak.equipo1}-${h.supertiebreak.equipo2})`;
        }

        return `
            <div class="history-card ${claseResultado}">
                <div class="history-header">
                    <span>${fechaStr}</span>
                    <span class="history-result ${claseResultado}">${textoResultado}</span>
                </div>
                <div class="history-players">
                    <div style="margin-bottom: 2px;">
                        <span style="opacity: 0.7; font-size: 0.85em;">CON:</span> 
                        <span style="font-weight: 600;">${h.pareja}</span>
                    </div>
                    <div>
                        <span style="opacity: 0.7; font-size: 0.85em;">VS:</span> 
                        <span>${h.rivales}</span>
                    </div>
                </div>
                <div class="history-score">${scoreStr}</div>
            </div>
        `;
    }).join('');
}
