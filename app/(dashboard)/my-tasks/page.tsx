"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

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
  section: {
    id: string;
    name: string;
    project: {
      id: string;
      name: string;
    };
  };
  comments: Comment[];
  _count: {
    comments: number;
  };
}

export default function MyTasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showMentions, setShowMentions] = useState<Record<string, boolean>>({});
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks?assignedToMe=true");
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
      setLoading(false);
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Status Updated", {
          description: `Task status changed to ${newStatus}`,
        });
        await fetchTasks();
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Network Error", { description: "Failed to update status" });
    }
  };

  const handleCommentChange = (taskId: string, value: string) => {
    setCommentText((prev) => ({ ...prev, [taskId]: value }));

    // Detect @ mentions
    const lastAtIndex = value.lastIndexOf("@");
    const cursorPos =
      textareaRefs.current[taskId]?.selectionStart || value.length;

    if (lastAtIndex !== -1 && lastAtIndex < cursorPos) {
      const textAfterAt = value.substring(lastAtIndex + 1, cursorPos);
      if (!textAfterAt.includes(" ")) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions((prev) => ({ ...prev, [taskId]: true }));
        setCursorPosition(lastAtIndex);
        return;
      }
    }

    setShowMentions((prev) => ({ ...prev, [taskId]: false }));
  };

  const insertMention = (taskId: string, user: User) => {
    const textarea = textareaRefs.current[taskId];
    if (!textarea) return;

    const text = commentText[taskId] || "";
    const lastAtIndex = text.lastIndexOf("@");
    const beforeMention = text.substring(0, lastAtIndex);
    const afterMention = text.substring(textarea.selectionStart);

    const newText = `${beforeMention}@${user.name} ${afterMention}`;
    setCommentText((prev) => ({ ...prev, [taskId]: newText }));
    setShowMentions((prev) => ({ ...prev, [taskId]: false }));

    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      const newPosition = beforeMention.length + user.name.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
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
        body: JSON.stringify({
          taskId,
          content,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Comment Added", {
          description: "Your comment has been posted",
        });
        setCommentText((prev) => ({ ...prev, [taskId]: "" }));
        await fetchTaskComments(taskId);
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Network Error", { description: "Failed to add comment" });
    }
  };

  const toggleTaskExpansion = async (taskId: string) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskId);
      await fetchTaskComments(taskId);
    }
  };

  const filteredMentionUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch),
  );

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

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <div className="text-sm text-gray-600">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tasks assigned
          </h3>
          <p className="text-gray-600">
            You don't have any tasks assigned to you yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              {/* Task Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold mb-2 ${
                        task.status === "DONE"
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {task.section.project.name} → {task.section.name}
                    </p>
                    {task.description && (
                      <p className="text-gray-700 mb-3">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      {task.deadline && (
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <div className="flex gap-2">
                    {["TODO", "IN_PROGRESS", "DONE"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(task.id, status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          task.status === status
                            ? "bg-primary-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments Toggle */}
                <button
                  onClick={() => toggleTaskExpansion(task.id)}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  {expandedTask === task.id ? "Hide" : "Show"} Comments (
                  {task._count.comments})
                </button>
              </div>

              {/* Comments Section */}
              {expandedTask === task.id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {/* Existing Comments */}
                  <div className="space-y-4 mb-4">
                    {task.comments && task.comments.length > 0 ? (
                      task.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary-600 font-medium text-xs">
                                {comment.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm text-gray-900">
                                  {comment.user.name}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No comments yet
                      </p>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Comment (use @ to mention users)
                    </label>
                    <div className="relative">
                      <textarea
                        ref={(el) => {
                          textareaRefs.current[task.id] = el;
                        }}
                        value={commentText[task.id] || ""}
                        onChange={(e) =>
                          handleCommentChange(task.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) {
                            handleAddComment(task.id);
                          }
                        }}
                        placeholder="Write a comment... (Ctrl+Enter to send)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      />

                      {/* Mention Dropdown */}
                      {showMentions[task.id] &&
                        filteredMentionUsers.length > 0 && (
                          <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                            {filteredMentionUsers.slice(0, 5).map((user) => (
                              <button
                                key={user.id}
                                onClick={() => insertMention(task.id, user)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-primary-600 font-medium text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
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

                    <button
                      onClick={() => handleAddComment(task.id)}
                      className="mt-2 flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Post Comment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
