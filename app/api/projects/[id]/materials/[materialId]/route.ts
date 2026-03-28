import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "project", "update")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to update materials" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { type, title, content, url, category, isPublic } = body;

    const material = await prisma.projectMaterial.update({
      where: { id: params.materialId },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content?.trim() || null }),
        ...(url !== undefined && { url: url?.trim() || null }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({ material });
  } catch (error) {
    console.error("Update material error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "project", "delete")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete materials" },
        { status: 403 },
      );
    }

    await prisma.projectMaterial.delete({
      where: { id: params.materialId },
    });

    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Delete material error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
