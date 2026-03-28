import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

// Helper function to extract mentions
function extractMentions(content: string, users: any[]): string[] {
  const mentionPattern = /@(\w+(?:\s+\w+)*)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionPattern.exec(content)) !== null) {
    const mentionedName = match[1];
    const user = users.find(
      (u) => u.name.toLowerCase() === mentionedName.toLowerCase(),
    );
    if (user) {
      mentions.push(user.id);
    }
  }

  return mentions;
}

/**
 * GET /api/comments?taskId=xxx
 * List all comments for a task
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
      (assignment) => assignment.userId === session.user.id,
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
 * Create a new comment on a task with mention notifications
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, taskId } = body;

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

    // Check permission
    const hasCreatePermission = checkPermission(session, "comment", "create");
    const isAssignedToTask = task.assignments.some(
      (assignment) => assignment.userId === session.user.id,
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

    // Extract mentions and create notifications
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const mentionedUserIds = extractMentions(content, allUsers);

    // Create notifications for mentioned users
    if (mentionedUserIds.length > 0) {
      const notificationsToCreate = mentionedUserIds
        .filter((userId) => userId !== session.user.id) 
        .map((userId) => ({
          userId,
          type: "mention",
          title: "You were mentioned in a comment",
          message: `${session.user.name} mentioned you in a comment on "${task.title}"`,
          link: `/my-tasks`,
        }));

      if (notificationsToCreate.length > 0) {
        await prisma.notification.createMany({
          data: notificationsToCreate,
        });

        console.log(
          `Created ${notificationsToCreate.length} notifications for mentions`,
        );
      }
    }

    return NextResponse.json(
      {
        message: "Comment created successfully",
        comment,
        mentionsNotified: mentionedUserIds.filter(
          (id) => id !== session.user.id,
        ).length,
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
