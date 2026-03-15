"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  KeyIcon,
  BeakerIcon,
  LinkIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";

interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  _count?: {
    sections: number;
    materials: number;
  };
}

interface Material {
  id: string;
  type: string;
  title: string;
  content: string;
  url: string;
  category: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const [formData, setFormData] = useState({
    type: "DOCUMENTATION" as string,
    title: "",
    content: "",
    url: "",
    category: "",
    isPublic: false,
  });

  useEffect(() => {
    fetchProject();
    fetchMaterials();
  }, [projectId]);

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

  const handleCreateMaterial = async (e: React.FormEvent) => {
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
        setShowMaterialModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating material:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
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
        setShowMaterialModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error updating material:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/materials/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchMaterials();
      }
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  const openCreateModal = (type: string) => {
    resetForm();
    setFormData({ ...formData, type });
    setEditingMaterial(null);
    setShowMaterialModal(true);
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
    setShowMaterialModal(true);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DOCUMENTATION":
        return <DocumentTextIcon className="w-5 h-5" />;
      case "ENVIRONMENT_VAR":
        return <KeyIcon className="w-5 h-5" />;
      case "TEST_RESULT":
        return <BeakerIcon className="w-5 h-5" />;
      case "LINK":
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
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

  const filteredMaterials =
    activeTab === "ALL"
      ? materials
      : materials.filter((m) => m.type === activeTab);

  const materialTypes = [
    { key: "ALL", label: "All", count: materials.length },
    {
      key: "DOCUMENTATION",
      label: "Docs",
      count: materials.filter((m) => m.type === "DOCUMENTATION").length,
    },
    {
      key: "ENVIRONMENT_VAR",
      label: "Env Vars",
      count: materials.filter((m) => m.type === "ENVIRONMENT_VAR").length,
    },
    {
      key: "TEST_RESULT",
      label: "Tests",
      count: materials.filter((m) => m.type === "TEST_RESULT").length,
    },
    {
      key: "LINK",
      label: "Links",
      count: materials.filter((m) => m.type === "LINK").length,
    },
  ];

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span>{project._count?.sections || 0} sections</span>
              <span>•</span>
              <span>{project._count?.materials || 0} materials</span>
              {project.deadline && (
                <>
                  <span>•</span>
                  <span>
                    Due: {new Date(project.deadline).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/projects/${projectId}/edit`)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Edit Project
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          {materialTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setActiveTab(type.key)}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === type.key
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {type.label} ({type.count})
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => openCreateModal("DOCUMENTATION")}
          className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <DocumentTextIcon className="w-5 h-5" />
          <span className="font-medium">Add Docs</span>
        </button>
        <button
          onClick={() => openCreateModal("ENVIRONMENT_VAR")}
          className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
        >
          <KeyIcon className="w-5 h-5" />
          <span className="font-medium">Add Env Var</span>
        </button>
        <button
          onClick={() => openCreateModal("TEST_RESULT")}
          className="flex items-center justify-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <BeakerIcon className="w-5 h-5" />
          <span className="font-medium">Add Test</span>
        </button>
        <button
          onClick={() => openCreateModal("LINK")}
          className="flex items-center justify-center gap-2 p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <LinkIcon className="w-5 h-5" />
          <span className="font-medium">Add Link</span>
        </button>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No materials yet
          </h3>
          <p className="text-gray-600">
            Add documentation, environment variables, test results, or links to
            this project.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`p-2 rounded-lg ${getTypeColor(material.type)}`}
                  >
                    {getTypeIcon(material.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {material.title}
                      </h3>
                      {material.isPublic ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          <EyeIcon className="w-3 h-3" />
                          Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          <EyeSlashIcon className="w-3 h-3" />
                          Private
                        </span>
                      )}
                    </div>
                    {material.category && (
                      <span className="text-xs text-gray-500">
                        {material.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(material)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {material.content && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 relative">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {material.content}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(material.content)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-100"
                    title="Copy to clipboard"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}

              {material.url && (
                <Link
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 mb-4"
                >
                  <LinkIcon className="w-4 h-4" />
                  {material.url}
                </Link>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                <span>Added by {material.user.name}</span>
                <span>{new Date(material.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingMaterial ? "Edit Material" : "Add Material"}
            </h2>

            <form
              onSubmit={
                editingMaterial ? handleUpdateMaterial : handleCreateMaterial
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
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
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., API Documentation, DATABASE_URL, Unit Tests"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., Backend, Frontend, Database"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={8}
                    placeholder={
                      formData.type === "ENVIRONMENT_VAR"
                        ? "KEY=value\nANOTHER_KEY=another_value"
                        : formData.type === "TEST_RESULT"
                          ? "Test results, coverage, logs..."
                          : "Detailed content, code snippets, notes..."
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL (optional)
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublic: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="isPublic"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Make this public (visible to all team members)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingMaterial
                      ? "Update"
                      : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
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
