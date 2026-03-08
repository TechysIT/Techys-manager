# Task Manager Database Schema Design - Explanation

## Overview
This Prisma schema implements a complete Task Manager application with Role-Based Access Control (RBAC), supporting hierarchical project organization (Project → Section → Task) with flexible user assignments at each level.

---

## Core Design Decisions

### 1. **RBAC Implementation**

#### Three-Table Approach:
- **Role**: Stores role definitions (e.g., Admin, Manager, Developer)
- **Permission**: Stores granular permissions with resource + action pattern
- **RolePermission**: Many-to-many join table linking roles to permissions

#### Why This Design?
- **Dynamic Roles**: Roles can be created/modified at runtime without code changes
- **Granular Permissions**: Each permission specifies a `resource` (e.g., "project") and `action` (e.g., "delete")
- **Flexibility**: Easy to add new permissions or modify role capabilities
- **Performance**: Indexed foreign keys for fast permission checks

#### Permission Model:
```
resource + action = unique permission
Examples:
  - resource: "project", action: "create" → can create projects
  - resource: "task", action: "update" → can update tasks
  - resource: "user", action: "delete" → can delete users
```

---

### 2. **Hierarchical Structure**

```
Project (top-level container)
  ├── Section (sub-container)
  │     └── Task (work item)
  │           └── Comment (discussion)
```

#### Benefits:
- **Organizational Clarity**: Natural grouping of related work
- **Cascade Deletes**: When a project is deleted, all sections, tasks, and comments are automatically removed
- **Flexible Assignment**: Users can be assigned at any level (project-wide, section-specific, or individual tasks)

---

### 3. **Many-to-Many Relationships**

Created explicit join tables for all M:N relationships:

1. **RolePermission**: Role ↔ Permission
2. **ProjectAssignment**: User ↔ Project
3. **SectionAssignment**: User ↔ Section  
4. **TaskAssignment**: User ↔ Task

#### Why Explicit Join Tables?
- **Metadata Storage**: Can store `assignedAt` timestamp
- **Better Queries**: Easier to query "who is assigned to what"
- **Performance**: Can add indexes on join tables
- **Future-Proof**: Easy to add more fields (e.g., assignment role, percentage allocation)

---

### 4. **Enums for Type Safety**

#### TaskStatus:
```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}
```

#### TaskPriority:
```prisma
enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}
```

#### Benefits:
- **Type Safety**: Database enforces valid values
- **Performance**: Enums are stored efficiently in PostgreSQL
- **Self-Documenting**: Clear set of valid options
- **Easy Validation**: No need for application-level checks

---

### 5. **Indexing Strategy**

#### Primary Indexes:
- **Foreign Keys**: All foreign key columns are indexed for JOIN performance
- **Unique Constraints**: Email, role name, permission combinations
- **Frequently Queried Fields**: status, priority, deadline, isFixed

#### Composite Indexes:
- `@@unique([resource, action])` on Permission - prevents duplicate permissions
- `@@unique([userId, weekStart])` on WeeklyReport - one report per user per week

#### Benefits:
- **Query Performance**: Fast lookups on filtered/sorted queries
- **JOIN Optimization**: Foreign key indexes speed up relationships
- **Data Integrity**: Unique constraints prevent duplicates

---

### 6. **Cascade Delete Behavior**

```
Delete Project → Deletes Sections → Deletes Tasks → Deletes Comments
Delete User → Removes all assignments but preserves work items
```

#### OnDelete Strategies:
- **Cascade**: Used for ownership relationships (Project → Section → Task)
- **Cascade on Assignments**: Removing a user removes their assignments
- **Preserved History**: Comments remain even if user is deleted (shows user context)

---

### 7. **Weekly Report Design**

```prisma
model WeeklyReport {
  totalTasks         Int
  completedTasks     Int
  pendingTasks       Int
  overdueTasks       Int
  progressPercentage Float
  weekStart          DateTime
  weekEnd            DateTime
}
```

#### Design Choice: **Snapshot Model**
- Stores calculated metrics for historical tracking
- `@@unique([userId, weekStart])` ensures one report per week per user
- Can be generated via cron job or on-demand

#### Alternative (Not Implemented):
Could use database views to compute in real-time, but snapshots provide:
- **Historical Data**: Track performance trends over time
- **Performance**: Pre-computed rather than calculated on every request
- **Audit Trail**: Immutable record of weekly performance

---

## Field Explanations

### User Model
- **roleId**: Single role assignment (can be extended to multiple roles if needed)
- **isActive**: Soft delete flag - deactivate users without losing history
- **password**: Should be hashed before storage (bcrypt/argon2)

### Task Model
- **deadline**: Optional - not all tasks have deadlines
- **priority**: Defaults to MEDIUM - balanced starting point
- **status**: Defaults to TODO - new tasks start here

### Comment Model
- **isFixed**: Boolean flag to track if the comment/issue is resolved
- **Timestamps**: Track when comments are created/updated for audit

### Project & Section
- **deadline**: Optional deadlines for time-bound work
- **description**: Optional for flexible documentation

---

## Database Relationships Summary

| Model | Relation Type | Related Model | Cardinality |
|-------|--------------|---------------|-------------|
| User | Many-to-One | Role | N:1 |
| Role | Many-to-Many | Permission | N:M |
| User | Many-to-Many | Project | N:M |
| User | Many-to-Many | Section | N:M |
| User | Many-to-Many | Task | N:M |
| Project | One-to-Many | Section | 1:N |
| Section | One-to-Many | Task | 1:N |
| Task | One-to-Many | Comment | 1:N |
| Comment | Many-to-One | User | N:1 |
| Comment | Many-to-One | Task | N:1 |
| WeeklyReport | Many-to-One | User | N:1 |

---

## Migration & Usage

### Initial Setup:
```bash
# Install dependencies
npm install prisma @prisma/client

# Generate Prisma Client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Seed database (create default roles/permissions)
npx prisma db seed
```

### Recommended Seed Data:
```typescript
// Create default roles
await prisma.role.createMany({
  data: [
    { name: 'Admin', description: 'Full system access' },
    { name: 'Manager', description: 'Project management access' },
    { name: 'Developer', description: 'Task execution access' },
    { name: 'Viewer', description: 'Read-only access' }
  ]
});

// Create permissions
await prisma.permission.createMany({
  data: [
    { name: 'Create Projects', resource: 'project', action: 'create' },
    { name: 'Delete Tasks', resource: 'task', action: 'delete' },
    // ... more permissions
  ]
});
```

---

## Scalability Considerations

1. **Indexes**: All foreign keys and frequently queried fields are indexed
2. **Cascade Deletes**: Automatic cleanup prevents orphaned records
3. **Pagination**: Use cursor-based pagination on large result sets
4. **Soft Deletes**: `isActive` flag on User allows deactivation without data loss
5. **Report Snapshots**: Pre-computed weekly reports avoid expensive aggregations

---

## Security Considerations

1. **Password Hashing**: Hash passwords before storing (use bcrypt/argon2)
2. **Role Validation**: Always check user permissions before operations
3. **Cascade Protection**: Be cautious with cascade deletes on critical data
4. **Input Validation**: Validate all user inputs before database operations
5. **SQL Injection**: Prisma's type-safe queries prevent SQL injection

---

## Future Enhancements

1. **Audit Logs**: Add a separate audit table to track all changes
2. **File Attachments**: Add attachment model for task documents
3. **Tags/Labels**: Many-to-many relationship for categorization
4. **Task Dependencies**: Self-referential relationship for task ordering
5. **Notifications**: Add notification model for user alerts
6. **Multi-Role Support**: Allow users to have multiple roles simultaneously
7. **Time Tracking**: Add time entries for task work logging
8. **Custom Fields**: Dynamic fields per project/organization
