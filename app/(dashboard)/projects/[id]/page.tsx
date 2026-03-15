"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  BeakerIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  createdAt: string;
  _count?: {
    sections: number;
    materials: number;
  };
}

interface Material {
  id: string;
  type: "DOCUMENTATION" | "ENVIRONMENT_VAR" | "TEST_RESULT" | "LINK";
  title: string;
  content: string;
  url: string;
  category: string;
  isPublic: boolean;
  createdAt: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    type: "DOCUMENTATION" as
      | "DOCUMENTATION"
      | "ENVIRONMENT_VAR"
      | "TEST_RESULT"
      | "LINK",
    title: "",
    content: "",
    url: "",
    category: "",
    isPublic: false,
  });

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    setFetching(true);
    try {
      await Promise.all([fetchProject(), fetchMaterials()]);
    } finally {
      setFetching(false);
    }
  };

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      setProject(data.project);
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/materials`);
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchMaterials();
        setShowModal(false);
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create material");
      }
    } catch (error) {
      console.error("Error creating material:", error);
      alert("Failed to create material");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/materials/${editingMaterial.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (res.ok) {
        await fetchMaterials();
        setShowModal(false);
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update material");
      }
    } catch (error) {
      console.error("Error updating material:", error);
      alert("Failed to update material");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const res = await fetch(
        `/api/projects/${projectId}/materials/${materialId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        await fetchMaterials();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete material");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Failed to delete material");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingMaterial(null);
    setShowModal(true);
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      type: material.type,
      title: material.title,
      content: material.content || "",
      url: material.url || "",
      category: material.category || "",
      isPublic: material.isPublic,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: "DOCUMENTATION",
      title: "",
      content: "",
      url: "",
      category: "",
      isPublic: false,
    });
    setEditingMaterial(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DOCUMENTATION":
        return <DocumentTextIcon className="w-5 h-5" />;
      case "ENVIRONMENT_VAR":
        return <CodeBracketIcon className="w-5 h-5" />;
      case "TEST_RESULT":
        return <BeakerIcon className="w-5 h-5" />;
      case "LINK":
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "DOCUMENTATION":
        return "bg-blue-100 text-blue-800";
      case "ENVIRONMENT_VAR":
        return "bg-green-100 text-green-800";
      case "TEST_RESULT":
        return "bg-purple-100 text-purple-800";
      case "LINK":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  if (fetching) {
    return <LoadingPage />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Project not found
        </h2>
        <p className="text-gray-600 mb-4">
          The project you&apos;re looking for doesn&apos;t exist.
        </p>
        <button
          onClick={() => router.push("/projects")}
          className="text-primary-600 hover:text-primary-700"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Projects
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.description}</p>
            <div className="flex gap-4 mt-4 text-sm text-gray-500">
              <span>Sections: {project._count?.sections || 0}</span>
              <span>Materials: {project._count?.materials || 0}</span>
              {project.deadline && (
                <span>
                  Deadline: {new Date(project.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            <PlusIcon className="w-5 h-5" />
            Add Material
          </button>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No materials yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add documentation, environment variables, test results, or links to
            this project.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            <PlusIcon className="w-5 h-5" />
            Add First Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-gray-600">
                    {getTypeIcon(material.type)}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getTypeBadgeColor(material.type)}`}
                  >
                    {formatType(material.type)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(material)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">
                {material.title}
              </h3>

              {material.content && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {material.content}
                </p>
              )}

              {material.url && (
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 break-all block"
                >
                  {material.url}
                </a>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-xs text-gray-500">
                  {material.category || "Uncategorized"}
                </span>
                {material.isPublic && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                    Public
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingMaterial ? "Edit Material" : "Add Material"}
            </h2>

            <form onSubmit={editingMaterial ? handleUpdate : handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="DOCUMENTATION">Documentation</option>
                    <option value="ENVIRONMENT_VAR">
                      Environment Variable
                    </option>
                    <option value="TEST_RESULT">Test Result</option>
                    <option value="LINK">Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., API, Setup, Deployment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., API Documentation, Database URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={6}
                  placeholder="Enter content, code, or notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublic: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Make this material public
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingMaterial
                      ? "Update Material"
                      : "Add Material"}
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
