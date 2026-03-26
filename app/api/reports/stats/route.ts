import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all tasks
    const allTasks = await prisma.task.findMany({
      include: {
        section: {
          include: {
            project: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
      },
    });

    // Calculate overall stats
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "DONE").length;
    const pendingTasks = allTasks.filter((t) => t.status === "TODO").length;
    const inProgressTasks = allTasks.filter(
      (t) => t.status === "IN_PROGRESS",
    ).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = allTasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now && t.status !== "DONE",
    ).length;

    // Get weekly data (last 4 weeks)
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekTasks = allTasks.filter((t) => {
        const created = new Date(t.createdAt);
        return created >= weekStart && created < weekEnd;
      });
      type WeeklyDataItem = {
        week: string;
        completed: number;
        pending: number;
        overdue: number;
      };

      const weeklyData: WeeklyDataItem[] = [];
      weeklyData.push({
        week: `Week ${4 - i}`,
        completed: weekTasks.filter((t) => t.status === "DONE").length,
        pending: weekTasks.filter((t) => t.status === "TODO").length,
        overdue: weekTasks.filter(
          (t) =>
            t.deadline && new Date(t.deadline) < now && t.status !== "DONE",
        ).length,
      });
    }

    // Get project stats
    const projects = await prisma.project.findMany({
      include: {
        sections: {
          include: {
            tasks: true,
          },
        },
      },
    });

    const projectStats = projects
      .map((project) => {
        const tasks = project.sections.flatMap((s) => s.tasks);
        const totalTasks = tasks.length;
        const tasksCompleted = tasks.filter((t) => t.status === "DONE").length;
        const completion =
          totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

        return {
          name: project.name,
          completion,
          tasksCompleted,
          totalTasks,
        };
      })
      .filter((p) => p.totalTasks > 0); // Only show projects with tasks

    // Get team performance
    const users = await prisma.user.findMany({
      include: {
        taskAssignments: {
          include: {
            task: true,
          },
        },
      },
    });

    const teamPerformance = users
      .map((user) => {
        const userTasks = user.taskAssignments.map((a) => a.task);
        const tasksCompleted = userTasks.filter(
          (t) => t.status === "DONE",
        ).length;
        const onTime = userTasks.filter(
          (t) =>
            t.status === "DONE" &&
            (!t.deadline || new Date(t.updatedAt) <= new Date(t.deadline)),
        ).length;
        const late = tasksCompleted - onTime;

        return {
          name: user.name,
          tasksCompleted,
          onTime,
          late,
        };
      })
      .filter((u) => u.tasksCompleted > 0); // Only show users with completed tasks

    return NextResponse.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        completionRate,
        overdueTasks,
      },
      weeklyData,
      projectStats,
      teamPerformance,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
