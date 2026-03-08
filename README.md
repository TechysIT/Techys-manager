# 🚀 TaskManager

<div align="center">

![TaskManager Logo](https://via.placeholder.com/150x150/f97316/ffffff?text=TM)

**A Complete Task Management Web Application**

Built with Next.js 14, TypeScript, Prisma, and Tailwind CSS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Demo](#demo) • [Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📖 Table of Contents

- [About](#about)
- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

TaskManager is a production-ready task management application with a beautiful UI, comprehensive RBAC system, and powerful features for team collaboration. Perfect for teams and individuals who want to organize their projects and track progress efficiently.

### ✨ Key Highlights

- 🔐 **Secure Authentication** - NextAuth.js with bcrypt password hashing
- 👥 **Role-Based Access Control** - 4 roles with 26 granular permissions
- 📊 **Project Management** - Hierarchical organization (Projects → Sections → Tasks)
- 📋 **Kanban Board** - Drag-and-drop task management
- 💬 **Comment System** - Collaborate with team members
- 📈 **Reports & Analytics** - Weekly progress and project tracking
- 🎨 **Beautiful UI** - Responsive design with Tailwind CSS
- ⚡ **Fast & Modern** - Built on Next.js 14 App Router

## ✨ Features

- ✅ User Authentication (NextAuth)
- ✅ Role-Based Access Control (4 roles, 26 permissions)
- ✅ Project Management
- ✅ Section Organization
- ✅ Task Tracking (Kanban Board)
- ✅ Comment System with Fixed/Unfixed Marking
- ✅ Weekly Progress Reports
- ✅ Project Progress Analytics
- ✅ Responsive Design (Mobile/Tablet/Desktop)
- ✅ Beautiful Orange Theme

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (creates sample users and data)
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

## 🔑 Demo Credentials

- **Admin:** admin@taskmanager.com / password123
- **Manager:** manager@taskmanager.com / password123
- **Developer:** developer@taskmanager.com / password123
- **Viewer:** viewer@taskmanager.com / password123

## 📁 Project Structure

```
taskmanager-complete/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes (17 endpoints)
│   ├── (dashboard)/          # Dashboard pages
│   ├── login/                # Login page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── ui/                   # UI primitives
│   ├── layout/               # Layout components
│   └── features/             # Feature components
├── lib/                      # Utilities & configuration
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts             # Database client
│   ├── permissions.ts        # RBAC utilities
│   ├── validations/          # Zod schemas
│   └── utils/                # Helper functions
├── prisma/                   # Database
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
├── types/                    # TypeScript types
└── public/                   # Static assets
```

## 🎯 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **Validation:** Zod
- **Icons:** Heroicons

## 📚 Documentation

- `docs/API_DOCUMENTATION.md` - Complete API reference
- `docs/SCHEMA_EXPLANATION.md` - Database design
- `docs/RBAC_EXPLANATION.md` - Authentication & permissions
- `docs/UI_DOCUMENTATION.md` - UI components guide

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables (Production)

Set these in your hosting platform:
- `DATABASE_URL` - Production PostgreSQL connection string
- `NEXTAUTH_SECRET` - Production secret key
- `NEXTAUTH_URL` - Production URL (e.g., https://yourapp.com)

## 📊 Features Overview

### Authentication & Security
- Bcrypt password hashing
- JWT session tokens
- Protected routes
- Permission-based access control

### Project Management
- Create/edit/delete projects
- Assign team members
- Set deadlines
- Track progress

### Task Management
- Kanban board (TODO/IN_PROGRESS/DONE)
- Priority levels (LOW/MEDIUM/HIGH)
- Deadline tracking
- Task assignments
- Comments with fixed/unfixed status

### Reports & Analytics
- Weekly user reports
- Project progress tracking
- Completion metrics
- Overdue task identification

## 🎨 Customization

### Change Theme Color

Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    // Change these values
    500: "#your-color",
    600: "#your-darker-color",
  }
}
```

### Modify Branding

Update these files:
- `components/layout/Sidebar.tsx` - Logo and app name
- `app/login/page.tsx` - Login page branding

## 🧪 Testing

```bash
# Test API endpoints
npm run test:api

# Test components
npm run test:components
```

## 📝 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues or questions, check the documentation in the `/docs` folder.

---

**Built with ❤️ using Next.js and TypeScript**
# task-manager
