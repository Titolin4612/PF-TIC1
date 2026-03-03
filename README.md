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