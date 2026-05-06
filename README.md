# TaskFlow — Team Task Manager

A full-stack web app where users can create projects, assign tasks, and track progress with role-based access (Admin/Member).

## 🚀 Features

- **Authentication** — Signup/Login with JWT
- **Projects** — Create, update, delete projects  
- **Team Management** — Add/remove members by email with Admin/Member roles
- **Tasks** — Create, assign, update status, set priority & due dates
- **Kanban Board** — Visual task board (To Do → In Progress → Done)
- **Dashboard** — Aggregated stats, overdue tracking, recent activity
- **Role-Based Access** — Admins manage everything; Members update their own tasks

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |

## 📦 Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

```bash
# Clone and install all dependencies
npm install        # installs root
cd server && npm install
cd ../client && npm install
```

### Configure Environment

Edit `server/.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV=development
```

### Database Setup

```bash
cd server
npx prisma db push    # creates tables
npx prisma generate   # generates client
```

### Run Development

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

App runs at `http://localhost:5173`

## 🌐 Railway Deployment

1. Push code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add a **PostgreSQL** plugin (provides `DATABASE_URL`)
4. Connect your GitHub repo
5. Set environment variables:
   - `JWT_SECRET` = your secret key
   - `NODE_ENV` = production
6. Set build command: `npm install`
7. Set start command: `npm start`

Railway will auto-deploy. The Express server serves both the API and the React build.

## 📁 Project Structure

```
├── server/           # Express API
│   ├── prisma/       # Database schema
│   ├── src/
│   │   ├── middleware/  # Auth + Role guard
│   │   ├── routes/      # Auth, Projects, Tasks, Dashboard
│   │   └── utils/       # Validators
│   └── .env
├── client/           # React SPA
│   ├── src/
│   │   ├── components/  # Navbar, Modal, ProtectedRoute
│   │   ├── context/     # AuthContext
│   │   ├── pages/       # Dashboard, Projects, ProjectDetail, Login, Signup
│   │   └── utils/       # Axios API client
│   └── vite.config.js
├── package.json      # Root scripts
└── Procfile          # Railway
```
