import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sectionAssignment.deleteMany();
  await prisma.section.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Create Roles
  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Full system access",
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: "Manager",
      description: "Can manage projects and teams",
    },
  });

  const developerRole = await prisma.role.create({
    data: {
      name: "Developer",
      description: "Can work on tasks",
    },
  });

  const viewerRole = await prisma.role.create({
    data: {
      name: "Viewer",
      description: "Read-only access",
    },
  });

  console.log("✅ Created 4 roles");

  // Create Permissions
  const permissions = [
    // User permissions
    {
      name: "user:create",
      resource: "user",
      action: "create",
      description: "Create users",
    },
    {
      name: "user:read",
      resource: "user",
      action: "read",
      description: "View users",
    },
    {
      name: "user:update",
      resource: "user",
      action: "update",
      description: "Update users",
    },
    {
      name: "user:delete",
      resource: "user",
      action: "delete",
      description: "Delete users",
    },

    // Role permissions
    {
      name: "role:create",
      resource: "role",
      action: "create",
      description: "Create roles",
    },
    {
      name: "role:read",
      resource: "role",
      action: "read",
      description: "View roles",
    },
    {
      name: "role:update",
      resource: "role",
      action: "update",
      description: "Update roles",
    },
    {
      name: "role:delete",
      resource: "role",
      action: "delete",
      description: "Delete roles",
    },

    // Project permissions
    {
      name: "project:create",
      resource: "project",
      action: "create",
      description: "Create projects",
    },
    {
      name: "project:read",
      resource: "project",
      action: "read",
      description: "View projects",
    },
    {
      name: "project:update",
      resource: "project",
      action: "update",
      description: "Update projects",
    },
    {
      name: "project:delete",
      resource: "project",
      action: "delete",
      description: "Delete projects",
    },

    // Section permissions
    {
      name: "section:create",
      resource: "section",
      action: "create",
      description: "Create sections",
    },
    {
      name: "section:read",
      resource: "section",
      action: "read",
      description: "View sections",
    },
    {
      name: "section:update",
      resource: "section",
      action: "update",
      description: "Update sections",
    },
    {
      name: "section:delete",
      resource: "section",
      action: "delete",
      description: "Delete sections",
    },

    // Task permissions
    {
      name: "task:create",
      resource: "task",
      action: "create",
      description: "Create tasks",
    },
    {
      name: "task:read",
      resource: "task",
      action: "read",
      description: "View tasks",
    },
    {
      name: "task:update",
      resource: "task",
      action: "update",
      description: "Update tasks",
    },
    {
      name: "task:delete",
      resource: "task",
      action: "delete",
      description: "Delete tasks",
    },

    // Comment permissions
    {
      name: "comment:create",
      resource: "comment",
      action: "create",
      description: "Create comments",
    },
    {
      name: "comment:read",
      resource: "comment",
      action: "read",
      description: "View comments",
    },
    {
      name: "comment:update",
      resource: "comment",
      action: "update",
      description: "Update comments",
    },
    {
      name: "comment:delete",
      resource: "comment",
      action: "delete",
      description: "Delete comments",
    },

    // Report permissions
    {
      name: "report:read",
      resource: "report",
      action: "read",
      description: "View reports",
    },
    {
      name: "report:create",
      resource: "report",
      action: "create",
      description: "Generate reports",
    },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) =>
      prisma.permission.create({
        data: p,
      }),
    ),
  );

  console.log("✅ Created 26 permissions");

  // Assign permissions to roles
  // Admin gets all permissions
  await Promise.all(
    createdPermissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  // Manager gets most permissions (except user and role management)
  const managerPermissions = createdPermissions.filter(
    (p) => p.resource !== "user" && p.resource !== "role",
  );
  await Promise.all(
    managerPermissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  // Developer gets task, section, project read, and comment permissions
  const developerPermissions = createdPermissions.filter(
    (p) =>
      p.resource === "task" ||
      p.resource === "comment" ||
      (p.resource === "section" && p.action === "read") ||
      (p.resource === "project" && p.action === "read"),
  );
  await Promise.all(
    developerPermissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId: developerRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  // Viewer gets only read permissions
  const viewerPermissions = createdPermissions.filter(
    (p) => p.action === "read",
  );
  await Promise.all(
    viewerPermissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  console.log("✅ Assigned permissions to roles");

  // Create Users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@taskmanager.com",
      name: "Admin User",
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@taskmanager.com",
      name: "Manager User",
      password: hashedPassword,
      roleId: managerRole.id,
    },
  });

  const developerUser = await prisma.user.create({
    data: {
      email: "developer@taskmanager.com",
      name: "Developer User",
      password: hashedPassword,
      roleId: developerRole.id,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      email: "viewer@taskmanager.com",
      name: "Viewer User",
      password: hashedPassword,
      roleId: viewerRole.id,
    },
  });

  console.log("✅ Created 4 users:");
  console.log("   - admin@taskmanager.com / password123");
  console.log("   - manager@taskmanager.com / password123");
  console.log("   - developer@taskmanager.com / password123");
  console.log("   - viewer@taskmanager.com / password123");

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: "Sample Project",
      description: "This is a sample project to get you started",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Assign users to project
  await prisma.projectAssignment.createMany({
    data: [
      { projectId: project.id, userId: adminUser.id },
      { projectId: project.id, userId: managerUser.id },
      { projectId: project.id, userId: developerUser.id },
    ],
  });

  // Create sections
  const section1 = await prisma.section.create({
    data: {
      name: "Backend Development",
      description: "API and database tasks",
      projectId: project.id,
    },
  });

  const section2 = await prisma.section.create({
    data: {
      name: "Frontend Development",
      description: "UI and UX tasks",
      projectId: project.id,
    },
  });

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Setup Database Schema",
        description: "Create Prisma schema and migrations",
        status: "DONE",
        priority: "HIGH",
        sectionId: section1.id,
      },
      {
        title: "Implement Authentication",
        description: "Setup NextAuth with credentials provider",
        status: "IN_PROGRESS",
        priority: "HIGH",
        sectionId: section1.id,
      },
      {
        title: "Create API Endpoints",
        description: "Build CRUD endpoints for all resources",
        status: "TODO",
        priority: "MEDIUM",
        sectionId: section1.id,
      },
      {
        title: "Design Dashboard",
        description: "Create dashboard layout and components",
        status: "DONE",
        priority: "HIGH",
        sectionId: section2.id,
      },
      {
        title: "Build Task Board",
        description: "Implement Kanban board interface",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        sectionId: section2.id,
      },
      {
        title: "Add Responsive Styling",
        description: "Make the app mobile-friendly",
        status: "TODO",
        priority: "LOW",
        sectionId: section2.id,
      },
    ],
  });

  console.log("✅ Created sample project with sections and tasks");

  console.log("");
  console.log("🌱 Database seeded successfully!");
  console.log("");
  console.log("🚀 You can now login with:");
  console.log("   Email: admin@taskmanager.com");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
