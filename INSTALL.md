# 📖 Installation Guide - TaskManager Complete

## Complete Web Application Setup

This guide will help you set up the TaskManager application from scratch.

---

## 🎯 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18.0.0 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (v9.0.0 or higher) - Comes with Node.js
   - Verify: `npm --version`

3. **PostgreSQL** (v14.0 or higher)
   - Download: https://www.postgresql.org/download/
   - Or use a cloud service: Supabase, Railway, Neon, etc.
   - Verify: `psql --version`

4. **Git** (Optional, for version control)
   - Download: https://git-scm.com/

---

## 🚀 Installation Methods

### Method 1: Automated Setup (Recommended)

**For Unix/Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**For Windows:**
```bash
setup.bat
```

The script will:
- ✅ Install all dependencies
- ✅ Create .env file
- ✅ Generate Prisma Client
- ✅ Run database migrations
- ✅ Seed sample data
- ✅ Verify build

---

### Method 2: Manual Setup

#### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages:
- next (Framework)
- react & react-dom (UI library)
- next-auth (Authentication)
- @prisma/client (Database ORM)
- bcryptjs (Password hashing)
- zod (Validation)
- @heroicons/react (Icons)
- tailwindcss (Styling)

**Expected time:** 2-5 minutes

---

#### Step 2: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# PostgreSQL Database Connection
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**How to configure:**

1. **DATABASE_URL**: Replace with your PostgreSQL credentials
   - Local example: `postgresql://postgres:password@localhost:5432/taskmanager`
   - Cloud example: Get connection string from your provider

2. **NEXTAUTH_SECRET**: Generate a secure key
   ```bash
   # Unix/Mac/Linux
   openssl rand -base64 32
   
   # Windows (PowerShell)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **NEXTAUTH_URL**: Keep as `http://localhost:3000` for development

---

#### Step 3: Setup Database

**3a. Create Database (if not exists)**

```bash
# Using psql
psql -U postgres
CREATE DATABASE taskmanager;
\q
```

**3b. Generate Prisma Client**

```bash
npx prisma generate
```

This creates the TypeScript types and client for your database.

**3c. Run Migrations**

```bash
npx prisma migrate dev --name init
```

This creates all database tables, indexes, and relationships.

**Expected output:**
```
✅ Migrations applied successfully
✅ Prisma Client generated
✅ Database schema up to date
```

**3d. Seed Database (Optional but Recommended)**

```bash
npx prisma db seed
```

This creates:
- 4 Roles (Admin, Manager, Developer, Viewer)
- 26 Permissions
- 4 Sample Users
- 1 Sample Project with sections and tasks

**Demo Credentials:**
- **Admin:** admin@taskmanager.com / password123
- **Manager:** manager@taskmanager.com / password123
- **Developer:** developer@taskmanager.com / password123
- **Viewer:** viewer@taskmanager.com / password123

---

#### Step 4: Run Development Server

```bash
npm run dev
```

**Expected output:**
```
✓ Ready in 3.2s
○ Local:   http://localhost:3000
```

Open your browser and navigate to: **http://localhost:3000/login**

---

## 🎨 First Login

1. Go to http://localhost:3000/login
2. Use demo credentials:
   - Email: `admin@taskmanager.com`
   - Password: `password123`
3. You'll be redirected to the dashboard

**What you'll see:**
- Dashboard with statistics
- Sidebar navigation
- Sample project data

---

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:reset         # Reset database (careful!)

# Code Quality
npm run lint             # Run ESLint
```

---

## 🗄️ Database Management

### View Database (GUI)

```bash
npx prisma studio
```

Opens at http://localhost:5555

Here you can:
- Browse all tables
- View data
- Edit records
- Run queries

### Reset Database

```bash
npm run db:reset
```

⚠️ **Warning:** This deletes all data!

### Create New Migration

```bash
npx prisma migrate dev --name migration_name
```

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Check if PostgreSQL is running
   ```bash
   # Unix/Mac/Linux
   sudo service postgresql status
   
   # Windows
   services.msc (look for PostgreSQL)
   ```

2. Verify DATABASE_URL in .env
3. Test connection:
   ```bash
   npx prisma db pull
   ```

### Issue: "Module not found"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Use different port
PORT=3001 npm run dev
```

### Issue: "NEXTAUTH_SECRET is not defined"

**Solution:**
1. Check .env file exists
2. Verify NEXTAUTH_SECRET is set
3. Restart dev server

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables in Vercel Dashboard:**
   - DATABASE_URL (production PostgreSQL)
   - NEXTAUTH_SECRET (same as local or new)
   - NEXTAUTH_URL (your production URL)

5. **Run migrations on production:**
   ```bash
   npx prisma migrate deploy
   ```

### Deploy to Other Platforms

**Railway:**
```bash
railway login
railway init
railway up
```

**Netlify, Render, Fly.io:**
Follow their Next.js deployment guides and set environment variables.

---

## 📚 Next Steps

After successful installation:

1. **Explore the App**
   - Login with demo credentials
   - Create a project
   - Add tasks
   - Leave comments
   - Generate reports

2. **Read Documentation**
   - `/docs/API_DOCUMENTATION.md` - API reference
   - `/docs/SCHEMA_EXPLANATION.md` - Database design
   - `/docs/RBAC_EXPLANATION.md` - Authentication
   - `/docs/UI_DOCUMENTATION.md` - UI components

3. **Customize**
   - Change branding in `components/layout/Sidebar.tsx`
   - Modify theme colors in `tailwind.config.ts`
   - Add your own features

4. **Production Checklist**
   - [ ] Change NEXTAUTH_SECRET
   - [ ] Setup production database
   - [ ] Update NEXTAUTH_URL
   - [ ] Remove demo users (or change passwords)
   - [ ] Configure CORS if needed
   - [ ] Enable HTTPS
   - [ ] Setup monitoring
   - [ ] Configure backups

---

## 🆘 Getting Help

**Check Documentation:**
- README.md (this file)
- `/docs` folder (detailed guides)

**Common Issues:**
- Database connection → Check DATABASE_URL
- Build errors → Run `npm install` again
- Type errors → Run `npx prisma generate`

**Resources:**
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org/

---

## ✅ Verification Checklist

After installation, verify everything works:

- [ ] Dependencies installed (`node_modules` exists)
- [ ] .env file created and configured
- [ ] Database created
- [ ] Migrations applied
- [ ] Prisma Client generated
- [ ] Sample data seeded
- [ ] Dev server starts without errors
- [ ] Can login at http://localhost:3000/login
- [ ] Dashboard loads correctly
- [ ] Can create a project
- [ ] Can create a task
- [ ] Can add a comment

---

## 🎉 Success!

You now have a fully functional TaskManager application!

**Your application includes:**
- ✅ Authentication & Authorization
- ✅ Project Management
- ✅ Task Tracking
- ✅ Comment System
- ✅ Weekly Reports
- ✅ Beautiful UI
- ✅ Responsive Design

Ready to build something amazing! 🚀
