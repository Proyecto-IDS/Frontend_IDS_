# IDS Campus Frontend

Interfaz React ligera para un sistema de detección de intrusos (IDS) universitario. Implementa un dashboard operativo, detalle de incidentes, mesa de trabajo colaborativa y panel de configuración, lista para conectarse con un backend REST.

## Características

- Arquitectura simple sin dependencias de UI ni routers externos.
- Router propio basado en `window.location.hash` con `import()` dinámico para cada página.
- Contexto global con React que administra incidentes, ajustes, toasts y mesas de trabajo, con persistencia en `localStorage`.
- Integración REST encapsulada con `fetch` y fallback a un mock con latencia simulada.
- Componentes accesibles (focus visible, navegación por teclado, uso de `aria-live`).
- Estilos modernos con CSS nativo, variables, temas claro/oscuro (`prefers-color-scheme`) y responsive.

## Requisitos

- Node.js 18+

## Scripts

```bash
npm install      # Instala dependencias
npm run dev      # Levanta el entorno local en http://localhost:5173
npm run build    # Genera build de producción
npm run preview  # Sirve la build generada
```

## Configuración del backend

El archivo `src/app/state.js` carga la configuración guardada en `localStorage` (clave `ids-settings`). Por defecto las peticiones se sirven desde el mock (`src/app/api.mock.js`). Para apuntar a una API real:

1. Abre la sección **Configuración** dentro de la aplicación (`#/settings`).
2. Define la URL base (por ejemplo `https://ids.campus.edu/api`).
3. Guarda los cambios; la preferencia queda persistida.

Con `apiBaseUrl` vacío, todas las llamadas usan los datos mock y el chat IA simulado.

## Estructura relevante

```
src/
  app/
    App.jsx           # Shell principal y layout
    App.css
    state.js          # Contexto global y acciones puras
    api.js            # Funciones fetch al backend o mock
    api.mock.js       # Dataset y latencia simulada
    router.js         # Router hash con code-splitting manual
  pages/              # Dashboard, IncidentDetail, WarRoom, Settings
  components/         # Topbar, Sidebar, Table, Toast, etc.
  styles/
    variables.css     # Tokens y temas
    layout.css        # Reset y layout base
    components.css    # Estilos reutilizables
```

## Accesibilidad y buenas prácticas

- Navegación por teclado con foco visible total.
- Uso de `aria-live="polite"` en la pila de toasts.
- elementos `<button>` reales para acciones primarias/secundarias.
- Contraste AA y transiciones suaves (`120ms`) en los componentes clave.

## Extensiones sugeridas

- Ajustar `api.mock.js` para emular nuevos endpoints o estados del IDS.
- Integrar exportación CSV desde la tabla con la API nativa `Blob`.
- Añadir pruebas E2E con Playwright/Cypress (sin dependencias UI externas).
