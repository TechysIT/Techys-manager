// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission, hasPermission } from "@/lib/permissions";
import {
  createProjectSchema,
  projectFiltersSchema,
} from "@/lib/validations/schemas";

/**
 * GET /api/projects
 * List all projects with pagination and filters
 * Permission: project:read
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and project:read permission
    const session = await requirePermission("project", "read");

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const filters = projectFiltersSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
      userId: searchParams.get("userId") || undefined,
    });

    const { page, limit, search, userId } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search filter (searches in name and description)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // User filter (only projects where user is assigned)
    if (userId) {
      where.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    // Fetch projects with pagination
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          sections: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  tasks: true,
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
              sections: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get projects error:", error);

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
 * POST /api/projects
 * Create a new project
 * Permission: project:create
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication and project:create permission
    const session = await requirePermission("project", "create");

    // Parse and validate request body
    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, description, deadline, assignedUserIds } = validation.data;

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

    // Create project with assignments
    const project = await prisma.project.create({
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        assignments: assignedUserIds
          ? {
              create: assignedUserIds.map((userId) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
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
            sections: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Project created successfully",
        project,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create project error:", error);

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
