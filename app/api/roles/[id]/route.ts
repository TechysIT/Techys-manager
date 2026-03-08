import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, permissionIds } = body;

    // Update basic role info
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const role = await prisma.role.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update permissions if provided
    if (permissionIds) {
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: params.id },
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId: params.id,
            permissionId,
          })),
        });
      }
    }

    // Fetch updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if role has users
    const roleWithUsers = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!roleWithUsers) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (roleWithUsers._count.users > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete role. ${roleWithUsers._count.users} users are assigned to this role.`,
        },
        { status: 400 },
      );
    }

    await prisma.role.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
