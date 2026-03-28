import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { TaskStatus, TaskPriority } from "@prisma/client";

// Helper function to check if user is assigned to a task
async function isUserAssignedToTask(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const assignment = await prisma.taskAssignment.findFirst({
    where: {
      taskId,
      userId,
    },
  });
  return !!assignment;
}

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 * Permission: task:read OR user is assigned to the task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Fetch task with all related data
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
    const hasReadPermission = checkPermission(session, "task", "read");
    const isAssigned = await isUserAssignedToTask(session.user.id, taskId);

    if (!hasReadPermission && !isAssigned) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to view this task" },
        { status: 403 },
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const hasUpdatePermission = checkPermission(session, "task", "update");
    const isAssigned = await isUserAssignedToTask(session.user.id, taskId);

    if (!hasUpdatePermission && !isAssigned) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to update this task" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, status, priority, deadline, assignedUserIds } =
      body;

    // If user is only assigned (not admin), restrict what they can update
    if (!hasUpdatePermission && isAssigned) {
      // Assigned users can only update status and description
      if (
        title !== undefined ||
        priority !== undefined ||
        deadline !== undefined ||
        assignedUserIds !== undefined
      ) {
        return NextResponse.json(
          {
            error:
              "Forbidden: You can only update status and description. Contact an admin to modify other fields.",
          },
          { status: 403 },
        );
      }
    }

    // Validate status if provided
    if (
      status !== undefined &&
      !["TODO", "IN_PROGRESS", "DONE"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid status. Must be TODO, IN_PROGRESS, or DONE" },
        { status: 400 },
      );
    }

    // Validate priority if provided
    if (
      priority !== undefined &&
      !["LOW", "MEDIUM", "HIGH"].includes(priority)
    ) {
      return NextResponse.json(
        { error: "Invalid priority. Must be LOW, MEDIUM, or HIGH" },
        { status: 400 },
      );
    }

    if (assignedUserIds && assignedUserIds.length > 0) {
      // Only allow ONE user assignment
      if (assignedUserIds.length > 1) {
        return NextResponse.json(
          { error: "A task can only be assigned to one user at a time" },
          { status: 400 },
        );
      }

      const allUsers = await prisma.user.findMany({
        where: {
          id: { in: assignedUserIds },
        },
      });

      // Filter out suspended users
      const activeUsers = allUsers.filter((user) => !user.suspended);

      if (activeUsers.length !== assignedUserIds.length) {
        return NextResponse.json(
          { error: "User not found or is suspended" },
          { status: 400 },
        );
      }
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(status !== undefined && { status: status as TaskStatus }),
        ...(priority !== undefined && { priority: priority as TaskPriority }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        // Only update assignments if user has full permissions
        ...(hasUpdatePermission &&
          assignedUserIds && {
            assignments: {
              deleteMany: {}, // Delete ALL existing assignments
              create: assignedUserIds.map((userId: string) => ({
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
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Only users with explicit delete permission can delete tasks
    if (!checkPermission(session, "task", "delete")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete tasks" },
        { status: 403 },
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
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
