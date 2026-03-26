import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * GET /api/comments?taskId=xxx
 * List all comments for a task
 * Permission: comment:read OR user is assigned to the task
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId query parameter is required" },
        { status: 400 },
      );
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check permission: either has comment:read OR is assigned to the task
    const hasReadPermission = checkPermission(session, "comment", "read");
    const isAssignedToTask = task.assignments.some(
      (assignment: { userId: string }) => assignment.userId === session.user.id,
    );

    if (!hasReadPermission && !isAssignedToTask) {
      return NextResponse.json(
        {
          error: "Forbidden: You don't have permission to view these comments",
        },
        { status: 403 },
      );
    }

    // Fetch comments for the task
    const comments = await prisma.comment.findMany({
      where: { taskId },
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
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/comments
 * Create a new comment on a task
 * Permission: comment:create OR user is assigned to the task
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { content, taskId } = body;

    // Validate required fields
    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 },
      );
    }

    // Verify task exists and get assignments
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check permission: either has comment:create OR is assigned to the task
    const hasCreatePermission = checkPermission(session, "comment", "create");
    const isAssignedToTask = task.assignments.some(
      (assignment: { userId: string }) => assignment.userId === session.user.id,
    );

    if (!hasCreatePermission && !isAssignedToTask) {
      return NextResponse.json(
        {
          error: "Forbidden: You don't have permission to comment on this task",
        },
        { status: 403 },
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Comment created successfully",
        comment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
