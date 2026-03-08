// app/api/sections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasPermission } from "@/lib/permissions";
import { updateSectionSchema } from "@/lib/validations/schemas";

/**
 * GET /api/sections/[id]
 * Get a single section by ID
 * Permission: section:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const sectionId = params.id;

    const canRead = hasPermission("section", "read", session.user.permissions);

    if (!canRead) {
      return NextResponse.json(
        { error: "Forbidden: Missing section:read permission" },
        { status: 403 }
      );
    }

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
  } catch (error: any) {
    console.error("Get section error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const sectionId = params.id;

    const canUpdate = hasPermission(
      "section",
      "update",
      session.user.permissions
    );

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Forbidden: Missing section:update permission" },
        { status: 403 }
      );
    }

    // Check if section exists
    const existingSection = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateSectionSchema.safeParse(body);

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

    // Verify all assigned users exist if provided
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

    // Update section
    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(assignedUserIds && {
          assignments: {
            deleteMany: {},
            create: assignedUserIds.map((userId) => ({
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
  } catch (error: any) {
    console.error("Update section error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const sectionId = params.id;

    const canDelete = hasPermission(
      "section",
      "delete",
      session.user.permissions
    );

    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden: Missing section:delete permission" },
        { status: 403 }
      );
    }

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
  } catch (error: any) {
    console.error("Delete section error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
