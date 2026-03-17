# Proyecto Logística - Sprint 1

## Descripción General

Este proyecto implementa un sistema básico de gestión de pedidos para una empresa de logística.  
Durante el Sprint 1 se desarrolló la arquitectura base del sistema, incluyendo backend en Spring Boot y frontend en React, con persistencia en MySQL.

---

# Stack Tecnológico

## Backend
- Java 
- Spring Boot
- Spring Data JPA
- Hibernate
- MySQL

## Frontend
- React
- Vite
- TypeScript

## Base de Datos
- MySQL 8

---

# Arquitectura del Proyecto

Se implementó una arquitectura en capas:

Controller → Service → Repository → Base de Datos

### Backend Structure
backend/
└── src/main/java/com/example/backend/
├── entity/
├── repository/
├── service/
├── web/
└── config/

### Frontend Structure
frontend/
└── src/
├── api/
├── assets/
├── styles/
├── App.tsx
└── main.tsx


# 🗄️ Modelo de Datos

## Entidad: Pedido

Campos:
- id (Long)
- direccionEntrega (String)
- estado (Enum)
- fechaCreacion (LocalDateTime)

Estados posibles:
- CREADO,
- EN_PREPARACION,
- EN_CAMINO,
- ENTREGADO,
- CANCELADO

---

# 🔌 Endpoints Implementados

## Crear Pedido
POST /api/pedidos

## Listar Pedidos
GET /api/pedidos

---

# 🧪 Pruebas Realizadas

- Pruebas de endpoints con Thunder Client
- Verificación de persistencia en MySQL
- Conexión frontend-backend validada
- Renderizado dinámico de datos en React

---

# 🌐 Frontend

El frontend consume el endpoint:

GET http://localhost:8080/api/pedidos

Y muestra dinámicamente la lista de pedidos almacenados en la base de datos.

---

# 🚀 Cómo Ejecutar el Proyecto

## Backend

1. Crear base de datos en MySQL: CREATE DATABASE logistica_db;
2. Configurar application.yml con credenciales locales.
3. Ejecutar: mvn spring-boot:run    
   Servidor corre en: http://localhost:8080

---

## Frontend

1. Ir a la carpeta frontend: cd frontend
2. Instalar dependencias: npm install
3. Ejecutar: npm run dev
   Frontend corre en: http://localhost:5173


# Entregable Sprint 1

✔ Backend funcional  
✔ Conexión exitosa a MySQL  
✔ CRUD básico (POST, GET)  
✔ Persistencia verificada  
✔ Frontend conectado mostrando datos  

---

# Documentación de la API — Módulo de Pedidos - Sprint 2


Esta API permite gestionar pedidos dentro del sistema logístico, incluyendo su creación, consulta, actualización, eliminación y cambio de estado.

---

# 1. Verificar estado del módulo

### Endpoint

```
GET /api/pedidos/test
```

### Descripción

Permite verificar que el módulo de pedidos está funcionando correctamente.

### Request

No requiere parámetros.

### Response

```
"Módulo de pedidos activo 🚚"
```

---

# 2. Crear un pedido

### Endpoint

```
POST /api/pedidos
```

### Descripción

Registra un nuevo pedido en el sistema.

### Request Body

```json
{
  "cliente": "Juan Perez",
  "direccion": "Cra 45 #12-30",
  "estado": "creado"
}
```

### Response

```json
{
  "id": 1,
  "cliente": "Juan Perez",
  "direccion": "Cra 45 #12-30",
  "estado": "creado"
}
```

---

# 3. Obtener todos los pedidos

### Endpoint

```
GET /api/pedidos
```

### Descripción

Devuelve la lista de todos los pedidos registrados.

### Request

No requiere parámetros.

### Response

```json
[
 {
   "id": 1,
   "cliente": "Juan Perez",
   "direccion": "Cra 45 #12-30",
   "estado": "en_camino"
 }
]
```

---

# 4. Obtener pedido por ID

### Endpoint

```
GET /api/pedidos/{id}
```

### Parámetros

| Parámetro | Tipo | Descripción              |
| --------- | ---- | ------------------------ |
| id        | Long | Identificador del pedido |

### Ejemplo

```
GET /api/pedidos/1
```

### Response

```json
{
 "id": 1,
 "cliente": "Juan Perez",
 "direccion": "Cra 45 #12-30",
 "estado": "en_camino"
}
```

---

# 5. Actualizar pedido

### Endpoint

```
PUT /api/pedidos/{id}
```

### Descripción

Permite modificar la información de un pedido existente.

### Parámetros

| Parámetro | Tipo | Descripción              |
| --------- | ---- | ------------------------ |
| id        | Long | Identificador del pedido |

### Request Body

```json
{
 "cliente": "Juan Perez",
 "direccion": "Cra 50 #10-20",
 "estado": "en_preparacion"
}
```

### Response

Devuelve el pedido actualizado.

---

# 6. Actualizar estado del pedido

### Endpoint

```
PUT /api/pedidos/{id}/estado
```

### Parámetros

| Parámetro | Tipo   | Descripción              |
| --------- | ------ | ------------------------ |
| id        | Long   | Identificador del pedido |
| estado    | String | Nuevo estado del pedido  |

### Ejemplo

```
PUT /api/pedidos/1/estado?estado=en_camino
```

### Estados permitidos

```
creado
en_preparacion
en_camino
entregado
cancelado
```

### Response

Devuelve el pedido con el estado actualizado.

---

# 7. Eliminar pedido

### Endpoint

```
DELETE /api/pedidos/{id}
```

### Parámetros

| Parámetro | Tipo | Descripción              |
| --------- | ---- | ------------------------ |
| id        | Long | Identificador del pedido |

### Ejemplo

```
DELETE /api/pedidos/1
```

### Response

No devuelve contenido.

---

# 8. Filtrar pedidos por estado

### Endpoint

```
GET /api/pedidos/estado
```

### Parámetros

| Parámetro | Tipo   | Descripción       |
| --------- | ------ | ----------------- |
| estado    | String | Estado del pedido |

### Ejemplo

```
GET /api/pedidos/estado?estado=en_camino
```

### Response

```json
[
 {
   "id": 3,
   "cliente": "Maria Gomez",
   "direccion": "Calle 10 #20-30",
   "estado": "en_camino"
 }
]
```

---

# Estados del pedido

El sistema utiliza los siguientes estados dentro del flujo de entrega:

| Estado         | Descripción                      |
| -------------- | -------------------------------- |
| creado         | Pedido registrado en el sistema  |
| en_preparacion | Pedido en proceso de preparación |
| en_camino      | Pedido en ruta de entrega        |
| entregado      | Pedido entregado al cliente      |
| cancelado      | Pedido cancelado                 |


