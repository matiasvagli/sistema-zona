# Seguimiento de Tareas — Sistema de Gestión Publicidad

## 🚀 Fase 1: Base (Backend)
- [x] Setup Django, DRF, JWT, CORS, SQLite Local (Base de datos lista)
- [x] App `accounts`: Usuarios, grupos, auth endpoints (modelos definidos)
- [x] App `clients`: CRUD de clientes (modelos definidos)
- [x] App `inventory`: Productos, stock, movimientos (modelos definidos)

## 💼 Fase 2: Núcleo Comercial (Backend)
- [x] App `budgets`: Presupuestos, ítems, estados (Tests de cálculo implementados)
- [x] App `work_orders`: CRUD OTs, estados, prioridad (modelos definidos)

## ⚙️ Fase 3: Pipeline de Producción (Backend)
- [x] App `production`: Sectores (dinámicos), SectorTask (modelos definidos)
- [x] Lógica `depends_on`: Validación de estados (Tests de validación implementados)
- [x] Endpoints semánticos: `start/`, `complete/`, `block/`, `set-estimate/` implementados

## 📍 Fase 4: Módulos de Negocio (Backend)
- [x] App `spaces`: AdSpace, SpaceRental (Cartelería vial) - Implementado
- [x] App `campaigns`: Gestión de campañas de clientes - Implementado
- [x] App `employees`: Datos de empleados (base RR.HH) - Implementado

## 🎨 Fase 5: Frontend (Next.js 14 + React 18 + Refine)
- [x] Setup inicial (Versiones estables por compatibilidad con AntD 5)
- [x] Autenticación y Layout base (Login y Dashboard)
- [x] Vistas CRUD básicas (Clientes, Productos, etc.)
- [x] Vista de Pipeline (Tablero Kanban dinámico)
- [x] Vistas de Espacios y Campañas (Listados base)

---
*Última actualización: 19 de Abril, 2026 (Proyecto Base Completo - Backend & Frontend)*

---
### 🛠️ Notas Técnicas
- **Backend**: Django 5.x + SQLite (para agilidad de desarrollo).
- **Frontend**: Next.js 14 + React 18 (Elegido por estabilidad total con Ant Design 5 y Refine).
- **Auth**: JWT (SimpleJWT) compatible con futuras aplicaciones móviles.
