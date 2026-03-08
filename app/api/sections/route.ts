// app/api/sections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission, hasPermission } from "@/lib/permissions";
import {
  createSectionSchema,
  sectionFiltersSchema,
} from "@/lib/validations/schemas";

/**
 * GET /api/sections
 * List all sections with pagination and filters
 * Permission: section:read
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("section", "read");

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const filters = sectionFiltersSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      projectId: searchParams.get("projectId") || undefined,
      search: searchParams.get("search") || undefined,
    });

    const { page, limit, projectId, search } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch sections with pagination
    const [sections, total] = await Promise.all([
      prisma.section.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
            orderBy: {
              createdAt: "desc",
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
              tasks: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.section.count({ where }),
    ]);

    return NextResponse.json({
      sections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get sections error:", error);

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
 * POST /api/sections
 * Create a new section under a project
 * Permission: section:create
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("section", "create");

    // Parse and validate request body
    const body = await request.json();
    const validation = createSectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, description, deadline, projectId, assignedUserIds } =
      validation.data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
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

    // Create section with assignments
    const section = await prisma.section.create({
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        projectId,
        assignments: assignedUserIds
          ? {
              create: assignedUserIds.map((userId) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
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
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Section created successfully",
        section,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create section error:", error);

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
