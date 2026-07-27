// 1. Definición de Datos (Catálogo)
const catalogo = [
    { id: 'rojo', nombre: 'Rojo', precio: 80, bgClass: 'bg-rojo' },
    { id: 'verde', nombre: 'Verde', precio: 60, bgClass: 'bg-verde' },
    { id: 'amarillo', nombre: 'Amarillo', precio: 40, bgClass: 'bg-amarillo' },
    { id: 'azul', nombre: 'Azul', precio: 20, bgClass: 'bg-azul' },
    { id: 'naranja', nombre: 'Naranja', precio: 10, bgClass: 'bg-naranja' },
    { id: 'blanco', nombre: 'Blanco', precio: 0, bgClass: 'bg-blanco', border: true }
];

// 2. Estado de la Aplicación
let carrito = {};

// 3. Elementos del DOM
const gridProductos = document.getElementById('grid-productos');
const ticketItems = document.getElementById('ticket-items');
const emptyState = document.getElementById('empty-state');
const totalPrecio = document.getElementById('total-precio');
const btnLimpiar = document.getElementById('btn-limpiar');

// 4. Funciones de Renderizado
function inicializarCatalogo() {
    gridProductos.innerHTML = catalogo.map(prod => `
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-6 h-6 rounded-full ${prod.bgClass} ${prod.border ? 'border border-gray-300' : ''} shadow-inner"></div>
                <h3 class="text-lg font-bold text-gray-800">${prod.nombre}</h3>
            </div>
            <div class="text-2xl font-black text-gray-900 mb-4">${prod.precio} <span class="text-sm font-medium text-gray-500">LP</span></div>
            
            <div class="mt-auto flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200 p-1">
                <button onclick="actualizarCantidad('${prod.id}', -1)" class="w-10 h-10 rounded-md text-gray-500 hover:bg-white hover:shadow transition flex items-center justify-center">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <span id="cant-${prod.id}" class="font-bold text-lg w-12 text-center">0</span>
                <button onclick="actualizarCantidad('${prod.id}', 1)" class="w-10 h-10 rounded-md text-blue-600 hover:bg-white hover:shadow transition flex items-center justify-center">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderizarTicket() {
    const itemsEnCarrito = catalogo.filter(prod => carrito[prod.id] > 0);
    
    if (itemsEnCarrito.length === 0) {
        emptyState.style.display = 'block';
        ticketItems.innerHTML = '';
        ticketItems.appendChild(emptyState);
        totalPrecio.innerText = '0';
        return;
    }

    emptyState.style.display = 'none';
    let totalNum = 0;

    ticketItems.innerHTML = itemsEnCarrito.map(prod => {
        const cantidad = carrito[prod.id];
        const subtotal = cantidad * prod.precio;
        totalNum += subtotal;

        return `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-4 h-4 rounded-full ${prod.bgClass} ${prod.border ? 'border border-gray-300' : ''}"></div>
                    <div>
                        <div class="font-bold text-gray-800">${prod.nombre}</div>
                        <div class="text-sm text-gray-500">${cantidad} x ${prod.precio} LP</div>
                    </div>
                </div>
                <div class="font-black text-gray-900">${subtotal} LP</div>
            </div>
        `;
    }).join('');

    totalPrecio.innerText = totalNum;
}

// 5. Lógica de Control
window.actualizarCantidad = (id, cambio) => {
    if (!carrito[id]) carrito[id] = 0;
    carrito[id] += cambio;
    if (carrito[id] < 0) carrito[id] = 0;
    
    // Actualizar vista del contador en la tarjeta
    document.getElementById(`cant-${id}`).innerText = carrito[id];
    
    // Renderizar panel derecho
    renderizarTicket();
};

btnLimpiar.addEventListener('click', () => {
    carrito = {};
    catalogo.forEach(prod => {
        document.getElementById(`cant-${prod.id}`).innerText = '0';
    });
    renderizarTicket();
});

// 6. Inicialización
document.addEventListener('DOMContentLoaded', () => {
    inicializarCatalogo();
});
