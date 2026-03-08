// app/(dashboard)/reports/page.tsx
"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

export default function ReportsPage() {
  // Mock data
  const weeklyData = [
    { week: "Week 1", completed: 12, pending: 8, overdue: 2 },
    { week: "Week 2", completed: 15, pending: 10, overdue: 1 },
    { week: "Week 3", completed: 18, pending: 7, overdue: 3 },
    { week: "Week 4", completed: 14, pending: 12, overdue: 2 },
  ];

  const projectStats = [
    { name: "Website Redesign", completion: 75, tasksCompleted: 18, totalTasks: 24 },
    { name: "Mobile App", completion: 45, tasksCompleted: 20, totalTasks: 45 },
    { name: "Marketing Campaign", completion: 88, tasksCompleted: 11, totalTasks: 12 },
  ];

  const teamPerformance = [
    { name: "John Doe", tasksCompleted: 45, onTime: 42, late: 3 },
    { name: "Jane Smith", tasksCompleted: 38, onTime: 35, late: 3 },
    { name: "Bob Wilson", tasksCompleted: 32, onTime: 30, late: 2 },
  ];

  return (
    <div>
      <Header title="Reports">
        <Select className="w-40">
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_quarter">This Quarter</option>
          <option value="this_year">This Year</option>
        </Select>
      </Header>

      <main className="p-6 lg:p-8 space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">84</p>
              <div className="flex items-center text-sm text-success-600">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span>12% from last month</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">68%</p>
              <div className="flex items-center text-sm text-success-600">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span>5% from last month</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">8</p>
              <div className="flex items-center text-sm text-danger-600">
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                <span>2 more than last month</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((week, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {week.week}
                    </span>
                    <span className="text-sm text-gray-500">
                      {week.completed + week.pending + week.overdue} tasks
                    </span>
                  </div>
                  <div className="flex h-8 w-full rounded-lg overflow-hidden">
                    <div
                      className="bg-success-500 flex items-center justify-center text-xs text-white"
                      style={{ width: `${(week.completed / 30) * 100}%` }}
                      title={`${week.completed} completed`}
                    >
                      {week.completed > 0 && week.completed}
                    </div>
                    <div
                      className="bg-primary-500 flex items-center justify-center text-xs text-white"
                      style={{ width: `${(week.pending / 30) * 100}%` }}
                      title={`${week.pending} pending`}
                    >
                      {week.pending > 0 && week.pending}
                    </div>
                    <div
                      className="bg-danger-500 flex items-center justify-center text-xs text-white"
                      style={{ width: `${(week.overdue / 30) * 100}%` }}
                      title={`${week.overdue} overdue`}
                    >
                      {week.overdue > 0 && week.overdue}
                    </div>
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 pt-4 border-t">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-success-500 rounded mr-2" />
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary-500 rounded mr-2" />
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-danger-500 rounded mr-2" />
                  <span className="text-sm text-gray-600">Overdue</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project & Team Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Project Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectStats.map((project) => (
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-700">Member</th>
                      <th className="text-right py-3 font-medium text-gray-700">Completed</th>
                      <th className="text-right py-3 font-medium text-gray-700">On Time</th>
                      <th className="text-right py-3 font-medium text-gray-700">Late</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformance.map((member) => (
                      <tr key={member.name} className="border-b border-gray-100">
                        <td className="py-3 font-medium text-gray-900">{member.name}</td>
                        <td className="text-right py-3 text-gray-700">{member.tasksCompleted}</td>
                        <td className="text-right py-3 text-success-600">{member.onTime}</td>
                        <td className="text-right py-3 text-danger-600">{member.late}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
