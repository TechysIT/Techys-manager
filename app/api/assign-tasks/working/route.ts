import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * GET /api/assign-tasks/working?userId=xxx
 * Get all IN_PROGRESS tasks for a specific user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "task", "read")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to view tasks" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
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

    // Fetch all IN_PROGRESS tasks assigned to this user
    const tasks = await prisma.task.findMany({
      where: {
        status: "IN_PROGRESS",
        assignments: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get working tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
