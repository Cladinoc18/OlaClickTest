# PRUEBA TÉCNICA : API de Gestión de Órdenes de Restaurante

Este proyecto es una API RESTful diseñada para gestionar las órdenes de un restaurante. Es una prueba técnica realizada por la empresa OlaClick

## Stack Tecnológico

* **Lenguaje/Entorno:** Node.js con TypeScript
* **Framework:** NestJS
* **Base de Datos:** PostgreSQL
* **ORM:** Sequelize
* **Caché:** Redis
* **Contenerización:** Docker y Docker Compose
* **Validación:** DTOs 
* **Pruebas:** Jest

## Prerrequisitos

Para que nuestra API funcione de la manera correcta, es necesario tener en cuenta las siguientes consideraciones y configuraciones:

*  Descargar e instalar [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* Una herramienta para probar APIs como [Postman](https://www.postman.com/)

## Configuración y Ejecución

Para poder levantar el proyecto: ->

1.  **Clona el Repositorio:**
    Si estás trabajando desde un repositorio Git:
    ```
    git clone <url-del-repositorio>
    ```

2.  **Crea el Archivo de Variables de Entorno:**
    En la raíz del proyecto, crea un archivo llamado .env . Utiliza este template:

    ```
    APP_PORT=3000

    # Configuración de PostgreSQL (para la aplicación dentro de Docker)
    DB_HOST=db # distinto a localhost
    DB_PORT=5432
    DB_USER=testuser # puede ser cualquier usuario
    DB_PASSWORD=testpassword # puede ser cualquier contraseña
    DB_NAME=restaurant_orders_db # puede ser cualquier BD
    DB_SYNCHRONIZE=true 
    DB_LOGGING=true     

    # Configuración de Redis
    REDIS_HOST=redis
    REDIS_PORT=6379
    ```
3.  **Instalar todas las dependencias:**
    Abre una terminal en la raiz del proyecto y ejecuta `npm i`, con esto instalaras todas las dependencias que se encuentan en el package.json
   
4.  **Construir y Levantar los Contenedores Docker:** (Es necesario ejecutar el Docker Desktop, previamente instalado)
    Abre una terminal en la raíz del proyecto y ejecuta `docker compose up --build`
   
    * La opción --build es importante la primera vez.
    * Para inicios posteriores, `docker compose up` podría ser suficiente.
    * La API estará disponible en `http://localhost:3000` (o el puerto que hayas configurado en `APP_PORT`).

5.  **Detener la Aplicación:**
    Para detener todos los servicios, presiona `Ctrl+C` en la terminal donde está corriendo `docker compose up`, y luego `docker compose down`

## Cómo Probar los Endpoints

Puedes usar Postman, Insomnia, o cualquier cliente HTTP para probar los siguientes endpoints. 

La URL base será `http://localhost:3000`, (o tu `APP_PORT`), como se mencionó anteriormente

---

### 1. Crear una Nueva Orden
* **Método:** `POST`
* **URL:** `/orders`
* **Cuerpo (Body - JSON):**
    ```
    {
      "clientName": "Nombre del Cliente",
      "items": [
        { "description": "Producto 1", "quantity": 2, "unitPrice": 15.50 },
        { "description": "Producto 2", "quantity": 1, "unitPrice": 5.75 }
      ]
    }
    ```
* **Respuesta Exitosa (201 Created):** La orden creada con sus ítems.

### 2. Listar Todas las Órdenes Activas
* **Método:** `GET`
* **URL:** `/orders` -> `http://localhost:3000/orders`
* **Descripción:** Devuelve todas las órdenes cuyo estado sea diferente de `delivered`.
* **Respuesta Exitosa (200 OK):** Un array de órdenes.

---

### 3. Ver Detalle de una Orden Específica
* **Método:** `GET`
* **URL:** `/orders/:id` (reemplaza `:id` con el ID de la orden)
* **Respuesta Exitosa (200 OK):** La orden con sus detalles e ítems.
* **Respuesta Error (404 Not Found):** Si la orden no existe.
* **Ejemplo para orden con ID 1:**
    ```
    http://localhost:3000/orders/1
    ```

---

### 4. Avanzar Estado de una Orden
* **Método:** `POST`
* **URL:** `/orders/:id/advance` (reemplaza `:id` con el ID de la orden)
* **Descripción:** Avanza el estado de la orden:
    * `initiated` → `sent`
    * `sent` → (marcada como `delivered`, luego eliminada de la BD y caché de `/orders` invalidado)
* **Respuesta Exitosa (200 OK):** La orden actualizada (si pasa a `sent`) o un mensaje de confirmación (si se elimina).
* **Respuesta Error (404 Not Found):** Si la orden no existe.
* **Ejemplo para orden con ID 1:**
    ```
    http://localhost:3000/orders/1/advance
    ```

---
## Consideraciones Técnicas Adicionales

* El proyecto utiliza la estructura modular de NestJS.
* Se ha intentado seguir los principios SOLID en la medida de lo posible, especialmente la separación de responsabilidades (Controller, Service).
* Se usan DTOs con `class-validator` y un `ValidationPipe` global para validar los datos de entrada de las solicitudes.
* El endpoint `GET /orders` implementa caché en Redis por 30 segundos usando `CacheInterceptor` de NestJS.
* La opción `synchronize: true` de Sequelize está activada para desarrollo, lo que permite crear/actualizar las tablas automáticamente según los modelos.

## Pruebas Automatizadas

El desarrollo del proyecto incluye una prueba End-to-End (E2E) para verificar la funcionalidad básica de los endpoints. Para ejecutar las pruebas es necesario:

1.  Ejecutar los contenedores Docker en una terminal

2.  En otra terminal, ejecutar el comando de pruebas E2E:
    ```
    npm run test:e2e
    ```
---
## Posibles Problemas y Soluciones

Durante las pruebas (ensayo y error), se encontró con un problema del cual no se tenía conocimiento y es que no podía hacer conexión con postgreSQL, pero si creaba la base de datos en Docker.

Luego de realizar las respectivas consultas, se encontró que el servicio de PSQL estaba corriendo en segundo plano (con las credenciales creadas cuando se instaló en el computador) y no permitía hacer uso de otras credencales (como las usadas en el .env)

**Solución:**
Debes **detener temporalmente tu servicio local de PostgreSQL** para liberar el puerto `5432` y permitir que las conexiones a `localhost:5432` se dirijan al contenedor Docker.

**¿Por qué es importante esto?**
El objetivo de usar Docker para este proyecto es tener un entorno de base de datos aislado y consistente, específico para la aplicación. Al detener tu instancia local, te aseguras de que estás interactuando y probando contra la base de datos correcta del proyecto.


