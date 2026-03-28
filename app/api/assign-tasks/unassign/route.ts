import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * POST /api/assign-tasks/unassign
 * Bulk unassign tasks from a user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "task", "update")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to unassign tasks" },
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

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete task assignments
    const result = await prisma.taskAssignment.deleteMany({
      where: {
        userId: userId,
        taskId: { in: taskIds },
      },
    });

    return NextResponse.json({
      message: `Successfully unassigned ${result.count} task(s) from user`,
      unassignedCount: result.count,
    });
  } catch (error) {
    console.error("Unassign tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
