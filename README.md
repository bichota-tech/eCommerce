# Mini eCommerce (Vanilla JS + Fake Store API)

Un catálogo de productos virtual, moderno y responsivo, creado con **Vanilla JavaScript**, **HTML5 Semántico** y **CSS3** nativo. Utiliza la [Fake Store API](https://fakestoreapi.com/) para obtener datos de productos ficticios.

## Características

- **Diseño Premium:** Interfaz de usuario limpia, uso de variables CSS, modo responsivo basado en Grid, sombras dinámicas y micro-animaciones en las interacciones.
- **Buscador en Tiempo Real:** Permite buscar productos por nombre y filtrar por categorías de forma simultánea e instantánea.
- **Renderizado Dinámico (Vanilla JS):** Generación segura del DOM usando plantillas literales e interacciones sin necesidad de frameworks pesados.
- **Manejo de Errores Visual:** Estados de "Error de Red" y "Resultados Vacíos" diseñados para ofrecer una buena Experiencia de Usuario (UX) junto con botones de reintento.
- **PWA Ready (Offline):** Integración básica con `manifest.json` y un *Service Worker* que provee de una estrategia de caché (Network First / Cache First) para asegurar que el catálogo pueda visualizarse sin conexión.
- **SEO Básico:** Uso de meta etiquetas estandarizadas (Open Graph y description) para optimización en motores de búsqueda.
- **Iconografía:** Uso de [Bootstrap Icons](https://icons.getbootstrap.com/) vía CDN.

## Estructura de Archivos

```text
/
├── index.html           # Página principal (Catálogo y Grid de productos)
├── producto.html        # Página de detalles de un producto individual
├── manifest.json        # Manifiesto de la PWA para su instalabilidad
├── service-worker.js    # Service Worker para manejo de caché offline
├── css/
│   └── styles.css       # Estilos globales, layout, UI states y variables CSS
└── js/
    └── app.js           # Lógica central: Fetching API, filtrado y renderizado
```

## Instalación y Uso

1. **Clonar/Descargar** el repositorio o la carpeta en tu máquina local.
2. Abre la carpeta usando un servidor de desarrollo local (como [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) en VS Code).
   > *Nota:* El Service Worker requiere un contexto seguro (`localhost` o `https`) para registrarse correctamente. Abrir los archivos con `file://` en el navegador limitará ciertas funcionalidades.
3. Abre el navegador en `http://localhost:5500/` o la ruta asignada por tu servidor local.

## Funcionamiento Técnico

### Lógica JavaScript (`app.js`)

El script principal determina la vista actual (catálogo o detalle) y hace la llamada a la API correspondiente:

- Filtra usando los arrays nativos `.filter()` de JS en tiempo real (mediante el evento `input`).
- Muestra *Loaders* mientras el `fetch()` está activo y los oculta una vez completado.

### Service Worker (`service-worker.js`)

Implementa un sistema de caché de archivos críticos:

- **Caché First:** Para la estructura, estilos (CSS) y scripts (JS), garantizando una carga rápida.
- **Network First con Fallback:** Para las llamadas a la Fake Store API, obteniendo siempre datos frescos pero recurriendo al último caché guardado si falla la conexión.
