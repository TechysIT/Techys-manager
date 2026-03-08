// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasPermission } from "@/lib/permissions";
import { updateProjectSchema } from "@/lib/validations/schemas";

/**
 * GET /api/projects/[id]
 * Get a single project by ID
 * Permission: project:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const projectId = params.id;

    // Check permission
    const canRead = hasPermission("project", "read", session.user.permissions);

    if (!canRead) {
      return NextResponse.json(
        { error: "Forbidden: Missing project:read permission" },
        { status: 403 }
      );
    }

    // Fetch project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sections: {
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                deadline: true,
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
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
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

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error("Get project error:", error);

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
 * PATCH /api/projects/[id]
 * Update a project
 * Permission: project:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const projectId = params.id;

    // Check permission
    const canUpdate = hasPermission(
      "project",
      "update",
      session.user.permissions
    );

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Forbidden: Missing project:update permission" },
        { status: 403 }
      );
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateProjectSchema.safeParse(body);

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

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        // Handle assignments update
        ...(assignedUserIds && {
          assignments: {
            deleteMany: {}, // Remove all existing assignments
            create: assignedUserIds.map((userId) => ({
              userId,
            })),
          },
        }),
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
        sections: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("Update project error:", error);

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
 * DELETE /api/projects/[id]
 * Delete a project (cascade deletes sections, tasks, comments)
 * Permission: project:delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const projectId = params.id;

    // Check permission
    const canDelete = hasPermission(
      "project",
      "delete",
      session.user.permissions
    );

    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden: Missing project:delete permission" },
        { status: 403 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete project (cascade deletes sections, tasks, comments via schema)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      message: "Project deleted successfully",
      deletedSections: project._count.sections,
    });
  } catch (error: any) {
    console.error("Delete project error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
