import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/**
 * PATCH /api/comments/[id]
 * Update a comment (only by owner or with permission)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = params.id;

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check permission: either has comment:update OR is the comment owner
    const hasUpdatePermission = checkPermission(session, "comment", "update");
    const isOwner = existingComment.userId === session.user.id;

    if (!hasUpdatePermission && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own comments" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { content, isFixed } = body;

    // Validate content if provided
    if (content !== undefined && (!content || content.trim() === "")) {
      return NextResponse.json(
        { error: "Comment content cannot be empty" },
        { status: 400 },
      );
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(content !== undefined && { content: content.trim() }),
        ...(isFixed !== undefined && { isFixed }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Update comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * Delete a comment (only by owner or with permission)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = params.id;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check permission: either has comment:delete OR is the comment owner
    const hasDeletePermission = checkPermission(session, "comment", "delete");
    const isOwner = comment.userId === session.user.id;

    if (!hasDeletePermission && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own comments" },
        { status: 403 },
      );
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
