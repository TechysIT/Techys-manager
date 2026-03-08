"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface DashboardStats {
  totalProjects: number;
  myProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  myTasks: number;
  myCompletedTasks: number;
  overdueTasks: number;
  totalUsers: number;
  completionPercentage: number;
  myCompletionPercentage: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  section: {
    name: string;
    project: {
      name: string;
    };
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  _count: {
    sections: number;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      setStats(data.stats);
      setRecentTasks(data.recentTasks || []);
      setActiveProjects(data.activeProjects || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DONE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Projects */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Projects
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalProjects || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.myProjects || 0} assigned to you
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats?.todoTasks || 0) + (stats?.inProgressTasks || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.myTasks || 0} assigned to you
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.completedTasks || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.completionPercentage || 0}% completion rate
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalUsers || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.overdueTasks || 0} overdue tasks
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">
            Overall Progress
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">To Do</span>
                <span className="font-medium">{stats?.todoTasks || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full"
                  style={{
                    width: `${
                      stats?.totalTasks
                        ? ((stats.todoTasks / stats.totalTasks) * 100).toFixed(
                            0,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">In Progress</span>
                <span className="font-medium">
                  {stats?.inProgressTasks || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats?.totalTasks
                        ? (
                            (stats.inProgressTasks / stats.totalTasks) *
                            100
                          ).toFixed(0)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completed</span>
                <span className="font-medium">
                  {stats?.completedTasks || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats?.totalTasks
                        ? (
                            (stats.completedTasks / stats.totalTasks) *
                            100
                          ).toFixed(0)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">My Tasks</h3>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-primary-500 to-orange-500 mb-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold text-white">
                  {stats?.myCompletionPercentage || 0}%
                </span>
                <span className="text-xs text-white">Complete</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {stats?.myCompletedTasks || 0} of {stats?.myTasks || 0} tasks
              completed
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Tasks</span>
              <span className="text-lg font-bold text-gray-900">
                {stats?.totalTasks || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-600">Overdue</span>
              <span className="text-lg font-bold text-yellow-600">
                {stats?.overdueTasks || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="text-lg font-bold text-green-600">
                {stats?.completionPercentage || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Tasks
            </h3>
            <Link
              href="/tasks"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No tasks yet
              </p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {task.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {task.section.project.name} / {task.section.name}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Projects
            </h3>
            <Link
              href="/projects"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {activeProjects.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No active projects
              </p>
            ) : (
              activeProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {project.name}
                  </h4>
                  <p className="text-xs text-gray-500">{project.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {project._count.sections} sections
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
