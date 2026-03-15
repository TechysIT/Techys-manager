import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * GET /api/tasks
 * List all tasks with pagination and filters
 * Permission: task:read
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToMe = searchParams.get("assignedToMe");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: any = {};

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (projectId) {
      where.section = {
        projectId: projectId,
      };
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToMe === "true") {
      where.assignments = {
        some: {
          userId: session.user.id,
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch tasks with pagination
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
        orderBy: [
          { priority: "desc" }, // High priority first
          { deadline: "asc" }, // Earliest deadline first
          { createdAt: "desc" }, // Newest first
        ],
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task under a section
 * Permission: task:create
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "task", "create")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to create tasks" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      deadline,
      sectionId,
      assignedUserIds,
    } = body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 },
      );
    }

    if (!sectionId) {
      return NextResponse.json(
        { error: "Section ID is required" },
        { status: 400 },
      );
    }

    // Validate status if provided
    if (status && !["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be TODO, IN_PROGRESS, or DONE" },
        { status: 400 },
      );
    }

    // Validate priority if provided
    if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority. Must be LOW, MEDIUM, or HIGH" },
        { status: 400 },
      );
    }

    // Verify section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Verify all assigned users exist if provided
    if (assignedUserIds && assignedUserIds.length > 0) {
      const allUsers = await prisma.user.findMany({
        where: {
          id: { in: assignedUserIds },
        },
      });

      // Filter out suspended users
      const activeUsers = allUsers.filter((user) => !user.suspended);

      if (activeUsers.length !== assignedUserIds.length) {
        return NextResponse.json(
          { error: "One or more assigned users not found or are suspended" },
          { status: 400 },
        );
      }
    }

    // Create task with assignments
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        sectionId,
        assignments:
          assignedUserIds && assignedUserIds.length > 0
            ? {
                create: assignedUserIds.map((userId: string) => ({
                  userId,
                })),
              }
            : undefined,
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

    return NextResponse.json(
      {
        message: "Task created successfully",
        task,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
