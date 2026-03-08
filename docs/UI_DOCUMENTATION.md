# TaskManager UI Documentation

## Overview

Complete UI system for the TaskManager application built with Next.js 14 App Router, Tailwind CSS, and React components. Features a responsive design with an orange primary color theme and sidebar navigation.

---

## 🎨 Design System

### Color Palette

**Primary (Orange):**
- `primary-50` to `primary-950` - Full orange gradient
- Main: `primary-600` (#f97316)
- Hover: `primary-700` (#ea580c)

**Status Colors:**
- Success: Green (#22c55e)
- Warning: Yellow (#eab308)
- Danger: Red (#ef4444)
- Info: Blue (#3b82f6)

**Neutrals:**
- White background (#ffffff)
- Gray scale for text and borders

### Typography

- **Font Family:** Inter (Google Font)
- **Headings:** Bold, tracking-tight
- **Body:** Regular, antialiased

### Spacing

Uses Tailwind's default spacing scale (4px increments):
- `p-4` = 16px padding
- `m-6` = 24px margin
- `space-x-3` = 12px horizontal spacing

---

## 📁 File Structure

```
app/
├── globals.css                    # Global styles & Tailwind
├── layout.tsx                     # Root layout
├── login/
│   └── page.tsx                   # Login page
└── (dashboard)/                   # Dashboard routes group
    ├── layout.tsx                 # Dashboard layout with sidebar
    ├── dashboard/page.tsx         # Main dashboard
    ├── projects/page.tsx          # Projects list
    ├── sections/page.tsx          # Sections list
    ├── tasks/page.tsx             # Tasks kanban board
    └── reports/page.tsx           # Reports & analytics

components/
├── ui/                            # Reusable UI components
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   └── Input.tsx
└── layout/                        # Layout components
    ├── Sidebar.tsx
    └── Header.tsx

tailwind.config.ts                 # Tailwind configuration
postcss.config.mjs                 # PostCSS configuration
```

---

## 🧩 UI Components

### Button Component

**Location:** `components/ui/Button.tsx`

**Usage:**
```tsx
import { Button } from "@/components/ui/Button";

// Variants
<Button variant="primary">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="danger">Danger Button</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>

// With icons
<Button>
  <PlusIcon className="h-5 w-5 mr-2" />
  New Project
</Button>
```

**Props:**
- `variant`: "primary" | "secondary" | "outline" | "danger"
- `size`: "sm" | "md" | "lg"
- All standard button HTML attributes

---

### Badge Component

**Location:** `components/ui/Badge.tsx`

**Usage:**
```tsx
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";

// Generic badges
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="gray">Gray</Badge>

// Status badges (for tasks)
<StatusBadge status="TODO" />
<StatusBadge status="IN_PROGRESS" />
<StatusBadge status="DONE" />

// Priority badges
<PriorityBadge priority="LOW" />
<PriorityBadge priority="MEDIUM" />
<PriorityBadge priority="HIGH" />
```

**Props:**
- `variant`: "primary" | "success" | "warning" | "danger" | "gray"
- `children`: React node to display

---

### Card Component

**Location:** `components/ui/Card.tsx`

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>

// With hover effect
<Card hover>
  Hoverable card
</Card>
```

**Props:**
- `hover`: boolean - Adds hover shadow effect
- `className`: string - Additional CSS classes

---

### Input Components

**Location:** `components/ui/Input.tsx`

**Usage:**
```tsx
import { Input, Textarea, Select } from "@/components/ui/Input";

// Text input
<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
/>

// Textarea
<Textarea
  label="Description"
  rows={4}
  placeholder="Enter description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>

// Select dropdown
<Select
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
>
  <option value="TODO">To Do</option>
  <option value="IN_PROGRESS">In Progress</option>
  <option value="DONE">Done</option>
</Select>
```

**Props:**
- `label`: string (optional) - Input label
- `error`: string (optional) - Error message
- All standard input/textarea/select HTML attributes

---

## 🎯 Layout Components

### Sidebar

**Location:** `components/layout/Sidebar.tsx`

**Features:**
- Dark theme (gray-900 background)
- Orange active state
- User info display
- Navigation links
- Logout button
- Responsive (hidden on mobile)

**Navigation Items:**
- Dashboard
- Projects
- Sections
- Tasks
- Reports

**Usage:** Automatically included in dashboard layout

---

### Header

**Location:** `components/layout/Header.tsx`

**Usage:**
```tsx
import { Header } from "@/components/layout/Header";

<Header title="Page Title">
  {/* Action buttons go here */}
  <Button>Action</Button>
</Header>
```

**Props:**
- `title`: string - Page title
- `children`: React.ReactNode - Action buttons or other elements

---

## 📄 Page Layouts

### 1. Login Page

**Route:** `/login`

**Features:**
- Centered login form
- Orange gradient background
- Demo credentials display
- Error handling
- NextAuth integration

**Key Elements:**
- Email input
- Password input
- Sign in button
- Demo credentials helper

---

### 2. Dashboard

**Route:** `/dashboard`

**Features:**
- Stats cards (4 metrics)
- Recent tasks list
- Weekly progress charts
- Quick stats overview

**Stats Displayed:**
- Total Projects
- Active Sections
- Tasks Completed
- Pending Tasks

---

### 3. Projects Page

**Route:** `/projects`

**Features:**
- Grid layout (responsive)
- Project cards with:
  - Project name and icon
  - Description
  - Deadline
  - Section count
  - Task count
  - Assigned team members
- Create new project button
- Empty state

**Card Layout:**
```
┌─────────────────────────┐
│ 📁 Project Name         │
│ Deadline: MM/DD/YYYY    │
│                         │
│ Description...          │
│                         │
│ 5 Sections | 23 Tasks   │
│                         │
│ Team: 👤👤👤 +2         │
└─────────────────────────┘
```

---

### 4. Sections Page

**Route:** `/sections`

**Features:**
- List view with cards
- Filter by project dropdown
- Progress bars
- Section details:
  - Name and description
  - Parent project
  - Deadline
  - Task count
  - Completion percentage
- Create section button

**Progress Bar:**
Shows visual completion percentage with green bar

---

### 5. Tasks Page (Kanban Board)

**Route:** `/tasks`

**Features:**
- 3-column kanban layout:
  - To Do
  - In Progress
  - Done
- Priority filter dropdown
- Task cards with:
  - Title
  - Description
  - Priority badge
  - Project/Section path
  - Deadline
  - Assigned users
- Drag and drop ready (structure in place)
- Create task button

**Column Colors:**
- To Do: Gray background
- In Progress: Orange background
- Done: Green background

---

### 6. Reports Page

**Route:** `/reports`

**Features:**
- Time period selector
- Overview stats (3 cards):
  - Total Tasks
  - Completion Rate
  - Overdue Tasks
- Weekly progress chart (bar visualization)
- Project completion table
- Team performance table

**Chart Types:**
- Stacked bar charts
- Progress bars
- Trend indicators

---

## 🎨 Tailwind CSS Utilities

### Custom Classes (in globals.css)

**Cards:**
```css
.card                  /* White card with shadow */
.card-hover           /* Card with hover effect */
```

**Buttons:**
```css
.btn                  /* Base button styles */
.btn-primary         /* Orange primary button */
.btn-secondary       /* Gray secondary button */
.btn-outline         /* Outline button */
.btn-danger          /* Red danger button */
.btn-sm              /* Small button */
.btn-lg              /* Large button */
```

**Inputs:**
```css
.input               /* Base input styles */
.input-error         /* Error state input */
```

**Badges:**
```css
.badge               /* Base badge */
.badge-primary       /* Orange badge */
.badge-success       /* Green badge */
.badge-warning       /* Yellow badge */
.badge-danger        /* Red badge */
.badge-gray          /* Gray badge */
```

**Tables:**
```css
.table               /* Base table styles */
.table thead         /* Table header */
.table th            /* Table header cell */
.table td            /* Table data cell */
```

**Scrollbar:**
```css
.scrollbar-thin      /* Thin custom scrollbar */
```

---

## 🎯 Responsive Design

### Breakpoints (Tailwind defaults)

- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px
- **2xl:** 1536px

### Responsive Patterns

**Sidebar:**
```tsx
{/* Hidden on mobile, visible on desktop */}
<div className="hidden lg:block">
  <Sidebar />
</div>
```

**Grid Layouts:**
```tsx
{/* 1 column mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Padding:**
```tsx
{/* Smaller padding on mobile, larger on desktop */}
<div className="p-4 lg:p-8">
```

---

## 🔧 Configuration Files

### Tailwind Config

**File:** `tailwind.config.ts`

**Key Customizations:**
- Orange primary color palette
- Custom shadows
- Custom border radius
- Animations (fade-in, slide-in)
- Inter font family

**Usage:**
```tsx
<div className="bg-primary-600">      {/* Orange background */}
<div className="text-primary-700">    {/* Darker orange text */}
<div className="shadow-lg">           {/* Custom shadow */}
```

---

### PostCSS Config

**File:** `postcss.config.mjs`

**Plugins:**
- Tailwind CSS
- Autoprefixer (for browser compatibility)

---

## 🎨 Color Usage Guide

### When to Use Each Color

**Primary (Orange):**
- Main action buttons
- Active navigation items
- Important badges
- Links and highlights

**Success (Green):**
- Completed tasks
- Success messages
- Positive metrics
- Completion indicators

**Warning (Yellow):**
- Medium priority
- Warnings
- Pending states

**Danger (Red):**
- High priority
- Delete actions
- Error states
- Overdue items

**Gray:**
- Low priority
- Inactive states
- Borders and dividers
- Secondary text

---

## 📱 Mobile Responsiveness

### Mobile Menu

Currently shows desktop sidebar on lg+ screens. For production, you might want to add:

```tsx
// Mobile sidebar (slide-out menu)
{mobileMenuOpen && (
  <div className="lg:hidden fixed inset-0 z-50">
    <div className="absolute inset-0 bg-gray-900/50" onClick={closeMobileMenu} />
    <div className="absolute left-0 top-0 bottom-0 w-64">
      <Sidebar />
    </div>
  </div>
)}
```

---

## 🎯 Best Practices

### Component Usage

1. **Always use reusable components** instead of inline styles
2. **Use Tailwind utilities** for spacing and layout
3. **Maintain consistent spacing** (use the design system)
4. **Follow color conventions** (orange for primary, etc.)

### Accessibility

1. **Always include labels** for inputs
2. **Use semantic HTML** (button, nav, main, etc.)
3. **Provide alt text** for images
4. **Maintain color contrast** (all colors pass WCAG AA)

### Performance

1. **Use client components** only when needed ("use client")
2. **Lazy load** images and heavy components
3. **Minimize bundle size** by importing only what you need

---

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Install Heroicons (for icons)
npm install @heroicons/react

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🎨 Customization

### Changing Primary Color

Edit `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    // Change these values to your color
    500: "#your-color",
    600: "#your-darker-color",
    // ...
  }
}
```

### Adding New Components

1. Create component in `components/ui/`
2. Export from component file
3. Import and use in pages

### Modifying Layout

Edit `components/layout/Sidebar.tsx` to:
- Add/remove navigation items
- Change branding
- Modify user info display

---

## 📚 Icon Library

Uses **Heroicons** (by Tailwind Labs):

```tsx
import {
  HomeIcon,           // Dashboard
  FolderIcon,         // Projects
  ListBulletIcon,     // Sections
  CheckCircleIcon,    // Tasks
  ChartBarIcon,       // Reports
  PlusIcon,           // Create actions
  CalendarIcon,       // Dates
  UserGroupIcon,      // Teams
} from "@heroicons/react/24/outline";

// Use solid variants for filled icons
import { HomeIcon } from "@heroicons/react/24/solid";
```

---

## 🎯 Next Steps

1. **Connect to API**: Replace mock data with actual API calls
2. **Add Forms**: Create modal forms for creating/editing
3. **Add Authentication**: Protect routes with middleware
4. **Add Notifications**: Toast messages for actions
5. **Add Drag & Drop**: Implement task kanban drag & drop
6. **Add Dark Mode**: Toggle between light/dark themes
7. **Add Mobile Menu**: Slide-out sidebar for mobile

---

## 📝 Notes

- All pages use mock data - replace with API calls
- Forms are not implemented - add modal components
- Drag & drop structure is in place but not functional
- Mobile sidebar needs implementation
- All components are TypeScript with proper typing

---

## 🆘 Support

For issues or questions:
1. Check component props and usage examples
2. Review Tailwind documentation
3. Check Next.js App Router documentation
4. Review Heroicons documentation
