# ToolVexos 🧰

Plataforma web de herramientas todo-en-uno. Construida con React + Vite, Node.js + Express, PostgreSQL + Prisma y Tailwind CSS.

## Stack

| Capa       | Tecnología              |
|------------|-------------------------|
| Frontend   | React 18 + Vite         |
| Estilos    | Tailwind CSS v3         |
| Backend    | Node.js + Express       |
| ORM        | Prisma                  |
| Base datos | PostgreSQL              |
| Auth       | JWT + bcrypt            |

## Herramientas incluidas

- 🤖 Generador de texto con IA
- 🎨 Utilidades de colores (paletas, conversor HEX/RGB/HSL)
- 💻 Herramientas de código (formateador, minificador, diff)
- 📁 Convertidor de archivos (JSON↔CSV, Base64, etc.)

## Estructura del proyecto

```
toolvexos/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       │   ├── ui/         # Botones, inputs, modales
│       │   ├── layout/     # Navbar, Sidebar, Footer
│       │   └── tools/      # Componentes por herramienta
│       ├── pages/          # Rutas principales
│       ├── hooks/          # Custom hooks
│       └── lib/            # API client, utils
└── backend/           # Node.js + Express + Prisma
    └── src/
        ├── routes/         # Endpoints de la API
        ├── controllers/    # Lógica de negocio
        ├── middleware/     # Auth, validación, errores
        ├── prisma/         # Schema y migraciones
        └── utils/          # Helpers
```

## Inicio rápido

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Variables de entorno

Ver `backend/.env.example` y `frontend/.env.example`
