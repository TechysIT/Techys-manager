import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  roleId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    const { email, password, name, roleId } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Get default role if not provided
    let finalRoleId = roleId;
    if (!finalRoleId) {
      const defaultRole = await prisma.role.findUnique({
        where: { name: "Viewer" },
      });

      if (!defaultRole) {
        return NextResponse.json(
          { error: "Default role not found. Please contact administrator." },
          { status: 500 },
        );
      }

      finalRoleId = defaultRole.id;
    } else {
      // Verify role exists if provided
      const role = await prisma.role.findUnique({
        where: { id: finalRoleId },
      });

      if (!role) {
        return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roleId: finalRoleId,
        suspended: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        suspended: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roleId: user.roleId,
          active: !user.suspended,
          createdAt: user.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
