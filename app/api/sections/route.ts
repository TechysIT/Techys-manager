import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * GET /api/sections
 * List all sections with optional filters
 * Permission: section:read
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "section", "read")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to view sections" },
        { status: 403 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

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

    // Fetch sections
    const [sections, total] = await Promise.all([
      prisma.section.findMany({
        where,
        skip: (page - 1) * limit,
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
          createdAt: "desc",
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
  } catch (error) {
    console.error("Get sections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "section", "create")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to create sections" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, deadline, projectId, assignedUserIds } = body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Section name is required" },
        { status: 400 },
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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

    // Create section with assignments
    const section = await prisma.section.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        projectId,
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
      { status: 201 },
    );
  } catch (error) {
    console.error("Create section error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
