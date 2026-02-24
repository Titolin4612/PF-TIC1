# Arranque local

- Requisitos: JDK 21, Node.js 18+ y npm instalados. Puertos usados: backend 8080, frontend 5173.
- Backend: `cd backend && ./mvnw spring-boot:run` (deja la consola abierta; detén con Ctrl+C). Health: `curl http://localhost:8080/api/health`.
- Frontend (en otra terminal): `cd frontend`, primera vez `npm install`, luego `npm run dev`. Abre http://localhost:5173.
