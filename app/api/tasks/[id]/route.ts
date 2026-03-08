// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  hasPermission,
  isAssignedToTask,
} from "@/lib/permissions";
import { updateTaskSchema } from "@/lib/validations/schemas";
import { TaskStatus, TaskPriority } from "@prisma/client";

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 * Permission: task:read OR user is assigned to the task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const taskId = params.id;

    // Check if task exists first
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        section: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check permissions: user must have task:read OR be assigned to task
    const canReadAll = hasPermission("task", "read", session.user.permissions);
    const isAssigned = await isAssignedToTask(session.user.id, taskId);

    if (!canReadAll && !isAssigned) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You don't have permission to view this task or you're not assigned to it",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("Get task error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 * Permission Logic:
 * - task:update permission → Can update all fields
 * - Assigned to task (without task:update) → Can only update status and description
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const taskId = params.id;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        section: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check permissions
    const canUpdateAll = hasPermission(
      "task",
      "update",
      session.user.permissions
    );
    const isAssigned = await isAssignedToTask(session.user.id, taskId);

    if (!canUpdateAll && !isAssigned) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You don't have permission to update this task or you're not assigned to it",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { title, description, status, priority, deadline, assignedUserIds } =
      validation.data;

    // If user is only assigned (not admin), restrict what they can update
    if (!canUpdateAll && isAssigned) {
      // Assigned users can only update status and description
      if (title || priority || deadline || assignedUserIds) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Assigned users can only update status and description. Contact an admin to modify other fields.",
          },
          { status: 403 }
        );
      }
    }

    // Verify all assigned users exist if provided (only admins can reassign)
    if (assignedUserIds && assignedUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: assignedUserIds },
          isActive: true,
        },
      });

      if (users.length !== assignedUserIds.length) {
        return NextResponse.json(
          { error: "One or more assigned users not found or inactive" },
          { status: 400 }
        );
      }
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status: status as TaskStatus }),
        ...(priority !== undefined && { priority: priority as TaskPriority }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        // Only update assignments if user has full permissions
        ...(canUpdateAll &&
          assignedUserIds && {
            assignments: {
              deleteMany: {},
              create: assignedUserIds.map((userId) => ({
                userId,
              })),
            },
          }),
      },
      include: {
        section: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("Update task error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task (cascade deletes comments)
 * Permission: task:delete (only admins)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const taskId = params.id;

    // Only users with explicit delete permission can delete tasks
    const canDelete = hasPermission("task", "delete", session.user.permissions);

    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden: Missing task:delete permission" },
        { status: 403 }
      );
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Delete task (cascade deletes comments via schema)
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      message: "Task deleted successfully",
      deletedComments: task._count.comments,
    });
  } catch (error: any) {
    console.error("Delete task error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
