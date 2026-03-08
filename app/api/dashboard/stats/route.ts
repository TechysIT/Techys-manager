import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total projects
    const totalProjects = await prisma.project.count();

    // Get my assigned projects
    const myProjects = await prisma.projectAssignment.count({
      where: { userId },
    });

    // Get all tasks
    const totalTasks = await prisma.task.count();

    // Get tasks by status
    const todoTasks = await prisma.task.count({
      where: { status: "TODO" },
    });

    const inProgressTasks = await prisma.task.count({
      where: { status: "IN_PROGRESS" },
    });

    const completedTasks = await prisma.task.count({
      where: { status: "DONE" },
    });

    // Get my assigned tasks
    const myTasks = await prisma.taskAssignment.count({
      where: { userId },
    });

    const myCompletedTasks = await prisma.task.count({
      where: {
        status: "DONE",
        assignments: {
          some: {
            userId,
          },
        },
      },
    });

    // Get overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        deadline: {
          lt: new Date(),
        },
        status: {
          not: "DONE",
        },
      },
    });

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get recent tasks (last 5)
    const recentTasks = await prisma.task.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        section: {
          include: {
            project: true,
          },
        },
      },
    });

    // Get active projects (with tasks)
    const activeProjects = await prisma.project.findMany({
      where: {
        sections: {
          some: {
            tasks: {
              some: {
                status: {
                  in: ["TODO", "IN_PROGRESS"],
                },
              },
            },
          },
        },
      },
      take: 5,
      include: {
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    // Calculate completion percentage
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const myCompletionPercentage =
      myTasks > 0 ? Math.round((myCompletedTasks / myTasks) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalProjects,
        myProjects,
        totalTasks,
        todoTasks,
        inProgressTasks,
        completedTasks,
        myTasks,
        myCompletedTasks,
        overdueTasks,
        totalUsers,
        completionPercentage,
        myCompletionPercentage,
      },
      recentTasks,
      activeProjects,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
