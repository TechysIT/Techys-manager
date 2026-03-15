"use client";

import { useState, useEffect } from "react";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

interface ReportStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
  overdueTasks: number;
}

interface WeeklyData {
  week: string;
  completed: number;
  pending: number;
  overdue: number;
}

interface ProjectStat {
  name: string;
  completion: number;
  tasksCompleted: number;
  totalTasks: number;
}

interface TeamMember {
  name: string;
  tasksCompleted: number;
  onTime: number;
  late: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/stats");
      const data = await res.json();

      setStats(data.stats);
      setWeeklyData(data.weeklyData || []);
      setProjectStats(data.projectStats || []);
      setTeamPerformance(data.teamPerformance || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Analytics and performance metrics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.totalTasks || 0}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span>
                {stats?.completedTasks || 0} completed,{" "}
                {stats?.inProgressTasks || 0} in progress
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Completion Rate
              </p>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.completionRate || 0}%
            </p>
            <div className="flex items-center text-sm text-green-600">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              <span>{stats?.completedTasks || 0} tasks done</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.overdueTasks || 0}
            </p>
            <div className="flex items-center text-sm text-red-600">
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              <span>Needs attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Weekly Progress
        </h2>
        <div className="space-y-4">
          {weeklyData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No weekly data available
            </p>
          ) : (
            weeklyData.map((week, index) => {
              const total = week.completed + week.pending + week.overdue;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {week.week}
                    </span>
                    <span className="text-sm text-gray-500">{total} tasks</span>
                  </div>
                  <div className="flex h-8 w-full rounded-lg overflow-hidden bg-gray-200">
                    {week.completed > 0 && (
                      <div
                        className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{
                          width: `${(week.completed / Math.max(total, 1)) * 100}%`,
                        }}
                        title={`${week.completed} completed`}
                      >
                        {week.completed}
                      </div>
                    )}
                    {week.pending > 0 && (
                      <div
                        className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{
                          width: `${(week.pending / Math.max(total, 1)) * 100}%`,
                        }}
                        title={`${week.pending} pending`}
                      >
                        {week.pending}
                      </div>
                    )}
                    {week.overdue > 0 && (
                      <div
                        className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{
                          width: `${(week.overdue / Math.max(total, 1)) * 100}%`,
                        }}
                        title={`${week.overdue} overdue`}
                      >
                        {week.overdue}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Legend */}
          {weeklyData.length > 0 && (
            <div className="flex items-center justify-center space-x-6 pt-4 border-t">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2" />
                <span className="text-sm text-gray-600">Overdue</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project & Team Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Completion */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Project Completion
          </h2>
          <div className="space-y-4">
            {projectStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No project data available
              </p>
            ) : (
              projectStats.map((project) => (
                <div key={project.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {project.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {project.tasksCompleted}/{project.totalTasks}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all"
                      style={{ width: `${project.completion}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {project.completion}% complete
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Team Performance
          </h2>
          <div className="overflow-x-auto">
            {teamPerformance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No team data available
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-700">
                      Member
                    </th>
                    <th className="text-right py-3 font-medium text-gray-700">
                      Completed
                    </th>
                    <th className="text-right py-3 font-medium text-gray-700">
                      On Time
                    </th>
                    <th className="text-right py-3 font-medium text-gray-700">
                      Late
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((member) => (
                    <tr key={member.name} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-900">
                        {member.name}
                      </td>
                      <td className="text-right py-3 text-gray-700">
                        {member.tasksCompleted}
                      </td>
                      <td className="text-right py-3 text-green-600">
                        {member.onTime}
                      </td>
                      <td className="text-right py-3 text-red-600">
                        {member.late}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
