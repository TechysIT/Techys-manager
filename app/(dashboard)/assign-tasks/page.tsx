"use client";

import { useState, useEffect } from "react";
import { UserIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: {
    name: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  isAssigned: boolean;
  assignedTo: string | null;
}

interface WorkingTask {
  id: string;
  title: string;
  priority: string;
  deadline: string | null;
  section: {
    name: string;
    project: {
      name: string;
    };
  };
}

interface Section {
  id: string;
  name: string;
  tasks: Task[];
}

interface Project {
  id: string;
  name: string;
  sections: Section[];
}

export default function AssignTasksPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showWorkingModal, setShowWorkingModal] = useState(false);
  const [workingTasks, setWorkingTasks] = useState<WorkingTask[]>([]);
  const [selectedToAssign, setSelectedToAssign] = useState<Set<string>>(
    new Set(),
  );
  const [selectedToUnassign, setSelectedToUnassign] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [searchTask, setSearchTask] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Network Error", { description: "Failed to fetch users" });
    } finally {
      setFetching(false);
    }
  };

  const fetchProjectsAndTasks = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assign-tasks/available?userId=${userId}`);
      const data = await res.json();

      if (res.ok) {
        setProjects(data.projects || []);
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Network Error", { description: "Failed to fetch tasks" });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkingTasks = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assign-tasks/working?userId=${userId}`);
      const data = await res.json();

      if (res.ok) {
        setWorkingTasks(data.tasks || []);
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error fetching working tasks:", error);
      toast.error("Network Error", {
        description: "Failed to fetch working tasks",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async (user: User) => {
    setSelectedUser(user);
    setSelectedToAssign(new Set());
    setSelectedToUnassign(new Set());
    setShowAssignModal(true);
    await fetchProjectsAndTasks(user.id);
  };

  const openWorkingModal = async (user: User) => {
    setSelectedUser(user);
    setShowWorkingModal(true);
    await fetchWorkingTasks(user.id);
  };

  const toggleTaskToAssign = (taskId: string) => {
    const newSelected = new Set(selectedToAssign);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedToAssign(newSelected);
  };

  const toggleTaskToUnassign = (taskId: string) => {
    const newSelected = new Set(selectedToUnassign);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedToUnassign(newSelected);
  };

  const toggleSectionToAssign = (section: Section) => {
    const newSelected = new Set(selectedToAssign);
    const unassignedTasks = section.tasks.filter(
      (t) => !t.isAssigned && t.status !== "DONE",
    );

    const allSelected = unassignedTasks.every((t) => newSelected.has(t.id));

    if (allSelected) {
      unassignedTasks.forEach((task) => newSelected.delete(task.id));
    } else {
      unassignedTasks.forEach((task) => newSelected.add(task.id));
    }

    setSelectedToAssign(newSelected);
  };

  const toggleSectionToUnassign = (section: Section) => {
    const newSelected = new Set(selectedToUnassign);
    const assignedTasks = section.tasks.filter(
      (t) => t.isAssigned && t.status !== "DONE",
    );

    const allSelected = assignedTasks.every((t) => newSelected.has(t.id));

    if (allSelected) {
      assignedTasks.forEach((task) => newSelected.delete(task.id));
    } else {
      assignedTasks.forEach((task) => newSelected.add(task.id));
    }

    setSelectedToUnassign(newSelected);
  };

  const handleAssign = async () => {
    if (!selectedUser || selectedToAssign.size === 0) {
      toast.warning("No Tasks Selected", {
        description: "Please select at least one task to assign",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/assign-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          taskIds: Array.from(selectedToAssign),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Assigned ${selectedToAssign.size} task(s) to ${selectedUser.name}`,
        });
        setSelectedToAssign(new Set());
        await fetchProjectsAndTasks(selectedUser.id);
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description: data.error,
        });
      } else {
        toast.error("Error", {
          description: data.error || "Failed to assign tasks",
        });
      }
    } catch (error) {
      console.error("Error assigning tasks:", error);
      toast.error("Network Error", {
        description: "Failed to assign tasks",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!selectedUser || selectedToUnassign.size === 0) {
      toast.warning("No Tasks Selected", {
        description: "Please select at least one task to unassign",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/assign-tasks/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          taskIds: Array.from(selectedToUnassign),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Unassigned ${selectedToUnassign.size} task(s) from ${selectedUser.name}`,
        });
        setSelectedToUnassign(new Set());
        await fetchProjectsAndTasks(selectedUser.id);
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description: data.error,
        });
      } else {
        toast.error("Error", {
          description: data.error || "Failed to unassign tasks",
        });
      }
    } catch (error) {
      console.error("Error unassigning tasks:", error);
      toast.error("Network Error", {
        description: "Failed to unassign tasks",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUser.toLowerCase()),
  );

  const filteredProjects = projects
    .map((project) => ({
      ...project,
      sections: project.sections
        .map((section) => ({
          ...section,
          tasks: section.tasks.filter((task) =>
            task.title.toLowerCase().includes(searchTask.toLowerCase()),
          ),
        }))
        .filter((section) => section.tasks.length > 0),
    }))
    .filter((project) => project.sections.length > 0);

  const assignedProjects = filteredProjects
    .map((project) => ({
      ...project,
      sections: project.sections
        .map((section) => ({
          ...section,
          tasks: section.tasks.filter((t) => t.isAssigned),
        }))
        .filter((section) => section.tasks.length > 0),
    }))
    .filter((project) => project.sections.length > 0);

  const unassignedProjects = filteredProjects
    .map((project) => ({
      ...project,
      sections: project.sections
        .map((section) => ({
          ...section,
          tasks: section.tasks.filter((t) => !t.isAssigned),
        }))
        .filter((section) => section.tasks.length > 0),
    }))
    .filter((project) => project.sections.length > 0);

  if (fetching) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Assign Tasks to Users
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Assign Tasks to Users
        </h1>
      </div>

      {/* Search Users */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-600">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {user.role.name}
                </span>
              </div>
              <div className="flex gap-10">
                <button
                  onClick={() => openAssignModal(user)}
                  className="flex-1 bg-primary-500 text-white px-3 py-2 rounded-bl-lg rounded-tr-lg hover:bg-primary-600 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  Assign Tasks
                </button>
                <button
                  onClick={() => openWorkingModal(user)}
                  className="flex-1 bg-indigo-500 text-white px-3 py-2 rounded-br-lg rounded-tl-lg hover:bg-indigo-600 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <BriefcaseIcon className="w-4 h-4" />
                  Working
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Manage Tasks for {selectedUser.name}
              </h2>
              <p className="text-gray-600 mt-1">{selectedUser.email}</p>
            </div>

            {/* Search Tasks */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ASSIGNED TASKS */}
                  <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Currently Assigned Tasks
                    </h3>
                    {assignedProjects.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">
                          No tasks currently assigned
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {assignedProjects.map((project) => (
                          <div
                            key={project.id}
                            className="bg-white border border-green-200 rounded-lg p-3"
                          >
                            <h4 className="font-semibold text-gray-900 mb-3">
                              {project.name}
                            </h4>
                            <div className="space-y-3">
                              {project.sections.map((section) => (
                                <div
                                  key={section.id}
                                  className="border-l-4 border-green-500 pl-3"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      type="checkbox"
                                      checked={section.tasks.every((t) =>
                                        selectedToUnassign.has(t.id),
                                      )}
                                      onChange={() =>
                                        toggleSectionToUnassign(section)
                                      }
                                      className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                                    />
                                    <span className="font-medium text-sm text-gray-900">
                                      {section.name} ({section.tasks.length})
                                    </span>
                                  </div>
                                  <div className="ml-6 space-y-1">
                                    {section.tasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="flex items-center gap-2 p-1.5 rounded hover:bg-green-50"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedToUnassign.has(
                                            task.id,
                                          )}
                                          onChange={() =>
                                            toggleTaskToUnassign(task.id)
                                          }
                                          className="w-3.5 h-3.5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">
                                            {task.title}
                                          </p>
                                          <div className="flex gap-1 mt-0.5">
                                            <span
                                              className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                task.status === "DONE"
                                                  ? "bg-green-100 text-green-800"
                                                  : task.status ===
                                                      "IN_PROGRESS"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-800"
                                              }`}
                                            >
                                              {task.status}
                                            </span>
                                            <span
                                              className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                task.priority === "HIGH"
                                                  ? "bg-red-100 text-red-800"
                                                  : task.priority === "MEDIUM"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-gray-100 text-gray-800"
                                              }`}
                                            >
                                              {task.priority}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AVAILABLE TASKS */}
                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Available Tasks to Assign
                    </h3>
                    <p className="text-xs text-blue-700 mb-4 bg-blue-100 p-2 rounded">
                      ⚠️ Each task can only be assigned to ONE person. Assigning
                      will remove previous assignments.
                    </p>

                    {unassignedProjects.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">All tasks are assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {unassignedProjects.map((project) => (
                          <div
                            key={project.id}
                            className="bg-white border border-blue-200 rounded-lg p-3"
                          >
                            <h4 className="font-semibold text-gray-900 mb-3">
                              {project.name}
                            </h4>
                            <div className="space-y-3">
                              {project.sections.map((section) => (
                                <div
                                  key={section.id}
                                  className="border-l-4 border-blue-500 pl-3"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      type="checkbox"
                                      checked={section.tasks.every((t) =>
                                        selectedToAssign.has(t.id),
                                      )}
                                      onChange={() =>
                                        toggleSectionToAssign(section)
                                      }
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-sm text-gray-900">
                                      {section.name} ({section.tasks.length})
                                    </span>
                                  </div>
                                  <div className="ml-6 space-y-1">
                                    {section.tasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="flex items-center gap-2 p-1.5 rounded hover:bg-blue-50"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedToAssign.has(
                                            task.id,
                                          )}
                                          onChange={() =>
                                            toggleTaskToAssign(task.id)
                                          }
                                          className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">
                                            {task.title}
                                          </p>
                                          {task.assignedTo && (
                                            <p className="text-xs text-orange-600">
                                              Currently assigned to:{" "}
                                              {task.assignedTo}
                                            </p>
                                          )}
                                          <div className="flex gap-1 mt-0.5">
                                            <span
                                              className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                task.status === "DONE"
                                                  ? "bg-green-100 text-green-800"
                                                  : task.status ===
                                                      "IN_PROGRESS"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-800"
                                              }`}
                                            >
                                              {task.status}
                                            </span>
                                            <span
                                              className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                task.priority === "HIGH"
                                                  ? "bg-red-100 text-red-800"
                                                  : task.priority === "MEDIUM"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-gray-100 text-gray-800"
                                              }`}
                                            >
                                              {task.priority}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  {selectedToAssign.size > 0 && (
                    <span className="mr-4 text-blue-600 font-medium">
                      {selectedToAssign.size} to assign
                    </span>
                  )}
                  {selectedToUnassign.size > 0 && (
                    <span className="text-red-600 font-medium">
                      {selectedToUnassign.size} to unassign
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedUser(null);
                      setSelectedToAssign(new Set());
                      setSelectedToUnassign(new Set());
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                  {selectedToUnassign.size > 0 && (
                    <button
                      onClick={handleUnassign}
                      disabled={loading}
                      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      {loading
                        ? "Unassigning..."
                        : `Unassign ${selectedToUnassign.size}`}
                    </button>
                  )}
                  {selectedToAssign.size > 0 && (
                    <button
                      onClick={handleAssign}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading
                        ? "Assigning..."
                        : `Assign ${selectedToAssign.size}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Currently Working Modal */}
      {showWorkingModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-green-50">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BriefcaseIcon className="w-6 h-6 text-green-600" />
                {selectedUser.name}'s Current Work
              </h2>
              <p className="text-gray-600 mt-1">Tasks in progress</p>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : workingTasks.length === 0 ? (
                <div className="text-center py-12">
                  <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tasks in progress
                  </h3>
                  <p className="text-gray-600">
                    {selectedUser.name} doesn't have any tasks marked as
                    IN_PROGRESS.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1">
                          {task.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ml-2 ${
                            task.priority === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">
                          {task.section.project.name}
                        </span>
                        {" → "}
                        <span>{task.section.name}</span>
                      </div>
                      {task.deadline && (
                        <div className="text-sm text-gray-500">
                          Deadline:{" "}
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {workingTasks.length} task
                  {workingTasks.length !== 1 ? "s" : ""} in progress
                </div>
                <button
                  onClick={() => {
                    setShowWorkingModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
