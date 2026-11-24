# Tienda Andina – E-commerce

## Descripción del proyecto

Tienda Andina es una empresa ficticia dedicada a la comercialización de artesanías y textiles de productores de la sierra peruana.

El proyecto tiene como objetivo implementar una plataforma de comercio electrónico que permita digitalizar las ventas, gestionar pedidos y migrar los datos de clientes y productos del sistema legado.

## Funcionalidades previstas

- Catálogo y búsqueda de productos.
- Registro e inicio de sesión de clientes.
- Carrito de compras.
- Cálculo de IGV (18 %) y cupones de descuento.
- Checkout con pago simulado.
- Gestión de estados de pedidos.
- Monitoreo de la aplicación.
- Migración de datos desde archivos CSV.

## Tecnologías

- Node.js y Express.
- HTML, CSS y JavaScript.
- SQLite.
- Git y GitHub.
- GitHub Actions.
- Node Test Runner.
- Playwright.
- ESLint.
- Docker y Docker Compose.
- Python.

## Ejecución local

Una vez completada la implementación, ejecutar:

    npm ci
    npm start

Acceder a:

    http://localhost:3000

## Ejecución con Docker

Una vez configurados los contenedores, ejecutar:

    docker compose up --build

## Estrategia de ramas

- main: versión estable de producción.
- develop: integración de funcionalidades.
- feature/\*: desarrollo de funcionalidades.

## Entornos previstos

| Entorno    | URL prevista          | Estado    |
| ---------- | --------------------- | --------- |
| Desarrollo | http://localhost:3001 | Pendiente |
| Staging    | http://localhost:3002 | Pendiente |
| Producción | http://localhost:3003 | Pendiente |

## Integración continua

El proyecto utilizará GitHub Actions para automatizar la instalación de dependencias, compilación, análisis de código y ejecución de pruebas automatizadas.

## Migración de datos

Se implementará un proceso de extracción, transformación y carga (ETL), incluyendo reglas de calidad, registros rechazados, conciliación y reversión.

## Declaración de uso de inteligencia artificial

Se utiliza ChatGPT como herramienta de apoyo para la planificación, generación de código, resolución de errores y documentación técnica. El estudiante es responsable de revisar, ejecutar y validar los resultados obtenidos.

## Autor

- Andy Rolando Morales Segura
- Ingeniería de Software
- Universidad San Ignacio de Loyola
- Curso: Implementación de Software

## Licencia

MIT.
