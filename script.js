'use strict';

/* ==========================================================================
   Calculadora de Colores - LibroFest
   Lógica de la aplicación
   ========================================================================== */

/* ---------- Configuración / Estado ---------- */

const PRECIOS = {
  rojo: 80,
  verde: 60,
  amarillo: 40,
  azul: 20,
  naranja: 10,
  blanco: 0,
};

const STORAGE_KEYS = {
  historial: 'librofest_historial',
  theme: 'theme',
};

let historial = [];

/* ---------- Referencias al DOM (cacheadas) ---------- */

const dom = {
  total: () => document.getElementById('total'),
  themeIcon: () => document.getElementById('themeIcon'),
  historialContainer: () => document.getElementById('historial-container'),
  listaHistorial: () => document.getElementById('lista-historial'),
  input: (color) => document.getElementById(color),
};

/* ==========================================================================
   Módulo: Calculadora
   ========================================================================== */

const Calculadora = {
  /** Recalcula el total en base a los valores actuales de los inputs. */
  calcular() {
    let total = 0;
    for (const color in PRECIOS) {
      const input = dom.input(color);
      if (input.value < 0 || input.value === '') input.value = 0;
      const cantidad = parseInt(input.value, 10) || 0;
      total += cantidad * PRECIOS[color];
    }
    dom.total().textContent = total;
  },

  /** Incrementa o decrementa la cantidad de un color (botones +/-). */
  modificarCantidad(color, delta) {
    const input = dom.input(color);
    const valorActual = parseInt(input.value, 10) || 0;
    const nuevoValor = valorActual + delta;

    if (nuevoValor >= 0) {
      input.value = nuevoValor;
      this.calcular();
    }
  },

  /** Regresa todos los contadores a cero. */
  reiniciar() {
    for (const color in PRECIOS) {
      dom.input(color).value = 0;
    }
    this.calcular();
  },

  /** Lee los inputs actuales y devuelve { cantidades, detalles, total, tieneItems }. */
  leerSeleccionActual() {
    const cantidades = { rojo: 0, verde: 0, amarillo: 0, azul: 0, naranja: 0, blanco: 0 };
    const detalles = [];
    let total = 0;
    let tieneItems = false;

    for (const color in PRECIOS) {
      const cantidad = parseInt(dom.input(color).value, 10) || 0;
      if (cantidad > 0) {
        tieneItems = true;
        total += cantidad * PRECIOS[color];
        cantidades[color] = cantidad;

        const nombreColor = color.charAt(0).toUpperCase() + color.slice(1);
        detalles.push(`${cantidad}x ${nombreColor}`);
      }
    }

    return { cantidades, detalles: detalles.join(' • '), total, tieneItems };
  },
};

/* ==========================================================================
   Módulo: Historial
   ========================================================================== */

const Historial = {
  cargar() {
    const guardado = localStorage.getItem(STORAGE_KEYS.historial);
    historial = guardado ? JSON.parse(guardado) : [];
    this.renderizar();
  },

  guardarEnStorage() {
    localStorage.setItem(STORAGE_KEYS.historial, JSON.stringify(historial));
  },

  /** Crea un nuevo registro a partir de la selección actual y lo agrega al historial. */
  agregarRegistro() {
    const seleccion = Calculadora.leerSeleccionActual();

    if (!seleccion.tieneItems) {
      alert('No hay artículos seleccionados para guardar.');
      return false;
    }

    const ahora = new Date();
    const fechaIso =
      ahora.getFullYear() +
      '-' +
      String(ahora.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(ahora.getDate()).padStart(2, '0');
    const horaIso =
      String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');

    const nuevoRegistro = {
      id: Date.now(),
      fecha: ahora.toLocaleString('es-MX'),
      fechaExport: fechaIso,
      horaExport: horaIso,
      total: seleccion.total,
      detalles: seleccion.detalles,
      cantidades: seleccion.cantidades,
    };

    historial.unshift(nuevoRegistro);
    this.guardarEnStorage();
    this.renderizar();
    return true;
  },

  borrarRegistro(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro específico?')) return;
    historial = historial.filter((item) => item.id !== id);
    this.guardarEnStorage();
    this.renderizar();
  },

  borrarTodo() {
    if (!confirm('¿Estás seguro de que deseas borrar TODO el historial?')) return;
    historial = [];
    localStorage.removeItem(STORAGE_KEYS.historial);
    this.renderizar();
  },

  renderizar() {
    const contenedor = dom.historialContainer();
    const lista = dom.listaHistorial();

    if (historial.length === 0) {
      contenedor.style.display = 'none';
      return;
    }

    contenedor.style.display = 'block';
    lista.innerHTML = historial.map((item) => this._renderItem(item)).join('');
  },

  _renderItem(item) {
    return `
      <div class="history-item" id="registro-${item.id}">
        <div class="history-item-top">
          <span>🗓️ ${item.fecha}</span>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="history-total">${item.total} LP</span>
            <button class="btn-delete-item" onclick="Historial.borrarRegistro(${item.id})" title="Eliminar registro">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="history-details">
          📦 ${item.detalles}
        </div>
      </div>
    `;
  },
};

/* ==========================================================================
   Módulo: Exportación CSV
   ========================================================================== */

const Exportador = {
  exportarCSV() {
    if (historial.length === 0) {
      alert('No hay historial para exportar.');
      return;
    }

    let csv = 'Fecha,Hora,Rojo,Verde,Amarillo,Azul,Naranja,Blanco,Total LP\n';

    historial.forEach((item) => {
      const { fecha, hora, cantidades } = this._extraerDatosFila(item);
      csv += `${fecha},${hora},${cantidades.rojo},${cantidades.verde},${cantidades.amarillo},${cantidades.azul},${cantidades.naranja},${cantidades.blanco},${item.total}\n`;
    });

    this._descargarCSV(csv);
  },

  /** Soporta registros nuevos (con fechaExport/cantidades) y registros antiguos (solo texto). */
  _extraerDatosFila(item) {
    let fecha = '';
    let hora = '';
    let cantidades = { rojo: 0, verde: 0, amarillo: 0, azul: 0, naranja: 0, blanco: 0 };

    if (item.fechaExport && item.horaExport && item.cantidades) {
      fecha = item.fechaExport;
      hora = item.horaExport;
      cantidades = item.cantidades;
      return { fecha, hora, cantidades };
    }

    // Formato antiguo: parsear desde el texto de fecha/detalles.
    const partesComa = item.fecha.split(',');
    if (partesComa.length >= 2) {
      fecha = partesComa[0].trim();
      hora = partesComa[1].trim();
    } else {
      const partesEspacio = item.fecha.split(' ');
      fecha = partesEspacio[0] || item.fecha;
      hora = partesEspacio[1] || '';
    }

    if (item.detalles) {
      item.detalles.split('•').forEach((txt) => {
        const info = txt.trim().split('x ');
        if (info.length === 2) {
          const cantidad = parseInt(info[0], 10);
          const color = info[1].toLowerCase();
          if (cantidades[color] !== undefined) cantidades[color] = cantidad;
        }
      });
    }

    return { fecha, hora, cantidades };
  },

  _descargarCSV(csvContent) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const nombreArchivo = `Ventas_LibroFest_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.csv`;
    link.setAttribute('download', nombreArchivo);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

/* ==========================================================================
   Módulo: Tema (claro / oscuro)
   ========================================================================== */

const Tema = {
  aplicar(theme) {
    const doc = document.documentElement;
    const icon = dom.themeIcon();

    if (theme === 'dark') {
      doc.setAttribute('data-theme', 'dark');
      icon.textContent = '☀️';
    } else {
      doc.removeAttribute('data-theme');
      icon.textContent = '🌙';
    }
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  },

  alternar() {
    const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
    this.aplicar(esOscuro ? 'light' : 'dark');
  },

  cargarInicial() {
    const guardado = localStorage.getItem(STORAGE_KEYS.theme);
    this.aplicar(guardado === 'light' ? 'light' : 'dark');
  },
};

/* ==========================================================================
   Funciones globales usadas por los atributos onclick/onchange del HTML
   ========================================================================== */

function calcular() {
  Calculadora.calcular();
}

function modificarCantidad(color, delta) {
  Calculadora.modificarCantidad(color, delta);
}

function reiniciarCalculadora() {
  Calculadora.reiniciar();
}

function guardarCalculo() {
  const guardado = Historial.agregarRegistro();
  if (guardado) Calculadora.reiniciar();
}

function borrarRegistro(id) {
  Historial.borrarRegistro(id);
}

function borrarHistorial() {
  Historial.borrarTodo();
}

function exportarCSV() {
  Exportador.exportarCSV();
}

function toggleTheme() {
  Tema.alternar();
}

/* ==========================================================================
   Inicialización
   ========================================================================== */

window.addEventListener('DOMContentLoaded', () => {
  Tema.cargarInicial();
  Historial.cargar();
  Calculadora.calcular();
});
