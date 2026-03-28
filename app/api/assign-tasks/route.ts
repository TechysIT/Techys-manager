import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * POST /api/assign-tasks
 * Assign tasks to a user (one user per task - removes existing assignments)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "task", "update")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to assign tasks" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, taskIds } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "taskIds array is required and must not be empty" },
        { status: 400 },
      );
    }

    // Verify user exists and is not suspended
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.suspended) {
      return NextResponse.json(
        { error: "Cannot assign tasks to a suspended user" },
        { status: 400 },
      );
    }

    // Verify all tasks exist
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
      },
    });

    if (tasks.length !== taskIds.length) {
      return NextResponse.json(
        { error: "One or more tasks not found" },
        { status: 404 },
      );
    }

    // For each task: delete all existing assignments, then create new one
    for (const taskId of taskIds) {
      // Delete all existing assignments for this task
      await prisma.taskAssignment.deleteMany({
        where: { taskId },
      });

      // Create new assignment
      await prisma.taskAssignment.create({
        data: {
          taskId,
          userId,
        },
      });
    }

    return NextResponse.json({
      message: `Successfully assigned ${taskIds.length} task(s) to ${user.name}`,
      assignedCount: taskIds.length,
    });
  } catch (error) {
    console.error("Assign tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
