"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  deadline: string | null;
  comments?: Comment[];
  _count: {
    comments: number;
  };
}

interface Section {
  id: string;
  name: string;
  description: string;
  deadline: string | null;
  project: {
    id: string;
    name: string;
  };
}

export default function SectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id as string;

  const [section, setSection] = useState<Section | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showMentions, setShowMentions] = useState<Record<string, boolean>>({});
  const [mentionSearch, setMentionSearch] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO" as "TODO" | "IN_PROGRESS" | "DONE",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    deadline: "",
  });

  useEffect(() => {
    fetchSection();
    fetchTasks();
    fetchUsers();
  }, [sectionId]);

  const fetchSection = async () => {
    try {
      const res = await fetch(`/api/sections/${sectionId}`);
      const data = await res.json();

      if (res.ok) {
        setSection(data.section);
      } else {
        toast.error("Error", { description: data.error });
        router.push("/projects");
      }
    } catch (error) {
      console.error("Error fetching section:", error);
      toast.error("Network Error", { description: "Failed to fetch section" });
    }
  };

  const fetchTasks = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/tasks?sectionId=${sectionId}`);
      const data = await res.json();

      if (res.ok) {
        setTasks(data.tasks || []);
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Network Error", { description: "Failed to fetch tasks" });
    } finally {
      setFetching(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTaskComments = async (taskId: string) => {
    try {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      const data = await res.json();

      if (res.ok) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, comments: data.comments } : task,
          ),
        );
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const toggleComments = async (taskId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
      await fetchTaskComments(taskId);
    }
    setExpandedComments(newExpanded);
  };

  const handleCommentChange = (taskId: string, value: string) => {
    setCommentText((prev) => ({ ...prev, [taskId]: value }));

    // Detect @ mentions
    const input = inputRefs.current[taskId];
    const lastAtIndex = value.lastIndexOf("@");
    const cursorPos = input?.selectionStart || value.length;

    if (lastAtIndex !== -1 && lastAtIndex < cursorPos) {
      const textAfterAt = value.substring(lastAtIndex + 1, cursorPos);
      if (!textAfterAt.includes(" ")) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions((prev) => ({ ...prev, [taskId]: true }));
        return;
      }
    }

    setShowMentions((prev) => ({ ...prev, [taskId]: false }));
  };

  const insertMention = (taskId: string, user: User) => {
    const input = inputRefs.current[taskId];
    if (!input) return;

    const text = commentText[taskId] || "";
    const lastAtIndex = text.lastIndexOf("@");
    const beforeMention = text.substring(0, lastAtIndex);
    const afterMention = text.substring(input.selectionStart || text.length);

    const newText = `${beforeMention}@${user.name} ${afterMention}`;
    setCommentText((prev) => ({ ...prev, [taskId]: newText }));
    setShowMentions((prev) => ({ ...prev, [taskId]: false }));

    // Focus back on input
    setTimeout(() => {
      input.focus();
      const newPosition = beforeMention.length + user.name.length + 2;
      input.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleAddComment = async (taskId: string) => {
    const content = commentText[taskId]?.trim();
    if (!content) {
      toast.warning("Empty Comment", { description: "Please enter a comment" });
      return;
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, content }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Comment Added", {
          description:
            data.mentionsNotified > 0
              ? `${data.mentionsNotified} user(s) notified`
              : "Your comment has been posted",
        });
        setCommentText((prev) => ({ ...prev, [taskId]: "" }));
        await fetchTaskComments(taskId);
        await fetchTasks(); // Refresh to update comment count
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Network Error", { description: "Failed to add comment" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sectionId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Task "${formData.title}" created successfully`,
        });
        await fetchTasks();
        setShowModal(false);
        resetForm();
      } else if (res.status === 403) {
        toast.error("Permission Denied", { description: data.error });
      } else {
        toast.error("Error", {
          description: data.error || "Failed to create task",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Network Error", { description: "Failed to create task" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Task "${formData.title}" updated successfully`,
        });
        await fetchTasks();
        setShowModal(false);
        resetForm();
      } else if (res.status === 403) {
        toast.error("Permission Denied", { description: data.error });
      } else {
        toast.error("Error", {
          description: data.error || "Failed to update task",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Network Error", { description: "Failed to update task" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);

    toast.warning("Delete Task?", {
      description: `Are you sure you want to delete "${task?.title}"?`,
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
              toast.success("Deleted!", {
                description: `Task "${task?.title}" deleted successfully`,
              });
              await fetchTasks();
            } else if (res.status === 403) {
              toast.error("Permission Denied", { description: data.error });
            } else {
              toast.error("Error", {
                description: data.error || "Failed to delete task",
              });
            }
          } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Network Error", {
              description: "Failed to delete task",
            });
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingTask(null);
    setShowModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      deadline: task.deadline ? task.deadline.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      deadline: "",
    });
    setEditingTask(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupedTasks = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  const filteredMentionUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch),
  );

  if (fetching || !section) {
    return (
      <div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/projects/${section.project.id}`}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to {section.project.name}
        </Link>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-2">
            {section.project.name}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {section.name}
          </h1>
          {section.description && (
            <p className="text-gray-600 mb-3">{section.description}</p>
          )}
          {section.deadline && (
            <p className="text-sm text-gray-500">
              Deadline: {new Date(section.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Tasks Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          <PlusIcon className="w-5 h-5" />
          Create Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
          <div key={status} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>{status.replace("_", " ")}</span>
              <span className="text-sm font-normal text-gray-500">
                {statusTasks.length}
              </span>
            </h3>
            <div className="space-y-3">
              {statusTasks.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No tasks
                </p>
              ) : (
                statusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    {/* Task Header */}
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                        {task.deadline && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => openEditModal(task)}
                          className="flex-1 text-xs text-blue-600 hover:text-blue-800 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="flex-1 text-xs text-red-600 hover:text-red-800 py-1"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Comments Toggle */}
                      <button
                        onClick={() => toggleComments(task.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2 border-t border-gray-200"
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        {expandedComments.has(task.id) ? "Hide" : "Show"}{" "}
                        Comments ({task._count.comments})
                      </button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments.has(task.id) && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        {/* Existing Comments */}
                        <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                          {task.comments && task.comments.length > 0 ? (
                            task.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-white rounded p-3 text-sm"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {comment.user.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      comment.createdAt,
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-xs text-center py-2">
                              No comments yet
                            </p>
                          )}
                        </div>

                        {/* Add Comment with Mentions */}
                        <div className="relative">
                          <div className="flex gap-2">
                            <input
                              ref={(el) => {
                                inputRefs.current[task.id] = el;
                              }}
                              type="text"
                              value={commentText[task.id] || ""}
                              onChange={(e) =>
                                handleCommentChange(task.id, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(task.id);
                                }
                              }}
                              placeholder="Add comment (@ to mention)..."
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button
                              onClick={() => handleAddComment(task.id)}
                              className="p-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Mention Dropdown */}
                          {showMentions[task.id] &&
                            filteredMentionUsers.length > 0 && (
                              <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                                {filteredMentionUsers
                                  .slice(0, 5)
                                  .map((user) => (
                                    <button
                                      key={user.id}
                                      onClick={() =>
                                        insertMention(task.id, user)
                                      }
                                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                                    >
                                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                                        <span className="text-primary-600 font-medium text-xs">
                                          {user.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {user.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {user.email}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal (unchanged) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingTask ? "Edit Task" : "Create Task"}
            </h2>
            <form onSubmit={editingTask ? handleUpdate : handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "TODO" | "IN_PROGRESS" | "DONE",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as "LOW" | "MEDIUM" | "HIGH",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingTask ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
