# CRUD APIs Documentation - Complete Guide

## Overview

This document provides comprehensive documentation for all CRUD API endpoints for the Task Manager application. All endpoints are protected with role-based access control (RBAC) and require proper authentication and permissions.

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Projects API](#projects-api)
3. [Sections API](#sections-api)
4. [Tasks API](#tasks-api)
5. [Comments API](#comments-api)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)

---

## 🔐 Authentication

All API endpoints require authentication via NextAuth session. Include credentials in your requests:

```javascript
// Client-side fetch with credentials
fetch('/api/projects', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Or use server-side with getServerSession
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
```

---

## 📁 Projects API

### Base URL: `/api/projects`

### 1. List All Projects

**GET** `/api/projects`

**Permission Required:** `project:read`

**Query Parameters:**
- `page` (number, optional, default: 1) - Page number for pagination
- `limit` (number, optional, default: 10, max: 100) - Items per page
- `search` (string, optional) - Search in project name and description
- `userId` (string, optional) - Filter projects assigned to specific user

**Response:**
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "Website Redesign",
      "description": "Complete redesign of company website",
      "deadline": "2024-12-31T23:59:59Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "sections": [
        {
          "id": "sec_456",
          "name": "Frontend",
          "_count": { "tasks": 5 }
        }
      ],
      "assignments": [
        {
          "userId": "user_789",
          "user": {
            "id": "user_789",
            "name": "John Doe",
            "email": "john@example.com"
          }
        }
      ],
      "_count": {
        "sections": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/projects?page=1&limit=10&search=website" \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 2. Get Single Project

**GET** `/api/projects/[id]`

**Permission Required:** `project:read`

**Response:**
```json
{
  "project": {
    "id": "proj_123",
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "deadline": "2024-12-31T23:59:59Z",
    "sections": [
      {
        "id": "sec_456",
        "name": "Frontend",
        "tasks": [
          {
            "id": "task_789",
            "title": "Design homepage",
            "status": "IN_PROGRESS",
            "priority": "HIGH",
            "deadline": "2024-06-15T00:00:00Z"
          }
        ],
        "assignments": [...]
      }
    ],
    "assignments": [...],
    "_count": { "sections": 3 }
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/projects/proj_123" \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 3. Create Project

**POST** `/api/projects`

**Permission Required:** `project:create`

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description (optional)",
  "deadline": "2024-12-31T23:59:59Z",  // Optional, ISO 8601 format
  "assignedUserIds": ["user_123", "user_456"]  // Optional
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Optional
- `deadline`: Optional, must be valid ISO 8601 datetime
- `assignedUserIds`: Optional array of user IDs (validates users exist and are active)

**Response:**
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "proj_new",
    "name": "New Project",
    "description": "Project description",
    "deadline": "2024-12-31T23:59:59Z",
    "assignments": [...],
    "_count": { "sections": 0 }
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Q4 Marketing Campaign',
    description: 'Holiday marketing initiatives',
    deadline: '2024-12-15T00:00:00Z',
    assignedUserIds: ['user_123', 'user_456']
  })
});
```

---

### 4. Update Project

**PATCH** `/api/projects/[id]`

**Permission Required:** `project:update`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "deadline": "2024-12-31T23:59:59Z",
  "assignedUserIds": ["user_789"]  // Replaces all existing assignments
}
```

**Response:**
```json
{
  "message": "Project updated successfully",
  "project": { ... }
}
```

**Example:**
```javascript
await fetch('/api/projects/proj_123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Updated Project Name',
    deadline: '2025-01-15T00:00:00Z'
  })
});
```

---

### 5. Delete Project

**DELETE** `/api/projects/[id]`

**Permission Required:** `project:delete`

**⚠️ Warning:** This will cascade delete:
- All sections in the project
- All tasks in those sections
- All comments on those tasks
- All assignments

**Response:**
```json
{
  "message": "Project deleted successfully",
  "deletedSections": 5
}
```

**Example:**
```javascript
await fetch('/api/projects/proj_123', {
  method: 'DELETE',
  credentials: 'include'
});
```

---

## 📂 Sections API

### Base URL: `/api/sections`

### 1. List All Sections

**GET** `/api/sections`

**Permission Required:** `section:read`

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 10)
- `projectId` (string, optional) - Filter sections by project
- `search` (string, optional) - Search in section name and description

**Response:**
```json
{
  "sections": [
    {
      "id": "sec_123",
      "name": "Backend Development",
      "description": "API and database work",
      "deadline": "2024-08-01T00:00:00Z",
      "projectId": "proj_456",
      "project": {
        "id": "proj_456",
        "name": "Website Redesign"
      },
      "tasks": [...],
      "assignments": [...],
      "_count": { "tasks": 8 }
    }
  ],
  "pagination": { ... }
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/sections?projectId=proj_123&page=1" \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 2. Get Single Section

**GET** `/api/sections/[id]`

**Permission Required:** `section:read`

**Response:** Includes full section details with all tasks, assignments, and project info.

---

### 3. Create Section

**POST** `/api/sections`

**Permission Required:** `section:create`

**Request Body:**
```json
{
  "name": "Frontend Development",
  "description": "UI and UX work (optional)",
  "deadline": "2024-09-01T00:00:00Z",  // Optional
  "projectId": "proj_123",  // Required - must be valid project ID
  "assignedUserIds": ["user_123"]  // Optional
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `projectId`: Required, must be valid existing project
- `assignedUserIds`: Optional, validates users exist and are active

**Response:**
```json
{
  "message": "Section created successfully",
  "section": { ... }
}
```

---

### 4. Update Section

**PATCH** `/api/sections/[id]`

**Permission Required:** `section:update`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Section Name",
  "description": "Updated description",
  "deadline": "2024-10-01T00:00:00Z",
  "assignedUserIds": ["user_456"]
}
```

---

### 5. Delete Section

**DELETE** `/api/sections/[id]`

**Permission Required:** `section:delete`

**⚠️ Warning:** Cascade deletes all tasks and comments in this section.

**Response:**
```json
{
  "message": "Section deleted successfully",
  "deletedTasks": 12
}
```

---

## ✅ Tasks API

### Base URL: `/api/tasks`

### 1. List All Tasks

**GET** `/api/tasks`

**Permission Required:** `task:read`

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 10)
- `sectionId` (string, optional) - Filter by section
- `projectId` (string, optional) - Filter by project
- `status` (enum, optional) - Filter by status: `TODO`, `IN_PROGRESS`, `DONE`
- `priority` (enum, optional) - Filter by priority: `LOW`, `MEDIUM`, `HIGH`
- `assignedToMe` (boolean, optional) - Filter tasks assigned to current user
- `search` (string, optional) - Search in title and description

**Sorting:** Tasks are sorted by:
1. Priority (HIGH → MEDIUM → LOW)
2. Deadline (earliest first)
3. Creation date (newest first)

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_123",
      "title": "Implement authentication",
      "description": "Set up NextAuth with RBAC",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "deadline": "2024-07-15T00:00:00Z",
      "sectionId": "sec_456",
      "section": {
        "id": "sec_456",
        "name": "Backend Development",
        "project": {
          "id": "proj_789",
          "name": "Website Redesign"
        }
      },
      "assignments": [
        {
          "userId": "user_123",
          "user": {
            "id": "user_123",
            "name": "Jane Developer",
            "email": "jane@example.com"
          }
        }
      ],
      "_count": { "comments": 3 }
    }
  ],
  "pagination": { ... }
}
```

**Example:**
```bash
# Get all high-priority tasks assigned to me
curl -X GET "http://localhost:3000/api/tasks?priority=HIGH&assignedToMe=true" \
  -H "Cookie: next-auth.session-token=xxx"

# Get all tasks in a specific section
curl -X GET "http://localhost:3000/api/tasks?sectionId=sec_123" \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 2. Get Single Task

**GET** `/api/tasks/[id]`

**Permission Required:** `task:read` OR user must be assigned to the task

**Special Logic:**
- Users with `task:read` permission can view any task
- Users WITHOUT the permission can only view tasks they're assigned to

**Response:** Includes full task details with comments, assignments, section, and project info.

---

### 3. Create Task

**POST** `/api/tasks`

**Permission Required:** `task:create`

**Request Body:**
```json
{
  "title": "Design homepage mockup",
  "description": "Create Figma design for new homepage (optional)",
  "status": "TODO",  // Optional, default: "TODO"
  "priority": "MEDIUM",  // Optional, default: "MEDIUM"
  "deadline": "2024-08-01T00:00:00Z",  // Optional
  "sectionId": "sec_123",  // Required - must be valid section ID
  "assignedUserIds": ["user_123", "user_456"]  // Optional
}
```

**Validation Rules:**
- `title`: Required, 1-200 characters
- `status`: Optional, must be `TODO`, `IN_PROGRESS`, or `DONE`
- `priority`: Optional, must be `LOW`, `MEDIUM`, or `HIGH`
- `sectionId`: Required, must be valid existing section
- `assignedUserIds`: Optional, validates users exist and are active

**Response:**
```json
{
  "message": "Task created successfully",
  "task": { ... }
}
```

**Example:**
```javascript
await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Write API documentation',
    description: 'Document all CRUD endpoints',
    status: 'TODO',
    priority: 'HIGH',
    deadline: '2024-07-20T00:00:00Z',
    sectionId: 'sec_backend',
    assignedUserIds: ['user_dev1']
  })
});
```

---

### 4. Update Task

**PATCH** `/api/tasks/[id]`

**Permission Required:** `task:update` OR user must be assigned to the task

**🔑 Special Permission Logic:**

**Users with `task:update` permission (Admins/Managers):**
- Can update ALL fields
- Can reassign tasks to other users
- Can change priority, deadline, title

**Users WITHOUT `task:update` but assigned to task (Developers):**
- Can ONLY update `status` and `description`
- Cannot change title, priority, deadline
- Cannot reassign task to others

**Request Body:** (all fields optional)
```json
{
  "title": "Updated task title",  // Admin only
  "description": "Updated description",  // Anyone assigned
  "status": "IN_PROGRESS",  // Anyone assigned
  "priority": "HIGH",  // Admin only
  "deadline": "2024-08-15T00:00:00Z",  // Admin only
  "assignedUserIds": ["user_789"]  // Admin only
}
```

**Response:**
```json
{
  "message": "Task updated successfully",
  "task": { ... }
}
```

**Example - Developer updating status:**
```javascript
// Developer (assigned to task) updates status
await fetch('/api/tasks/task_123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    status: 'DONE',
    description: 'Completed testing and deployment'
  })
});
```

**Example - Admin full update:**
```javascript
// Admin updates all fields
await fetch('/api/tasks/task_123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Updated title',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    deadline: '2024-09-01T00:00:00Z',
    assignedUserIds: ['user_new']
  })
});
```

---

### 5. Delete Task

**DELETE** `/api/tasks/[id]`

**Permission Required:** `task:delete` (Admin only)

**⚠️ Warning:** Cascade deletes all comments on this task.

**Response:**
```json
{
  "message": "Task deleted successfully",
  "deletedComments": 5
}
```

---

## 💬 Comments API

### Base URL: `/api/comments`

### 1. List Comments for Task

**GET** `/api/comments?taskId=xxx`

**Permission Required:** `comment:read` OR user assigned to task

**Query Parameters:**
- `taskId` (string, required) - The task ID to fetch comments for

**Response:**
```json
{
  "comments": [
    {
      "id": "comment_123",
      "message": "This looks great! Just a minor suggestion...",
      "isFixed": false,
      "taskId": "task_456",
      "userId": "user_789",
      "user": {
        "id": "user_789",
        "name": "John Manager",
        "email": "john@example.com"
      },
      "createdAt": "2024-06-10T14:30:00Z",
      "updatedAt": "2024-06-10T14:30:00Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/comments?taskId=task_123" \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 2. Create Comment

**POST** `/api/comments`

**Permission Required:** `comment:create` OR user assigned to task

**Request Body:**
```json
{
  "message": "I've completed the first draft. Please review.",
  "taskId": "task_123"
}
```

**Validation Rules:**
- `message`: Required, 1-1000 characters
- `taskId`: Required, must be valid existing task

**Response:**
```json
{
  "message": "Comment created successfully",
  "comment": {
    "id": "comment_new",
    "message": "I've completed the first draft. Please review.",
    "isFixed": false,
    "taskId": "task_123",
    "userId": "user_current",
    "user": { ... },
    "task": {
      "id": "task_123",
      "title": "Design homepage"
    }
  }
}
```

**Example:**
```javascript
await fetch('/api/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    message: 'Updated the design based on feedback',
    taskId: 'task_homepage'
  })
});
```

---

## ⚠️ Error Handling

All API endpoints follow consistent error handling:

### Error Response Format:
```json
{
  "error": "Error message",
  "details": [ /* Optional validation errors */ ]
}
```

### Common HTTP Status Codes:

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | GET request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation failed, invalid input |
| 401 | Unauthorized | Not authenticated, session expired |
| 403 | Forbidden | Authenticated but missing permission |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

### Example Error Responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden: Missing project:create permission"
}
```

**400 Validation Error:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["name"],
      "message": "Project name is required"
    },
    {
      "path": ["deadline"],
      "message": "Invalid date format"
    }
  ]
}
```

**404 Not Found:**
```json
{
  "error": "Project not found"
}
```

---

## 📝 Usage Examples

### Complete Workflow Example

```javascript
// 1. Create a project
const projectRes = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Mobile App Development',
    description: 'iOS and Android app',
    deadline: '2024-12-31T00:00:00Z',
    assignedUserIds: ['user_manager', 'user_dev1']
  })
});
const { project } = await projectRes.json();

// 2. Create sections in the project
const sectionRes = await fetch('/api/sections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'iOS Development',
    description: 'Native iOS app',
    projectId: project.id,
    assignedUserIds: ['user_dev1']
  })
});
const { section } = await sectionRes.json();

// 3. Create tasks in the section
const taskRes = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Set up React Native project',
    description: 'Initialize RN with TypeScript',
    status: 'TODO',
    priority: 'HIGH',
    sectionId: section.id,
    assignedUserIds: ['user_dev1']
  })
});
const { task } = await taskRes.json();

// 4. Developer updates task status
await fetch(`/api/tasks/${task.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    status: 'IN_PROGRESS'
  })
});

// 5. Add a comment
await fetch('/api/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    message: 'Started working on this. ETA: 2 days.',
    taskId: task.id
  })
});

// 6. Mark task as done
await fetch(`/api/tasks/${task.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    status: 'DONE'
  })
});
```

---

## 🔍 Advanced Filtering Examples

### Get overdue high-priority tasks assigned to me
```javascript
const today = new Date().toISOString();
const response = await fetch(
  `/api/tasks?priority=HIGH&assignedToMe=true&status=TODO`,
  { credentials: 'include' }
);
const { tasks } = await response.json();
const overdue = tasks.filter(task => 
  task.deadline && new Date(task.deadline) < new Date()
);
```

### Get all projects with search
```javascript
const response = await fetch(
  `/api/projects?search=marketing&page=1&limit=20`,
  { credentials: 'include' }
);
```

### Get tasks in a specific project
```javascript
const response = await fetch(
  `/api/tasks?projectId=proj_123&status=IN_PROGRESS`,
  { credentials: 'include' }
);
```

---

## 🎯 Permission Summary

| Endpoint | Required Permission | Alternative Access |
|----------|-------------------|-------------------|
| GET /api/projects | project:read | - |
| POST /api/projects | project:create | - |
| PATCH /api/projects/[id] | project:update | - |
| DELETE /api/projects/[id] | project:delete | - |
| GET /api/sections | section:read | - |
| POST /api/sections | section:create | - |
| PATCH /api/sections/[id] | section:update | - |
| DELETE /api/sections/[id] | section:delete | - |
| GET /api/tasks | task:read | - |
| GET /api/tasks/[id] | task:read | Assigned to task |
| POST /api/tasks | task:create | - |
| PATCH /api/tasks/[id] | task:update | Assigned (limited) |
| DELETE /api/tasks/[id] | task:delete | - |
| GET /api/comments | comment:read | Assigned to task |
| POST /api/comments | comment:create | Assigned to task |

---

## 🚀 Best Practices

1. **Always handle errors gracefully**
   ```javascript
   try {
     const res = await fetch('/api/projects');
     if (!res.ok) {
       const error = await res.json();
       console.error('API Error:', error);
       return;
     }
     const data = await res.json();
   } catch (error) {
     console.error('Network error:', error);
   }
   ```

2. **Use pagination for large datasets**
   - Default limit is 10, max is 100
   - Always check `pagination.totalPages` for navigation

3. **Validate on client before submitting**
   - Use the same Zod schemas on frontend
   - Provides better UX with instant feedback

4. **Cache project/section lists**
   - These change less frequently than tasks
   - Invalidate cache on create/update/delete

5. **Use optimistic updates for better UX**
   - Update UI immediately
   - Revert on API error

---

## 📞 Support

For issues or questions about the API:
1. Check this documentation first
2. Review validation schemas in `/lib/validations/schemas.ts`
3. Check permission system in `/lib/permissions.ts`
4. Review RBAC documentation in `RBAC_EXPLANATION.md`
