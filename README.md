# Sistema de Inventario de Biblioteca

Interfaz web académica para administrar libros, usuarios, préstamos y devoluciones.

## Ejecución

El proyecto no requiere instalación de dependencias. Puede abrirse `login.html` directamente o servirse con cualquier servidor HTTP estático, por ejemplo:

```bash
python -m http.server 8000
```

Después, abra `http://localhost:8000/login.html`.

## Estructura

- `*.html`: vistas del sistema y navegación entre módulos.
- `css/style.css`: diseño general y componentes del panel.
- `css/pages.css`: formularios, modales y componentes específicos.
- `js/app.js`: filtros, detalles, altas y persistencia local.
- `imagenes/`: portadas del catálogo.

## Persistencia

Las altas creadas desde la interfaz se guardan en `localStorage`. Esto permite demostrar el flujo completo sin servidor ni base de datos. Para un entorno de producción, esta capa debe sustituirse por una API con autenticación y almacenamiento persistente.
