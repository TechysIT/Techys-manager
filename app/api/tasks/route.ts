// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission, hasPermission } from "@/lib/permissions";
import {
  createTaskSchema,
  taskFiltersSchema,
} from "@/lib/validations/schemas";

/**
 * GET /api/tasks
 * List all tasks with pagination and filters
 * Permission: task:read
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("task", "read");

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const filters = taskFiltersSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      sectionId: searchParams.get("sectionId") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      assignedToMe: searchParams.get("assignedToMe") || undefined,
      search: searchParams.get("search") || undefined,
    });

    const {
      page,
      limit,
      sectionId,
      projectId,
      status,
      priority,
      assignedToMe,
      search,
    } = filters;
    const skip = (page - 1) * limit;

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

    if (assignedToMe) {
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
        skip,
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
          { deadline: "asc" },  // Earliest deadline first
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
  } catch (error: any) {
    console.error("Get tasks error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
    const session = await requirePermission("task", "create");

    // Parse and validate request body
    const body = await request.json();
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      status,
      priority,
      deadline,
      sectionId,
      assignedUserIds,
    } = validation.data;

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

    // Verify all assigned users exist
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

    // Create task with assignments
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        sectionId,
        assignments: assignedUserIds
          ? {
              create: assignedUserIds.map((userId) => ({
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
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create task error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
