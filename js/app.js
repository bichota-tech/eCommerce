/**
 * app.js
 * Lógica principal del Mini eCommerce consumiendo Fake Store API.
 * Gestiona tanto el catálogo principal como la vista detallada de productos.
 */

// Endpoint base de la API externa
const API_URL = 'https://fakestoreapi.com/products';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Registrar Service Worker para capacidades de PWA (caché offline)
    // El Service Worker solo funciona bajo entornos seguros (localhost o https).
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => console.log('ServiceWorker registrado con éxito: ', registration.scope))
                .catch(err => console.log('Fallo en el registro del ServiceWorker: ', err));
        });
    }

    // 2. Enrutamiento Básico: Detectar en qué página estamos verificando una clase en el body
    const isDetailPage = document.body.classList.contains('detail-page');
    const isCategoryPage = document.body.classList.contains('category-page');
    const isOffersPage = document.body.classList.contains('offers-page');

    if (isDetailPage) {
        initDetailPage();
    } else if (isCategoryPage) {
        initCategoriesPage();
    } else if (isOffersPage) {
        initOffersPage();
    } else {
        initCatalogPage();
    }
});

/* ==========================================================================
   Catálogo (index.html)
   ========================================================================== */
// Variable global para almacenar todos los productos y no saturar la API
// en cada búsqueda o filtro.
let allProducts = [];

/**
 * Inicializa la lógica de la página principal (Catálogo).
 */
async function initCatalogPage() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('products-grid');
    const categoryFilter = document.getElementById('category-filter');

    if (!grid) return;

    try {
        // Ejecutar obtención de categorías (para el desplegable select)
        await fetchCategories(categoryFilter);

        // Fetch de todos los productos
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error de red al cargar productos');
        
        allProducts = await response.json();
        
        // Ocultar la pantalla de carga inicial
        loader.classList.add('hidden');

        // -- Lógica de Filtrado Cruzado --
        const searchInput = document.getElementById('search-input');
        
        const filterProducts = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedCategory = categoryFilter.value;
            
            // Filtra sobre la copia local (allProducts) basándose en nombre Y categoría.
            const filteredProducts = allProducts.filter(p => {
                const matchesSearch = p.title.toLowerCase().includes(searchTerm);
                const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
                return matchesSearch && matchesCategory;
            });
            
            // Re-renderiza con la lista filtrada
            renderProducts(filteredProducts, grid);
        };

        // Autoseleccionar categoría si viene por URL (ej. desde categorias.html)
        const urlParams = new URLSearchParams(window.location.search);
        const urlCategory = urlParams.get('category');
        if (urlCategory) {
            categoryFilter.value = urlCategory;
            filterProducts(); // Aplicar el filtro inmediatamente
        } else {
            renderProducts(allProducts, grid);
        }

        // Setup filter listeners
        categoryFilter.addEventListener('change', filterProducts);
        searchInput.addEventListener('input', filterProducts);

        // Setup retry button
        document.getElementById('retry-btn').addEventListener('click', () => {
            document.getElementById('error-state').classList.add('hidden');
            loader.classList.remove('hidden');
            initCatalogPage();
        });

    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

/**
 * Carga el selector de la interfaz con las opciones de categorías disponibles en la API.
 * @param {HTMLElement} selectElement - Elemento select del HTML.
 */
async function fetchCategories(selectElement) {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) return;
        const categories = await response.json();
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            // Capitalizar la primera letra visualmente
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

/**
 * Pinta un listado de productos como tarjetas HTML.
 * @param {Array} products - Objeto JSON con productos de la API.
 * @param {HTMLElement} container - Div o section donde se inyectará el contenido.
 */
function renderProducts(products, container) {
    container.innerHTML = ''; // Limpiar el contenedor actual antes de insertar
    const noResults = document.getElementById('no-results');
    
    // Si después de buscar no hay productos, mostrar contenedor "Sin Resultados"
    if (products.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        return;
    } else {
        if (noResults) noResults.classList.add('hidden');
    }

    products.forEach(product => {
        const card = document.createElement('article');
        card.className = 'product-card';
        
        // --- Generación dinámica de estrellas ---
        // Calcula promedio al entero más cercano (0-5 estrellas)
        const rating = product.rating ? Math.round(product.rating.rate) : 0;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                // Estrella pintada
                starsHtml += '<i class="bi bi-star-fill star-icon"></i>';
            } else {
                // Estrella hueca o gris
                starsHtml += '<i class="bi bi-star star-icon" style="color: #cbd5e1;"></i>';
            }
        }
        const reviewsCount = product.rating ? product.rating.count : 0;

        // Comprobar si es una oferta simulada
        const isOffer = product.discountPrice !== undefined;
        const badgeHtml = isOffer ? `<span class="badge-offer">-20%</span>` : `<span class="product-category-badge">${product.category}</span>`;
        const priceHtml = isOffer 
            ? `<span class="price-old">$${product.price.toFixed(2)}</span><span class="price-offer">$${product.discountPrice.toFixed(2)}</span>`
            : `<span class="product-price">$${product.price.toFixed(2)}</span>`;

        card.innerHTML = `
            <a href="producto.html?id=${product.id}" class="product-image-container">
                ${badgeHtml}
                <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy">
            </a>
            <div class="product-info">
                <a href="producto.html?id=${product.id}">
                    <h3 class="product-title">${product.title}</h3>
                </a>
                <div class="product-rating">
                    ${starsHtml}
                    <span>(${reviewsCount})</span>
                </div>
                <div class="product-price-row">
                    <div>${priceHtml}</div>
                    <button class="btn-icon" aria-label="Añadir al carrito" onclick="event.preventDefault(); alert('Añadido al carrito')">
                        <i class="bi bi-cart-plus"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/* ==========================================================================
   Página de Categorías (categorias.html)
   ========================================================================== */
async function initCategoriesPage() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('categories-grid');

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar productos para categorías');
        
        const products = await response.json();
        
        // Obtener categorías únicas
        const uniqueCategories = [...new Set(products.map(p => p.category))];
        
        loader.classList.add('hidden');
        
        uniqueCategories.forEach(category => {
            // Encontrar el primer producto de esta categoría para usar su foto
            const firstProduct = products.find(p => p.category === category);
            
            const card = document.createElement('a');
            card.href = `index.html?category=${encodeURIComponent(category)}`;
            card.className = 'category-card';
            
            card.innerHTML = `
                <div class="category-image-wrapper">
                    <img src="${firstProduct.image}" alt="${category}" class="category-image" loading="lazy">
                </div>
                <div class="category-overlay">
                    <h3 class="category-title">${category}</h3>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

/* ==========================================================================
   Página de Ofertas (ofertas.html)
   ========================================================================== */
async function initOffersPage() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('products-grid');

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar ofertas');
        
        const products = await response.json();
        
        // Filtrar productos "Top" (rating >= 4) y aplicar descuento matemático (20%)
        const offerProducts = products
            .filter(p => p.rating && p.rating.rate >= 4)
            .map(p => ({
                ...p,
                discountPrice: p.price * 0.8 // -20% de descuento
            }));
            
        loader.classList.add('hidden');
        renderProducts(offerProducts, grid);

    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

/* ==========================================================================
   Página de Detalle (producto.html)
   ========================================================================== */
/**
 * Inicializa la lógica para la vista del detalle individual.
 */
async function initDetailPage() {
    // 1. Obtener parámetro ?id=X de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const loader = document.getElementById('loader');
    const detailContainer = document.getElementById('product-detail');

    if (!productId) {
        loader.innerHTML = '<p>Producto no encontrado en URL.</p>';
        return;
    }

    try {
        // Fetch para un único producto a través de su ID
        const response = await fetch(`${API_URL}/${productId}`);
        if (!response.ok) throw new Error('Error al cargar el detalle del producto');
        
        const product = await response.json();
        
        // Ocultar carga y mostrar layout
        loader.classList.add('hidden');
        detailContainer.classList.remove('hidden');

        // Mapear los datos traídos a los elementos del DOM creados en el HTML
        document.title = `${product.title} | Mini eCommerce`; // Dinamismo SEO en el title
        document.getElementById('detail-image').src = product.image;
        document.getElementById('detail-image').alt = product.title;
        document.getElementById('detail-category').textContent = product.category;
        document.getElementById('detail-title').textContent = product.title;
        document.getElementById('detail-price').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('detail-description').textContent = product.description;

        const rating = product.rating ? Math.round(product.rating.rate) : 0;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="bi bi-star-fill star-icon"></i>';
            } else {
                starsHtml += '<i class="bi bi-star star-icon" style="color: #cbd5e1;"></i>';
            }
        }
        document.getElementById('detail-stars').innerHTML = starsHtml;
        document.getElementById('detail-count').textContent = `(${product.rating ? product.rating.count : 0} reseñas)`;

    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}
