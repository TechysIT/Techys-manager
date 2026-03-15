import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * GET /api/sections/[id]
 * Get a single section by ID
 * Permission: section:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const sectionId = params.id;

    // Fetch section with all related data
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        tasks: {
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
                comments: true,
              },
            },
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
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error("Get section error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/sections/[id]
 * Update a section
 * Permission: section:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "section", "update")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to update sections" },
        { status: 403 },
      );
    }

    const sectionId = params.id;

    // Check if section exists
    const existingSection = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, deadline, assignedUserIds } = body;

    // Validate name if provided
    if (name !== undefined && (!name || name.trim() === "")) {
      return NextResponse.json(
        { error: "Section name cannot be empty" },
        { status: 400 },
      );
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

    // Update section
    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(assignedUserIds && {
          assignments: {
            deleteMany: {},
            create: assignedUserIds.map((userId: string) => ({
              userId,
            })),
          },
        }),
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
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Section updated successfully",
      section: updatedSection,
    });
  } catch (error) {
    console.error("Update section error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/sections/[id]
 * Delete a section (cascade deletes tasks and comments)
 * Permission: section:delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "section", "delete")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete sections" },
        { status: 403 },
      );
    }

    const sectionId = params.id;

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Delete section (cascade deletes tasks and comments via schema)
    await prisma.section.delete({
      where: { id: sectionId },
    });

    return NextResponse.json({
      message: "Section deleted successfully",
      deletedTasks: section._count.tasks,
    });
  } catch (error) {
    console.error("Delete section error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
