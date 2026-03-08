// lib/validations/schemas.ts
import { z } from "zod";

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  description: z.string().optional(),
  deadline: z.string().datetime().optional().nullable(),
  assignedUserIds: z.array(z.string()).optional().default([]),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long").optional(),
  description: z.string().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  assignedUserIds: z.array(z.string()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================
// SECTION SCHEMAS
// ============================================

export const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").max(100, "Name too long"),
  description: z.string().optional(),
  deadline: z.string().datetime().optional().nullable(),
  projectId: z.string().min(1, "Project ID is required"),
  assignedUserIds: z.array(z.string()).optional().default([]),
});

export const updateSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").max(100, "Name too long").optional(),
  description: z.string().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  assignedUserIds: z.array(z.string()).optional(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// ============================================
// TASK SCHEMAS
// ============================================

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Title too long"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  deadline: z.string().datetime().optional().nullable(),
  sectionId: z.string().min(1, "Section ID is required"),
  assignedUserIds: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Title too long").optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  deadline: z.string().datetime().optional().nullable(),
  assignedUserIds: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ============================================
// COMMENT SCHEMA
// ============================================

export const createCommentSchema = z.object({
  message: z.string().min(1, "Comment message is required").max(1000, "Message too long"),
  taskId: z.string().min(1, "Task ID is required"),
});

export const updateCommentSchema = z.object({
  message: z.string().min(1, "Comment message is required").max(1000, "Message too long").optional(),
  isFixed: z.boolean().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const projectFiltersSchema = paginationSchema.extend({
  search: z.string().optional(),
  userId: z.string().optional(), // Filter by assigned user
});

export const sectionFiltersSchema = paginationSchema.extend({
  projectId: z.string().optional(),
  search: z.string().optional(),
});

export const taskFiltersSchema = paginationSchema.extend({
  sectionId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assignedToMe: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type ProjectFilters = z.infer<typeof projectFiltersSchema>;
export type SectionFilters = z.infer<typeof sectionFiltersSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
