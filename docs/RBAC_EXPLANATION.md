# Role-Based Access Control (RBAC) System - Complete Guide

## Overview

This RBAC system implements a flexible, dynamic permission-based access control mechanism for the Task Manager application. It uses NextAuth for authentication and a custom permission system built on top of the Prisma database schema.

---

## Architecture

### 1. Authentication Flow

```
User Login → NextAuth Credentials Provider → Database Verification → JWT Token Generation
                                                ↓
                                    Include Role + Permissions in Token
                                                ↓
                                        Store in Session
```

### 2. Permission Storage

Permissions are stored in the **JWT token** for performance:
- **Advantage**: Fast permission checks (no database query on every request)
- **Trade-off**: Must refresh session when roles/permissions change
- **Token includes**:
  - User ID, email, name
  - Role ID and role name
  - Full array of permissions (resource + action)

---

## Core Components

### 1. **Authentication Configuration** (`lib/auth.ts`)

#### Key Features:
- Uses NextAuth with Prisma adapter
- Credentials-based authentication (email + password)
- JWT session strategy
- Password hashing with bcrypt

#### Authentication Process:
```typescript
1. User submits credentials
2. System fetches user with role and permissions from database
3. Verifies password with bcrypt
4. Creates JWT token with user data + permissions
5. Returns session to client
```

#### Session Structure:
```typescript
{
  user: {
    id: string,
    email: string,
    name: string,
    roleId: string,
    roleName: string,
    permissions: [
      { id, name, resource, action },
      ...
    ]
  }
}
```

---

### 2. **Permission System** (`lib/permissions.ts`)

#### Core Functions:

##### A. Basic Permission Checks
```typescript
// Check single permission
hasPermission("project", "create", userPermissions)
// Returns: true if user has project:create permission

// Check any of multiple permissions (OR logic)
hasAnyPermission(
  [["project", "create"], ["project", "update"]],
  userPermissions
)

// Check all permissions required (AND logic)
hasAllPermissions(
  [["project", "read"], ["task", "read"]],
  userPermissions
)
```

##### B. Role-Based Checks
```typescript
// Check specific role
hasRole("Admin", userRoleName)

// Check any of multiple roles
hasAnyRole(["Admin", "Manager"], userRoleName)

// Role hierarchy check
hasHigherOrEqualRole("Manager", "Developer") // true
```

##### C. Server-Side Guards
```typescript
// Require authentication (throws if not logged in)
const session = await requireAuth()

// Require specific permission (throws if missing)
const session = await requirePermission("project", "delete")

// Require specific role (throws if wrong role)
const session = await requireRole("Admin")
```

##### D. Resource-Level Access Control
```typescript
// Check if user is assigned to a task
const canAccess = await isAssignedToTask(userId, taskId)

// Check if user is assigned to a project
const canAccess = await isAssignedToProject(userId, projectId)

// Combined check: permission OR assignment
const canEdit = await canAccessTask(userId, taskId, permissions)
```

---

### 3. **Middleware** (`middleware.ts`)

#### Purpose:
Protects routes at the **Next.js middleware level** before they even reach your page/API route.

#### Features:
- Runs on **every request** (except static files)
- Checks authentication status
- Performs route-based permission checks
- Redirects unauthorized users

#### Route Protection Examples:

```typescript
// Admin-only routes
if (path.startsWith("/admin")) {
  if (token.roleName !== "Admin") {
    redirect to /unauthorized
  }
}

// Permission-based routes
if (path.startsWith("/projects")) {
  if (!hasPermission("project", "read")) {
    redirect to /unauthorized
  }
}
```

#### Configuration:
```typescript
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)"
]
```
This protects all routes except:
- Next.js static files
- Images
- Public assets
- Auth endpoints (login, register)

---

### 4. **Protected API Routes**

#### Pattern 1: Simple Permission Check
```typescript
// GET /api/projects
export async function GET() {
  // Require project:read permission
  const session = await requirePermission("project", "read")
  
  // Fetch and return data
  const projects = await prisma.project.findMany()
  return NextResponse.json({ projects })
}
```

#### Pattern 2: Permission OR Assignment
```typescript
// GET /api/tasks/[id]
export async function GET(req, { params }) {
  const session = await requireAuth()
  
  // Check if user has task:read OR is assigned to task
  const canRead = hasPermission("task", "read", session.user.permissions)
  const isAssigned = await isAssignedToTask(session.user.id, params.id)
  
  if (!canRead && !isAssigned) {
    return error(403)
  }
  
  // User can access task
  const task = await prisma.task.findUnique(...)
  return NextResponse.json({ task })
}
```

#### Pattern 3: Different Permissions for Different Actions
```typescript
// PATCH /api/tasks/[id]
export async function PATCH(req, { params }) {
  const session = await requireAuth()
  const canUpdateAll = hasPermission("task", "update", session.user.permissions)
  const isAssigned = await isAssignedToTask(session.user.id, params.id)
  
  // Assigned users can only update status
  if (isAssigned && !canUpdateAll) {
    // Restrict fields they can update
    if (body.assignedUserIds || body.priority) {
      return error(403, "Can only update status")
    }
  }
  
  // Full update for admins
  await prisma.task.update(...)
}
```

---

## Permission Model

### Resource + Action Pattern

Each permission is defined by:
- **Resource**: The entity type (e.g., "project", "task", "user")
- **Action**: The operation (e.g., "create", "read", "update", "delete")

### Example Permissions:

| Permission | Resource | Action | Description |
|------------|----------|--------|-------------|
| `project:create` | project | create | Can create new projects |
| `project:read` | project | read | Can view projects |
| `project:update` | project | update | Can edit projects |
| `project:delete` | project | delete | Can delete projects |
| `task:read` | task | read | Can view tasks |
| `task:update` | task | update | Can edit tasks |
| `user:admin` | user | admin | Full user management |

### Role Examples:

#### Admin Role:
```
Permissions:
- project:* (all actions)
- task:* (all actions)
- user:* (all actions)
- section:* (all actions)
- comment:* (all actions)
```

#### Manager Role:
```
Permissions:
- project:read, project:create, project:update
- task:read, task:create, task:update
- section:read, section:create, section:update
- user:read
- comment:read, comment:create
```

#### Developer Role:
```
Permissions:
- project:read
- task:read, task:update (only assigned tasks)
- section:read
- comment:read, comment:create, comment:update
```

#### Viewer Role:
```
Permissions:
- project:read
- task:read
- section:read
- comment:read
```

---

## Access Control Levels

### Level 1: Route-Level (Middleware)
- Protects entire sections of the app
- Example: `/admin/*` only for Admin role
- Fast, runs before page loads

### Level 2: API-Level (Permission Guards)
- Protects specific API operations
- Example: `requirePermission("project", "create")`
- Granular control per endpoint

### Level 3: Resource-Level (Assignment Checks)
- Protects individual resources
- Example: User can only edit tasks they're assigned to
- Most granular, database queries required

### Level 4: Field-Level (Business Logic)
- Controls which fields can be modified
- Example: Assigned users can update status but not reassign tasks
- Implemented in route handlers

---

## Implementation Workflow

### Setting Up RBAC

#### 1. **Database Seeding**
Create default roles and permissions:

```typescript
// prisma/seed.ts
async function main() {
  // Create roles
  const adminRole = await prisma.role.create({
    data: { name: "Admin", description: "Full system access" }
  })
  
  const viewerRole = await prisma.role.create({
    data: { name: "Viewer", description: "Read-only access" }
  })
  
  // Create permissions
  const permissions = await prisma.permission.createMany({
    data: [
      { name: "Create Projects", resource: "project", action: "create" },
      { name: "Read Projects", resource: "project", action: "read" },
      { name: "Update Projects", resource: "project", action: "update" },
      { name: "Delete Projects", resource: "project", action: "delete" },
      // ... more permissions
    ]
  })
  
  // Assign permissions to Admin role
  const allPermissions = await prisma.permission.findMany()
  await prisma.rolePermission.createMany({
    data: allPermissions.map(p => ({
      roleId: adminRole.id,
      permissionId: p.id
    }))
  })
}
```

#### 2. **User Registration**
Default users to "Viewer" role:

```typescript
// In registration endpoint
const defaultRole = await prisma.role.findUnique({
  where: { name: "Viewer" }
})

const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    name,
    roleId: defaultRole.id
  }
})
```

#### 3. **Session Management**
Refresh permissions after role change:

```typescript
// In admin panel when updating user role
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Update user role
await prisma.user.update({
  where: { id: userId },
  data: { roleId: newRoleId }
})

// Trigger session refresh for that user
// User must log out and log back in, OR use session update
```

---

## Security Best Practices

### 1. **Password Security**
- Hash with bcrypt (12 rounds minimum)
- Never store plain text passwords
- Never return passwords in API responses

### 2. **Token Security**
- JWT tokens expire (configure in NextAuth)
- Store permissions in token for performance
- Refresh session when permissions change

### 3. **Permission Checks**
- Always check permissions in API routes
- Don't rely only on middleware (can be bypassed)
- Implement both permission AND assignment checks

### 4. **Error Messages**
- Don't expose sensitive info in errors
- Generic "Forbidden" for permission errors
- Log detailed errors server-side only

### 5. **Database Security**
- Use Prisma's parameterized queries (SQL injection protection)
- Validate all inputs with Zod
- Implement rate limiting on auth endpoints

---

## Common Patterns

### Pattern 1: Admin Override
```typescript
// Admins can always access, others need assignment
const isAdmin = hasRole("Admin", session.user.roleName)
const isAssigned = await isAssignedToTask(session.user.id, taskId)

if (!isAdmin && !isAssigned) {
  return error(403)
}
```

### Pattern 2: Cascading Permissions
```typescript
// If user has project access, they get section access
const canAccessProject = await isAssignedToProject(userId, projectId)
const canAccessSection = canAccessProject || await isAssignedToSection(userId, sectionId)
```

### Pattern 3: Conditional Fields
```typescript
// Different users see different fields
const task = await prisma.task.findUnique({
  include: {
    // Everyone sees basic info
    section: true,
    
    // Only admins see assignments
    ...(isAdmin && { assignments: true }),
    
    // Only assigned users see private notes
    ...(isAssigned && { privateNotes: true })
  }
})
```

---

## Environment Setup

### Required Packages:
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "next-auth": "^4.24.0",
    "@auth/prisma-adapter": "^1.0.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^5.0.0"
  }
}
```

### Environment Variables:
```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Testing RBAC

### 1. **Unit Tests for Permission Functions**
```typescript
describe("hasPermission", () => {
  it("should return true for valid permission", () => {
    const permissions = [
      { resource: "project", action: "create" }
    ]
    expect(hasPermission("project", "create", permissions)).toBe(true)
  })
  
  it("should return false for missing permission", () => {
    const permissions = []
    expect(hasPermission("project", "delete", permissions)).toBe(false)
  })
})
```

### 2. **Integration Tests for API Routes**
```typescript
describe("POST /api/projects", () => {
  it("should allow users with project:create permission", async () => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { Cookie: adminSessionCookie },
      body: JSON.stringify({ name: "Test Project" })
    })
    expect(response.status).toBe(201)
  })
  
  it("should reject users without permission", async () => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { Cookie: viewerSessionCookie },
      body: JSON.stringify({ name: "Test Project" })
    })
    expect(response.status).toBe(403)
  })
})
```

---

## Troubleshooting

### Issue 1: "Unauthorized" on Protected Routes
**Solution**: Check that NextAuth session is properly configured and token is being stored.

### Issue 2: Permissions Not Updating After Role Change
**Solution**: User must log out and log back in, or trigger session update:
```typescript
import { useSession } from "next-auth/react"
const { update } = useSession()
await update() // Refreshes session from database
```

### Issue 3: Middleware Redirect Loop
**Solution**: Ensure public routes (login, register) are excluded from middleware matcher.

### Issue 4: "Permission Denied" for Assigned Users
**Solution**: Implement combined permission OR assignment checks, not just permission checks.

---

## Future Enhancements

1. **Permission Caching**: Cache permission checks in Redis for even faster lookups
2. **Dynamic Permissions**: Allow creating custom permissions via admin UI
3. **Permission Groups**: Group related permissions for easier role management
4. **Audit Logging**: Track all permission checks and access attempts
5. **Time-Based Permissions**: Permissions that expire after a certain time
6. **Context-Based Permissions**: Permissions that depend on resource state (e.g., can only edit draft projects)

---

## Summary

This RBAC system provides:
- ✅ Flexible, dynamic role and permission management
- ✅ Multiple layers of access control (route, API, resource, field)
- ✅ Performance optimization with JWT-based permission storage
- ✅ Granular control with resource + action pattern
- ✅ Support for both permission-based and assignment-based access
- ✅ Type-safe implementation with TypeScript and Zod
- ✅ Security best practices (password hashing, input validation, error handling)

The system can be extended and customized based on specific business requirements while maintaining security and performance.
