import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * GET /api/assign-tasks/available?userId=xxx
 * Get all projects with sections and tasks (excludes DONE tasks)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "task", "update")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to assign tasks" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 },
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all projects with sections and tasks (excluding DONE tasks)
    const projects = await prisma.project.findMany({
      include: {
        sections: {
          include: {
            tasks: {
              where: {
                status: {
                  in: ["TODO"],
                },
              },
              include: {
                assignments: {
                  select: {
                    userId: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to show assignment status
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      sections: project.sections.map((section) => ({
        id: section.id,
        name: section.name,
        tasks: section.tasks.map((task) => {
          const currentAssignment = task.assignments[0];
          return {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            isAssigned: currentAssignment?.userId === userId,
            assignedTo: currentAssignment ? currentAssignment.user.name : null,
          };
        }),
      })),
    }));

    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error("Get available tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
