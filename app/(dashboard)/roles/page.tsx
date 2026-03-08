"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  _count?: {
    permissions: number;
    users: number;
  };
  permissions?: Array<{
    permission: Permission;
  }>;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles?include=permissions");
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      setAllPermissions(data.permissions || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchRoles();
        setShowModal(false);
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create role");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      alert("Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchRoles();
        setShowModal(false);
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will affect all users with this role."))
      return;

    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchRoles();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("Failed to delete role");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingRole(null);
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissionIds: role.permissions?.map((p) => p.permission.id) || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissionIds: [],
    });
    setEditingRole(null);
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const toggleAllPermissions = (resource: string, checked: boolean) => {
    const resourcePermissions = allPermissions
      .filter((p) => p.resource === resource)
      .map((p) => p.id);

    setFormData((prev) => ({
      ...prev,
      permissionIds: checked
        ? [...new Set([...prev.permissionIds, ...resourcePermissions])]
        : prev.permissionIds.filter((id) => !resourcePermissions.includes(id)),
    }));
  };

  const selectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: allPermissions.map((p) => p.id),
    }));
  };

  const clearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: [],
    }));
  };

  // Group permissions by resource
  const permissionsByResource = allPermissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Manager":
        return "bg-blue-100 text-blue-800";
      case "Developer":
        return "bg-green-100 text-green-800";
      case "Viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-purple-100 text-purple-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">Manage roles and permissions</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          <PlusIcon className="w-5 h-5" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      {roles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No roles yet
          </h3>
          <p className="text-gray-600">
            Create your first role to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {role.name}
                  </h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(role.name)}`}
                >
                  {role.name}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Permissions:</span>
                  <span className="font-medium text-gray-900">
                    {role._count?.permissions || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Users:</span>
                  <span className="font-medium text-gray-900">
                    {role._count?.users || 0}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => openEditModal(role)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingRole ? "Edit Role" : "Create Role"}
            </h2>

            <form onSubmit={editingRole ? handleUpdate : handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Team Lead"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of this role"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Permissions ({formData.permissionIds.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {Object.entries(permissionsByResource).map(
                    ([resource, permissions]) => {
                      const allSelected = permissions.every((p) =>
                        formData.permissionIds.includes(p.id),
                      );
                      const someSelected = permissions.some((p) =>
                        formData.permissionIds.includes(p.id),
                      );

                      return (
                        <div key={resource} className="mb-4 last:mb-0">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => {
                                if (el)
                                  el.indeterminate =
                                    someSelected && !allSelected;
                              }}
                              onChange={(e) =>
                                toggleAllPermissions(resource, e.target.checked)
                              }
                              className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                            />
                            <label className="ml-2 text-sm font-semibold text-gray-900 capitalize">
                              {resource}
                            </label>
                          </div>
                          <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {permissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center"
                              >
                                <input
                                  type="checkbox"
                                  id={permission.id}
                                  checked={formData.permissionIds.includes(
                                    permission.id,
                                  )}
                                  onChange={() =>
                                    togglePermission(permission.id)
                                  }
                                  className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                />
                                <label
                                  htmlFor={permission.id}
                                  className="ml-2 text-sm text-gray-700"
                                >
                                  {permission.action}
                                  <span className="text-gray-400 ml-1">
                                    ({permission.description})
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingRole
                      ? "Update Role"
                      : "Create Role"}
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
