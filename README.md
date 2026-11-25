# Tienda Andina – E-commerce

## 1. Descripción del proyecto

Tienda Andina es una empresa ficticia dedicada a la comercialización de artesanías y textiles de productores de la sierra peruana.

El proyecto consiste en la implementación de una plataforma de comercio electrónico que permite digitalizar las ventas, gestionar clientes y pedidos, automatizar los procesos de integración y despliegue continuo, monitorizar la aplicación y migrar información proveniente de un sistema legado.

El sistema fue desarrollado como parte del curso de Implementación de Software de la Universidad San Ignacio de Loyola (USIL).

## 2. Funcionalidades implementadas

- Catálogo de productos.
- Búsqueda de productos por nombre y categoría.
- Visualización del detalle de productos.
- Registro e inicio de sesión de clientes.
- Almacenamiento seguro de contraseñas mediante bcrypt.
- Gestión del carrito de compras.
- Actualización de cantidades y eliminación de productos.
- Cálculo de IGV del 18 %.
- Aplicación de cupones de descuento.
- Checkout y pago simulado.
- Control de stock.
- Gestión de pedidos: pendiente, pagado y enviado.
- Historial de pedidos por cliente.
- Monitorización de la aplicación.
- Migración de datos desde archivos CSV.

### Cupones disponibles

| Cupón    | Descuento |
| -------- | --------: |
| ANDINA10 |      10 % |
| ANDINA20 |      20 % |

Los precios del catálogo no incluyen IGV. El impuesto se calcula sobre el subtotal después de aplicar el descuento.

## 3. Tecnologías utilizadas

| Categoría                         | Tecnología                      |
| --------------------------------- | ------------------------------- |
| Frontend                          | HTML, CSS y JavaScript          |
| Backend                           | Node.js 24 y Express            |
| Base de datos                     | SQLite                          |
| Autenticación                     | bcryptjs y express-session      |
| Control de versiones              | Git y GitHub                    |
| Integración y despliegue continuo | GitHub Actions                  |
| Pruebas automatizadas             | Node Test Runner y Supertest    |
| Pruebas End-to-End                | Playwright                      |
| Análisis estático                 | ESLint y SonarCloud             |
| Seguridad                         | npm audit y Trivy               |
| Contenedores                      | Docker y Docker Compose         |
| Migración de datos                | Python 3.11                     |
| Monitorización                    | Dashboard integrado y logs JSON |

## 4. Arquitectura del sistema

La aplicación utiliza una arquitectura web cliente-servidor. El frontend consume los servicios REST desarrollados con Express, mientras que SQLite permite almacenar los productos, clientes, pedidos y detalles de compra.

```text
Usuario / Navegador
        |
        v
Frontend HTML, CSS y JavaScript
        |
        v
API REST - Node.js / Express
        |
        +-- Autenticación
        +-- Catálogo
        +-- Carrito de compras
        +-- Gestión de pedidos
        +-- Monitorización
        |
        v
Base de datos SQLite
```

La aplicación se distribuye mediante contenedores Docker y utiliza volúmenes independientes para la persistencia de datos de cada ambiente.

### Estructura del proyecto

```text
Tienda-Andina/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── app.js
│   ├── server.js
│   ├── database.js
│   ├── seed.js
│   ├── auth.js
│   ├── catalogo.js
│   ├── carrito.js
│   ├── calculos.js
│   ├── pedidos.js
│   └── observabilidad.js
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── monitor.html
│   ├── monitor.css
│   └── monitor.js
├── tests/
│   ├── unit/
│   └── e2e/
├── migration/
│   ├── perfilamiento.py
│   └── etl.py
├── scripts/
├── .env.example
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── docker-compose.ambientes.yml
├── eslint.config.mjs
├── playwright.config.js
├── package.json
├── package-lock.json
├── LICENSE
└── README.md
```

## 5. Instalación y ejecución local

### Requisitos previos

- Git.
- Node.js 24.
- npm.
- Docker Desktop con Docker Compose.
- Python 3.11 para la migración de datos.

### Clonar el repositorio

```bash
git clone https://github.com/AndyMorales8748544/Tienda-Andina.git
cd Tienda-Andina
```

### Instalar dependencias

```bash
npm ci
```

### Configurar las variables de entorno

Crear un archivo `.env` utilizando como referencia el archivo `.env.example`.

En Windows CMD:

```cmd
copy .env.example .env
```

Configurar las siguientes variables:

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=
COOKIE_SECURE=false
```

Generar una clave segura para las sesiones:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiar el valor generado en la variable `SESSION_SECRET` del archivo `.env`.

El archivo `.env` no debe publicarse en el repositorio.

### Inicializar los datos y ejecutar la aplicación

```bash
node src/seed.js
npm start
```

Acceder desde el navegador:

- Aplicación: http://localhost:3000
- Monitorización: http://localhost:3000/monitor.html
- Health Check: http://localhost:3000/health
- Métricas: http://localhost:3000/metrics

Para detener la ejecución local, utilizar `Ctrl + C`.

## 6. Ejecución con Docker

Después de configurar el archivo `.env`, ejecutar:

```bash
docker compose up -d --build
```

Verificar el estado del contenedor:

```bash
docker compose ps
```

Consultar los registros de ejecución:

```bash
docker compose logs -f
```

Acceder a la aplicación:

http://localhost:3000

Para detener los contenedores:

```bash
docker compose down
```

Los datos se conservan mediante un volumen Docker. No utilizar la opción `-v` si se desea mantener la información almacenada.

## 7. Estrategia de control de versiones

Se utilizó una estrategia de ramas basada en GitFlow, adaptada al alcance del proyecto.

| Rama       | Propósito                             |
| ---------- | ------------------------------------- |
| main       | Versión estable del sistema           |
| develop    | Integración de funcionalidades        |
| feature/\* | Desarrollo de nuevas funcionalidades  |
| fix/\*     | Corrección de errores y observaciones |

Las funcionalidades fueron integradas mediante Pull Requests y verificaciones automatizadas.

Se utilizaron convenciones de commits como:

- `feat:` implementación de funcionalidades.
- `fix:` corrección de errores.
- `test:` incorporación o modificación de pruebas.
- `docs:` actualización de documentación.

La rama main cuenta con protección y verificaciones obligatorias del pipeline antes de permitir la integración.

## 8. Pruebas automatizadas

Se implementaron pruebas unitarias, pruebas de integración de la API y pruebas End-to-End.

### Ejecutar las pruebas

```bash
npm test
```

### Ejecutar el análisis de cobertura

```bash
npm run coverage
```

### Ejecutar las pruebas End-to-End

```bash
npx playwright install chromium
npm run test:e2e
```

### Visualizar el reporte de Playwright

```bash
npx playwright show-report
```

### Resultados obtenidos

| Indicador                          | Resultado |
| ---------------------------------- | --------: |
| Pruebas unitarias y de integración |        61 |
| Pruebas exitosas                   |        61 |
| Pruebas fallidas                   |         0 |
| Pruebas End-to-End exitosas        |    3 de 3 |
| Cobertura de líneas                |   91.85 % |
| Cobertura de ramas                 |   75.00 % |
| Cobertura de funciones             |   97.67 % |
| Cobertura mínima requerida         |      70 % |

### Escenarios End-to-End

| ID      | Escenario                       | Resultado |
| ------- | ------------------------------- | --------- |
| E2E-001 | Registro e inicio de sesión     | Aprobado  |
| E2E-002 | Compra completa y pago simulado | Aprobado  |
| E2E-003 | Vaciado del carrito de compras  | Aprobado  |

Las pruebas automatizadas se ejecutan dentro del pipeline de integración continua.

## 9. Calidad y seguridad del software

Se implementaron controles de calidad y seguridad para reducir los riesgos durante la integración y el despliegue.

| Herramienta      | Control implementado                             |
| ---------------- | ------------------------------------------------ |
| ESLint           | Validación estática del código JavaScript        |
| Node Test Runner | Pruebas automatizadas y cobertura                |
| Playwright       | Validación de flujos funcionales                 |
| SonarCloud       | Análisis de calidad y mantenibilidad             |
| npm audit        | Análisis de vulnerabilidades en dependencias     |
| Trivy            | Análisis de vulnerabilidades de la imagen Docker |
| Smoke Test       | Verificación básica de disponibilidad            |

El pipeline exige una cobertura mínima de líneas del 70 % y bloquea la integración cuando fallan las verificaciones obligatorias.

Durante el desarrollo se identificaron siete observaciones de SonarCloud relacionadas con seguridad, confiabilidad y mantenibilidad. Estas fueron atendidas mediante refactorización y posteriormente se obtuvo la aprobación del análisis.

También se identificaron seis vulnerabilidades de severidad alta en componentes incluidos en la imagen Docker inicial. Se modificó el Dockerfile para eliminar herramientas innecesarias del ambiente de ejecución y superar el análisis de Trivy.

### Medidas adicionales de seguridad

- Contraseñas almacenadas mediante hashes bcrypt.
- Variables sensibles excluidas del repositorio.
- Uso de GitHub Secrets para los archivos de migración.
- Cookies de sesión con la propiedad HttpOnly.
- Consultas parametrizadas a la base de datos.
- Ejecución del contenedor con un usuario no privilegiado.
- Control de stock y validación de datos.
- Aprobación manual antes del despliegue a producción.

## 10. Pipeline CI/CD

El pipeline fue implementado mediante GitHub Actions y se encuentra definido en:

`.github/workflows/ci.yml`

### Flujo de integración continua

```text
Push / Pull Request
        |
        v
Instalación de dependencias
        |
        v
Build y Lint
        |
        v
Pruebas automatizadas y cobertura
        |
        v
Pruebas End-to-End
        |
        v
npm audit
        |
        v
Construcción de imagen Docker
        |
        v
Análisis de vulnerabilidades con Trivy
        |
        v
Smoke Test
```

SonarCloud realiza un análisis adicional asociado al repositorio y a los Pull Requests.

### Flujo de despliegue continuo

```text
Push a develop
        |
        v
Quality Gate / Security Gate
        |
        v
Despliegue automático DEV


Push a main
        |
        v
Quality Gate / Security Gate
        |
        v
Despliegue automático STAGING
        |
        v
Respaldo y migración ETL
        |
        v
Validación de integridad y disponibilidad
        |
        v
Aprobación manual
        |
        v
Despliegue PRODUCCIÓN
```

### Evidencias de ejecución

| Evidencia                                  | Enlace                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Primera ejecución exitosa del CI           | [Ver pipeline](https://github.com/AndyMorales8748544/Tienda-Andina/actions/runs/45486009695) |
| Ejecución exitosa de pruebas automatizadas | [Ver pipeline](https://github.com/AndyMorales8748544/Tienda-Andina/actions/runs/45503433585) |
| Fallo controlado del Quality Gate          | [Ver pipeline](https://github.com/AndyMorales8748544/Tienda-Andina/actions/runs/45505139503) |
| Corrección del fallo controlado            | [Ver pipeline](https://github.com/AndyMorales8748544/Tienda-Andina/actions/runs/45505838147) |
| Validación de seguridad                    | [Ver pipeline](https://github.com/AndyMorales8748544/Tienda-Andina/actions/runs/45508351033) |
| Despliegue automático DEV                  | [Ver pipeline](https://github.com/AndyMorales8748544/Tienda-Andina/actions/runs/45639895728) |
| Pull Request de integración definitiva     | [Ver Pull Request #12](https://github.com/AndyMorales8748544/Tienda-Andina/pull/12)          |
| Pipeline definitivo de CI/CD               | [Ver pipeline](https://github.com/AndyMorales8748544/Tienda-Andina/actions/runs/45647794090) |

El pipeline definitivo finalizó satisfactoriamente con una duración total de 9 minutos y 14 segundos.

## 11. Ambientes de despliegue

Se configuraron tres ambientes independientes mediante Docker Compose.

| Ambiente   | URL local             | Despliegue               |
| ---------- | --------------------- | ------------------------ |
| DEV        | http://localhost:3001 | Automático desde develop |
| STAGING    | http://localhost:3002 | Automático desde main    |
| PRODUCCIÓN | http://localhost:3003 | Previa aprobación manual |

### Levantar los ambientes localmente

```bash
docker compose -f docker-compose.ambientes.yml up -d --build
```

### Verificar los ambientes

```bash
docker compose -f docker-compose.ambientes.yml ps
```

### Detener los ambientes

```bash
docker compose -f docker-compose.ambientes.yml stop
```

Cada ambiente utiliza un contenedor, un puerto y un volumen de datos independiente.

Los despliegues realizados en GitHub Actions corresponden a ambientes simulados dentro de runners temporales. Las URLs indicadas son locales y requieren ejecutar los contenedores en el equipo.

## 12. Monitorización y observabilidad

Se implementó un módulo de monitorización integrado en la aplicación.

### Endpoints disponibles

| Endpoint                    | Descripción                             |
| --------------------------- | --------------------------------------- |
| GET /api                    | Respuesta básica de la aplicación       |
| GET /health                 | Estado de la aplicación y base de datos |
| GET /metrics                | Indicadores de funcionamiento           |
| GET /monitor.html           | Dashboard de monitorización             |
| POST /api/simular-incidente | Simulación controlada en staging        |

### Indicadores monitorizados

- Cantidad de pedidos registrados.
- Número de peticiones HTTP.
- Tiempo promedio de respuesta.
- Cantidad de errores HTTP 5xx.
- Tasa de errores HTTP 5xx.
- Tiempo de actividad de la aplicación.
- Disponibilidad de la base de datos.

Los logs se generan en formato JSON e incluyen fecha, nivel, ambiente, identificador de petición, método HTTP, ruta, código de respuesta y duración.

### Dashboard de monitorización

| Ambiente   | URL                                |
| ---------- | ---------------------------------- |
| DEV        | http://localhost:3001/monitor.html |
| STAGING    | http://localhost:3002/monitor.html |
| PRODUCCIÓN | http://localhost:3003/monitor.html |

### Gestión de incidentes

Se ejecutó un incidente controlado en staging mediante la generación de una respuesta HTTP 503.

El procedimiento permitió:

1. Detectar el error mediante el dashboard.
2. Activar una alerta por errores HTTP 5xx.
3. Identificar la petición mediante su Request ID.
4. Analizar los registros de ejecución.
5. Identificar la causa del incidente simulado.
6. Deshabilitar la simulación y reiniciar el contenedor.
7. Verificar nuevamente la disponibilidad del sistema.

La simulación se encuentra deshabilitada por defecto y no puede ejecutarse en producción.

## 13. Migración de datos

Se implementó un proceso ETL mediante Python para migrar información de clientes y productos desde archivos CSV hacia SQLite.

### Archivos de origen

- `clientes(in).csv`
- `productos(in).csv`

Los archivos originales, respaldos y reportes detallados se encuentran excluidos del repositorio para evitar la exposición de información.

Para la ejecución automatizada se utilizaron GitHub Secrets asociados al ambiente staging.

### Etapas de migración

1. Perfilamiento de los datos.
2. Definición de reglas de calidad.
3. Validación y transformación.
4. Generación de registros rechazados.
5. Carga de datos en SQLite.
6. Conciliación e integridad.
7. Cutover y validación de la aplicación.
8. Procedimiento de rollback.

### Reglas de calidad

- Validación de campos obligatorios.
- Validación de correos electrónicos.
- Identificación de registros duplicados.
- Rechazo de precios negativos o inválidos.
- Normalización de fechas.
- Eliminación de espacios innecesarios.
- Normalización de correos electrónicos.
- Corrección de valores de stock vacíos.
- Conservación de la integridad referencial.

### Ejecución local del perfilamiento

Colocar los archivos CSV autorizados en el directorio `migration/origen/`.

```bash
python migration/perfilamiento.py
```

### Ejecución local del ETL

El ETL requiere una base de datos SQLite existente con el esquema actualizado.

Antes de ejecutar la migración, generar una copia de respaldo de la base de datos y trabajar sobre una copia independiente.

Ejemplo en Windows CMD:

```cmd
python migration\etl.py --db migration\backup\prueba_migracion.db
```

La ruta indicada corresponde a una copia de prueba que debe existir previamente.

### Resultados de la migración

| Indicador           | Productos | Clientes | Total |
| ------------------- | --------: | -------: | ----: |
| Registros de origen |        45 |       60 |   105 |
| Aceptados           |        38 |        0 |    38 |
| Corregidos          |         1 |       50 |    51 |
| Rechazados          |         6 |       10 |    16 |
| Cargados            |        39 |       50 |    89 |

El porcentaje de registros cargados fue del 84.76 %.

### Conciliación

```text
Registros de origen = Registros cargados + Registros rechazados

105 = 89 + 16
```

### Resultados en staging

| Entidad   | Antes | Después |
| --------- | ----: | ------: |
| Productos |     8 |      47 |
| Clientes  |     0 |      50 |
| Pedidos   |     0 |       0 |

- Integridad SQLite: OK.
- Conciliación: OK.
- Violaciones de claves foráneas: 0.
- Disponibilidad de la aplicación: UP.
- Disponibilidad de la base de datos: UP.

### Cutover y rollback

Se ejecutó un procedimiento de cutover en staging que incluyó la detención del servicio, generación del respaldo, migración sobre una copia de la base de datos, instalación de la base migrada y validación posterior.

También se ejecutó una prueba local de rollback, restaurando la base de datos original y verificando la disponibilidad del sistema.

El pipeline incorpora un procedimiento de rollback automático ante fallos de staging. Este mecanismo no fue activado durante la ejecución definitiva debido a que la migración finalizó satisfactoriamente.

### Reportes generados

- `reporte_perfilamiento.json`
- `reporte_migracion.json`
- `rechazados.csv`
- `corregidos.csv`

El reporte consolidado de migración se publica como artefacto de GitHub Actions.

## 14. Limitaciones y alcance académico

- Los pagos son simulados y no utilizan una pasarela bancaria real.
- Los ambientes de despliegue son simulados mediante Docker Compose y runners temporales de GitHub Actions.
- Las bases de datos de los ambientes son independientes. La migración automatizada se realiza únicamente en staging.
- La aprobación manual de producción fue realizada por la cuenta del estudiante.
- Los Pull Requests fueron validados mediante controles automatizados, sin revisión de un colaborador externo.
- Las sesiones y métricas se almacenan en memoria y se reinician al reiniciar la aplicación.
- El dashboard de monitorización está orientado a ambientes académicos locales.
- Los clientes migrados requieren activación antes de iniciar sesión. El mecanismo de activación queda como mejora futura.
- El cambio de estado de los pedidos a enviado forma parte de la simulación académica.
- El rollback automático fue configurado, pero su ejecución ante un fallo real del pipeline queda pendiente de validación.

## 15. Declaración de uso de inteligencia artificial

Se utilizó ChatGPT como herramienta de apoyo durante la planificación, implementación, generación y revisión de código, resolución de errores, configuración de pipelines, pruebas automatizadas, migración de datos y elaboración de documentación técnica.

El estudiante participó en la ejecución de los procedimientos, revisión del código, validación de resultados y recopilación de evidencias, asumiendo la responsabilidad sobre el trabajo presentado.

## 16. Autor

- **Nombre:** Andy Rolando Morales Segura.
- **Carrera:** Ingeniería de Software.
- **Universidad:** Universidad San Ignacio de Loyola.
- **Curso:** Implementación de Software.
- **Año:** 2026.

## 17. Licencia

Este proyecto se distribuye bajo la licencia MIT.

Consultar el archivo [LICENSE](LICENSE) para más información.
