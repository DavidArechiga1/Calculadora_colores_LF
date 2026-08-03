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
  metodoPago: 'librofest_metodo_pago',
};

const COLOR_HEX = {
  rojo: '#ef4444',
  verde: '#22c55e',
  amarillo: '#eab308',
  azul: '#3b82f6',
  naranja: '#f97316',
  blanco: '#ffffff',
};

let historial = [];

/* ---------- Referencias al DOM (cacheadas) ---------- */

const dom = {
  total: () => document.getElementById('total'),
  subtotal: () => document.getElementById('subtotal'),
  descuentoLp: () => document.getElementById('descuento-lp'),
  descuentoInput: () => document.getElementById('descuento'),
  metodoPagoToggle: () => document.getElementById('metodoPagoToggle'),
  metodoPagoIcono: () => document.getElementById('metodoPagoIcono'),
  metodoPagoTexto: () => document.getElementById('metodoPagoTexto'),
  historialContainer: () => document.getElementById('historial-container'),
  listaHistorial: () => document.getElementById('lista-historial'),
  resumenHistorial: () => document.getElementById('resumen-historial'),
  input: (color) => document.getElementById(color),
};

/* ==========================================================================
   Módulo: Calculadora
   ========================================================================== */

const Calculadora = {
  /** Lee el subtotal (sin descuento) en base a los inputs de colores. */
  calcularSubtotal() {
    let subtotal = 0;
    for (const color in PRECIOS) {
      const input = dom.input(color);
      if (input.value < 0 || input.value === '') input.value = 0;
      const cantidad = parseInt(input.value, 10) || 0;
      subtotal += cantidad * PRECIOS[color];
    }
    return subtotal;
  },

  /** Lee el % de descuento del input, forzándolo a un rango válido de 0-100. */
  leerPorcentajeDescuento() {
    const input = dom.descuentoInput();
    let porcentaje = parseFloat(input.value);
    if (isNaN(porcentaje) || porcentaje < 0) porcentaje = 0;
    if (porcentaje > 100) porcentaje = 100;
    input.value = porcentaje;
    return porcentaje;
  },

  /** Recalcula subtotal, descuento y total final, y actualiza el DOM. */
  calcular() {
    const subtotal = this.calcularSubtotal();
    const porcentaje = this.leerPorcentajeDescuento();
    const descuentoLp = Math.round(subtotal * (porcentaje / 100));
    const total = subtotal - descuentoLp;

    dom.subtotal().textContent = subtotal;
    dom.descuentoLp().textContent = descuentoLp;
    dom.total().textContent = total;

    this._marcarChipActivo(porcentaje);
  },

  /** Resalta el chip de descuento rápido (0/10/20/50%) que coincide con el valor actual. */
  _marcarChipActivo(porcentaje) {
    document.querySelectorAll('.chip-descuento').forEach((chip) => {
      const valorChip = parseFloat(chip.textContent);
      chip.classList.toggle('activo', valorChip === porcentaje);
    });
  },

  /** Aplica un % de descuento predefinido (botones rápidos). */
  aplicarDescuentoRapido(porcentaje) {
    dom.descuentoInput().value = porcentaje;
    this.calcular();
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

  /** Regresa todos los contadores y el descuento a cero. */
  reiniciar() {
    for (const color in PRECIOS) {
      dom.input(color).value = 0;
    }
    dom.descuentoInput().value = 0;
    this.calcular();
  },

  /** Lee los inputs actuales y devuelve { cantidades, detalles, subtotal, porcentaje, descuentoLp, total, tieneItems }. */
  leerSeleccionActual() {
    const cantidades = { rojo: 0, verde: 0, amarillo: 0, azul: 0, naranja: 0, blanco: 0 };
    const detalles = [];
    let subtotal = 0;
    let tieneItems = false;

    for (const color in PRECIOS) {
      const cantidad = parseInt(dom.input(color).value, 10) || 0;
      if (cantidad > 0) {
        tieneItems = true;
        subtotal += cantidad * PRECIOS[color];
        cantidades[color] = cantidad;

        const nombreColor = color.charAt(0).toUpperCase() + color.slice(1);
        detalles.push(`${cantidad}x ${nombreColor}`);
      }
    }

    const porcentaje = this.leerPorcentajeDescuento();
    const descuentoLp = Math.round(subtotal * (porcentaje / 100));
    const total = subtotal - descuentoLp;

    return {
      cantidades,
      detalles: detalles.join(' • '),
      subtotal,
      porcentaje,
      descuentoLp,
      total,
      tieneItems,
    };
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
      subtotal: seleccion.subtotal,
      porcentajeDescuento: seleccion.porcentaje,
      descuentoLp: seleccion.descuentoLp,
      total: seleccion.total,
      detalles: seleccion.detalles,
      cantidades: seleccion.cantidades,
      metodoPago: MetodoPago.actual,
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
    dom.resumenHistorial().innerHTML = this._renderResumen();
    lista.innerHTML = historial.map((item) => this._renderItem(item)).join('');
  },

  /** Suma las cantidades vendidas por color, el total en LP y el desglose por método de pago. */
  calcularResumen() {
    const totalesPorColor = { rojo: 0, verde: 0, amarillo: 0, azul: 0, naranja: 0, blanco: 0 };
    const porMetodo = {
      LP: { count: 0, totalLp: 0 },
      MXN: { count: 0, totalLp: 0 },
    };
    let totalLp = 0;
    let totalLibros = 0;

    historial.forEach((item) => {
      const cantidades = item.cantidades || {};
      for (const color in totalesPorColor) {
        const cantidad = cantidades[color] || 0;
        totalesPorColor[color] += cantidad;
        totalLibros += cantidad;
      }
      totalLp += item.total || 0;

      const metodo = item.metodoPago === 'MXN' ? 'MXN' : 'LP';
      porMetodo[metodo].count += 1;
      porMetodo[metodo].totalLp += item.total || 0;
    });

    return { totalesPorColor, totalLp, totalLibros, porMetodo };
  },

  _renderResumen() {
    const { totalesPorColor, totalLp, totalLibros, porMetodo } = this.calcularResumen();

    const itemsColores = Object.keys(PRECIOS)
      .map((color) => {
        const cantidad = totalesPorColor[color];
        const nombreColor = color.charAt(0).toUpperCase() + color.slice(1);
        return `
          <div class="summary-color-item">
            <span class="badge" style="background:${COLOR_HEX[color]};"></span>
            ${nombreColor}: <span class="summary-color-count">${cantidad}</span>
          </div>
        `;
      })
      .join('');

    return `
      <div class="summary-title">📊 Resumen general</div>
      <div class="summary-colors">${itemsColores}</div>
      <div class="summary-methods">
        <div class="summary-method-item lp">
          📖 Pagado con LP: <strong>${porMetodo.LP.totalLp} LP</strong>
          <span class="summary-method-count">(${porMetodo.LP.count} venta${porMetodo.LP.count === 1 ? '' : 's'})</span>
        </div>
        <div class="summary-method-item mxn">
          💵 Pagado con MXN: <strong>${porMetodo.MXN.totalLp} LP</strong>
          <span class="summary-method-count">(${porMetodo.MXN.count} venta${porMetodo.MXN.count === 1 ? '' : 's'})</span>
        </div>
      </div>
      <div class="summary-footer">
        <span>📚 Total de libros vendidos: ${totalLibros}</span>
        <span class="summary-total-lp">${totalLp} LP</span>
      </div>
    `;
  },

  _renderItem(item) {
    const tieneDescuento = item.porcentajeDescuento && item.porcentajeDescuento > 0;
    const lineaDescuento = tieneDescuento
      ? `<div class="history-discount">🏷️ Descuento ${item.porcentajeDescuento}% (-${item.descuentoLp} LP) · Subtotal ${item.subtotal} LP</div>`
      : '';

    const metodoPago = item.metodoPago || 'LP';
    const esMxn = metodoPago === 'MXN';
    const etiquetaPago = `<span class="history-payment-badge ${esMxn ? 'mxn' : 'lp'}">${esMxn ? '💵 MXN' : '📖 LP'}</span>`;

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
          📦 ${item.detalles} &nbsp; ${etiquetaPago}
        </div>
        ${lineaDescuento}
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

    let csv =
      'Fecha,Hora,Rojo,Verde,Amarillo,Azul,Naranja,Blanco,Subtotal LP,Descuento %,Descuento LP,Total LP,Método de Pago\n';

    historial.forEach((item) => {
      const { fecha, hora, cantidades } = this._extraerDatosFila(item);
      const subtotal = item.subtotal ?? item.total;
      const porcentaje = item.porcentajeDescuento ?? 0;
      const descuentoLp = item.descuentoLp ?? 0;
      const metodoPago = item.metodoPago || 'LP';
      csv += `${fecha},${hora},${cantidades.rojo},${cantidades.verde},${cantidades.amarillo},${cantidades.azul},${cantidades.naranja},${cantidades.blanco},${subtotal},${porcentaje},${descuentoLp},${item.total},${metodoPago}\n`;
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
   Módulo: Método de pago (LP / MXN)
   ========================================================================== */

const MetodoPago = {
  actual: 'LP',

  aplicar(metodo) {
    this.actual = metodo;
    const boton = dom.metodoPagoToggle();
    const esMxn = metodo === 'MXN';

    boton.classList.toggle('modo-mxn', esMxn);
    dom.metodoPagoIcono().textContent = esMxn ? '💵' : '📖';
    dom.metodoPagoTexto().textContent = esMxn ? 'MXN' : 'LP';

    localStorage.setItem(STORAGE_KEYS.metodoPago, metodo);
  },

  alternar() {
    this.aplicar(this.actual === 'LP' ? 'MXN' : 'LP');
  },

  cargarInicial() {
    const guardado = localStorage.getItem(STORAGE_KEYS.metodoPago);
    this.aplicar(guardado === 'MXN' ? 'MXN' : 'LP');
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

function aplicarDescuentoRapido(porcentaje) {
  Calculadora.aplicarDescuentoRapido(porcentaje);
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

function togglePaymentMethod() {
  MetodoPago.alternar();
}

/* ==========================================================================
   Inicialización
   ========================================================================== */

window.addEventListener('DOMContentLoaded', () => {
  MetodoPago.cargarInicial();
  Historial.cargar();
  Calculadora.calcular();
});
