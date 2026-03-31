"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import Link from "next/link";

interface Section {
  id: string;
  name: string;
  description: string;
  deadline: string | null;
  _count: {
    tasks: number;
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
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string | null;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<"sections" | "materials">(
    "sections",
  );
  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"section" | "material">("section");
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [sectionFormData, setSectionFormData] = useState({
    name: "",
    description: "",
    deadline: "",
  });

  const [materialFormData, setMaterialFormData] = useState({
    type: "DOCUMENTATION",
    title: "",
    content: "",
    url: "",
    category: "",
    isPublic: false,
  });

  useEffect(() => {
    fetchProject();
    fetchSections();
    fetchMaterials();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();

      if (res.ok) {
        setProject(data.project);
      } else {
        toast.error("Error", { description: data.error });
        router.push("/projects");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Network Error", { description: "Failed to fetch project" });
    }
  };

  const fetchSections = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/sections?projectId=${projectId}`);
      const data = await res.json();

      if (res.ok) {
        setSections(data.sections || []);
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Network Error", { description: "Failed to fetch sections" });
    } finally {
      setFetching(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/materials`);
      const data = await res.json();

      if (res.ok) {
        setMaterials(data.materials || []);
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("Network Error", {
        description: "Failed to fetch materials",
      });
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sectionFormData,
          projectId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Section "${sectionFormData.name}" created successfully`,
        });
        await fetchSections();
        setShowModal(false);
        resetSectionForm();
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error creating section:", error);
      toast.error("Network Error", { description: "Failed to create section" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/sections/${editingSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sectionFormData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Section "${sectionFormData.name}" updated successfully`,
        });
        await fetchSections();
        setShowModal(false);
        resetSectionForm();
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Network Error", { description: "Failed to update section" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    const section = sections.find((s) => s.id === id);

    toast.warning("Delete Section?", {
      description: `Are you sure you want to delete "${section?.name}"? This will also delete all tasks in this section.`,
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/sections/${id}`, {
              method: "DELETE",
            });

            if (res.ok) {
              toast.success("Deleted!", {
                description: `Section "${section?.name}" deleted successfully`,
              });
              await fetchSections();
            } else {
              const data = await res.json();
              toast.error("Error", { description: data.error });
            }
          } catch (error) {
            console.error("Error deleting section:", error);
            toast.error("Network Error", {
              description: "Failed to delete section",
            });
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialFormData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Material "${materialFormData.title}" created successfully`,
        });
        await fetchMaterials();
        setShowModal(false);
        resetMaterialForm();
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error creating material:", error);
      toast.error("Network Error", {
        description: "Failed to create material",
      });
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
          body: JSON.stringify(materialFormData),
        },
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Success!", {
          description: `Material "${materialFormData.title}" updated successfully`,
        });
        await fetchMaterials();
        setShowModal(false);
        resetMaterialForm();
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("Network Error", {
        description: "Failed to update material",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const material = materials.find((m) => m.id === id);

    toast.warning("Delete Material?", {
      description: `Are you sure you want to delete "${material?.title}"?`,
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await fetch(
              `/api/projects/${projectId}/materials/${id}`,
              {
                method: "DELETE",
              },
            );

            if (res.ok) {
              toast.success("Deleted!", {
                description: `Material "${material?.title}" deleted successfully`,
              });
              await fetchMaterials();
            } else {
              const data = await res.json();
              toast.error("Error", { description: data.error });
            }
          } catch (error) {
            console.error("Error deleting material:", error);
            toast.error("Network Error", {
              description: "Failed to delete material",
            });
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const openCreateSectionModal = () => {
    resetSectionForm();
    setEditingSection(null);
    setModalType("section");
    setShowModal(true);
  };

  const openEditSectionModal = (section: Section) => {
    setEditingSection(section);
    setSectionFormData({
      name: section.name,
      description: section.description || "",
      deadline: section.deadline ? section.deadline.split("T")[0] : "",
    });
    setModalType("section");
    setShowModal(true);
  };

  const openCreateMaterialModal = () => {
    resetMaterialForm();
    setEditingMaterial(null);
    setModalType("material");
    setShowModal(true);
  };

  const openEditMaterialModal = (material: Material) => {
    setEditingMaterial(material);
    setMaterialFormData({
      type: material.type,
      title: material.title,
      content: material.content || "",
      url: material.url || "",
      category: material.category || "",
      isPublic: material.isPublic,
    });
    setModalType("material");
    setShowModal(true);
  };

  const resetSectionForm = () => {
    setSectionFormData({ name: "", description: "", deadline: "" });
    setEditingSection(null);
  };

  const resetMaterialForm = () => {
    setMaterialFormData({
      type: "DOCUMENTATION",
      title: "",
      content: "",
      url: "",
      category: "",
      isPublic: false,
    });
    setEditingMaterial(null);
  };

  if (fetching || !project) {
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
      {/* Back Button and Project Header */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Projects
        </Link>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-gray-600 mb-3">{project.description}</p>
          )}
          {project.deadline && (
            <p className="text-sm text-gray-500">
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("sections")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "sections"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CubeIcon className="w-5 h-5" />
              Sections ({sections.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "materials"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              Materials ({materials.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sections</h2>
            <button
              onClick={openCreateSectionModal}
              className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              <PlusIcon className="w-5 h-5" />
              Create Section
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <CubeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No sections yet
              </h3>
              <p className="text-gray-600">
                Create your first section to organize tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {section.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {section.description || "No description"}
                      </p>
                      {section.deadline && (
                        <p className="text-sm text-gray-500 mb-2">
                          Deadline:{" "}
                          {new Date(section.deadline).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {section._count.tasks} task
                        {section._count.tasks !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditSectionModal(section)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <Link
                    href={`/sections/${section.id}`}
                    className="block w-full bg-primary-100 text-primary-700 text-center px-4 py-2 rounded-lg hover:bg-primary-200 transition-colors"
                  >
                    View Tasks →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Materials Tab */}
      {activeTab === "materials" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Materials</h2>
            <button
              onClick={openCreateMaterialModal}
              className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              <PlusIcon className="w-5 h-5" />
              Add Material
            </button>
          </div>

          {materials.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No materials yet
              </h3>
              <p className="text-gray-600">
                Add documentation, environment variables, or other resources.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {material.type}
                        </span>
                        {material.isPublic && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            Public
                          </span>
                        )}
                        {material.category && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            {material.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {material.title}
                      </h3>
                      {material.content && (
                        <p className="text-gray-600 text-xs mb-2 break-all max-w-full overflow-hidden">
                          {material.content}
                        </p>
                      )}
                      {material.url && (
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-800"
                        >
                          🔗 {material.url}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditMaterialModal(material)}
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
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Section Modal */}
      {showModal && modalType === "section" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingSection ? "Edit Section" : "Create Section"}
            </h2>
            <form
              onSubmit={
                editingSection ? handleUpdateSection : handleCreateSection
              }
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Name
                </label>
                <input
                  type="text"
                  required
                  value={sectionFormData.name}
                  onChange={(e) =>
                    setSectionFormData({
                      ...sectionFormData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={sectionFormData.description}
                  onChange={(e) =>
                    setSectionFormData({
                      ...sectionFormData,
                      description: e.target.value,
                    })
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
                  value={sectionFormData.deadline}
                  onChange={(e) =>
                    setSectionFormData({
                      ...sectionFormData,
                      deadline: e.target.value,
                    })
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
                  {loading ? "Saving..." : editingSection ? "Update" : "Create"}
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

      {/* Material Modal */}
      {showModal && modalType === "material" && (
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={materialFormData.type}
                  onChange={(e) =>
                    setMaterialFormData({
                      ...materialFormData,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="DOCUMENTATION">Documentation</option>
                  <option value="ENVIRONMENT_VAR">Environment Variable</option>
                  <option value="TEST_RESULT">Test Result</option>
                  <option value="LINK">Link</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={materialFormData.title}
                  onChange={(e) =>
                    setMaterialFormData({
                      ...materialFormData,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={materialFormData.content}
                  onChange={(e) =>
                    setMaterialFormData({
                      ...materialFormData,
                      content: e.target.value,
                    })
                  }
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  placeholder="Content, code, or description..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={materialFormData.url}
                  onChange={(e) =>
                    setMaterialFormData({
                      ...materialFormData,
                      url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={materialFormData.category}
                  onChange={(e) =>
                    setMaterialFormData({
                      ...materialFormData,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., API, Database, Configuration"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={materialFormData.isPublic}
                    onChange={(e) =>
                      setMaterialFormData({
                        ...materialFormData,
                        isPublic: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
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
                      ? "Update"
                      : "Create"}
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
