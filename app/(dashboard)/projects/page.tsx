"use client";

import { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { LoadingCard } from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();

      if (res.status === 403) {
        toast.error("Permission Denied", {
          description:
            data.error || "You don't have permission to view projects",
        });
        setProjects([]);
      } else if (res.ok) {
        setProjects(data.projects || []);
      } else {
        toast.error("Error", {
          description: data.error || "Failed to fetch projects",
        });
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Network Error", {
        description: "Failed to connect to the server",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Project "${formData.name}" created successfully`,
        });
        await fetchProjects();
        setShowModal(false);
        resetForm();
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description: data.error,
          duration: 5000,
          action: data.requiredPermission
            ? {
                label: "Details",
                onClick: () => {
                  toast.info("Required Permission", {
                    description: `You need: ${data.requiredPermission}\n\nYour permissions: ${data.yourPermissions?.join(", ") || "None"}`,
                    duration: 10000,
                  });
                },
              }
            : undefined,
        });
      } else if (res.status === 400) {
        toast.error("Invalid Data", {
          description: data.error || "Please check your input",
        });
      } else if (res.status === 401) {
        toast.error("Not Authenticated", {
          description: "Please login again",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error("Error", {
          description: data.error || "Failed to create project",
        });
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Network Error", {
        description: "Failed to create project",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Project "${formData.name}" updated successfully`,
        });
        await fetchProjects();
        setShowModal(false);
        resetForm();
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description:
            data.error || "You don't have permission to update projects",
        });
      } else {
        toast.error("Error", {
          description: data.error || "Failed to update project",
        });
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Network Error", {
        description: "Failed to update project",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const project = projects.find((p) => p.id === id);

    // Use toast for confirmation
    toast.warning("Delete Project?", {
      description: `Are you sure you want to delete "${project?.name}"?`,
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/projects/${id}`, {
              method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
              toast.success("Deleted!", {
                description: `Project "${project?.name}" deleted successfully`,
              });
              await fetchProjects();
            } else if (res.status === 403) {
              toast.error("Permission Denied", {
                description:
                  data.error || "You don't have permission to delete projects",
              });
            } else {
              toast.error("Error", {
                description: data.error || "Failed to delete project",
              });
            }
          } catch (error) {
            console.error("Error deleting project:", error);
            toast.error("Network Error", {
              description: "Failed to delete project",
            });
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingProject(null);
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      deadline: project.deadline ? project.deadline.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", deadline: "" });
    setEditingProject(null);
  };

  if (fetching) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <button className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg">
            <PlusIcon className="w-5 h-5" />
            Create Project
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          <PlusIcon className="w-5 h-5" />
          Create Project
        </button>
      </div>

      {projects.length === 0 ? (
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600">
            Get started by creating your first project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex flex-col justify-between"
            >
              {/* Top Section */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>

                  <div className="flex gap-5">
                    <button
                      onClick={() => openEditModal(project)}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  {project.description || "No description"}
                </p>

                {project.deadline && (
                  <p className="text-sm text-gray-500">
                    Deadline: {new Date(project.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Bottom Section */}
              <div className="flex justify-end mt-4">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-orange-600 hover:text-orange-800"
                >
                  View details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingProject ? "Edit Project" : "Create Project"}
            </h2>
            <form onSubmit={editingProject ? handleUpdate : handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                  {loading ? "Saving..." : editingProject ? "Update" : "Create"}
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
