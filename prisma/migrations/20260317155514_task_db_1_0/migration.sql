/*
  Warnings:

  - You are about to drop the column `message` on the `Comment` table. All the data in the column will be lost.
  - The primary key for the `ProjectAssignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assignedAt` on the `ProjectAssignment` table. All the data in the column will be lost.
  - The primary key for the `RolePermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assignedAt` on the `RolePermission` table. All the data in the column will be lost.
  - The primary key for the `SectionAssignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assignedAt` on the `SectionAssignment` table. All the data in the column will be lost.
  - The primary key for the `TaskAssignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assignedAt` on the `TaskAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `completedTasks` on the `WeeklyReport` table. All the data in the column will be lost.
  - You are about to drop the column `overdueTasks` on the `WeeklyReport` table. All the data in the column will be lost.
  - You are about to drop the column `pendingTasks` on the `WeeklyReport` table. All the data in the column will be lost.
  - You are about to drop the column `progressPercentage` on the `WeeklyReport` table. All the data in the column will be lost.
  - You are about to drop the column `totalTasks` on the `WeeklyReport` table. All the data in the column will be lost.
  - You are about to drop the column `weekEnd` on the `WeeklyReport` table. All the data in the column will be lost.
  - You are about to drop the column `weekStart` on the `WeeklyReport` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,userId]` on the table `ProjectAssignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,permissionId]` on the table `RolePermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sectionId,userId]` on the table `SectionAssignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[taskId,userId]` on the table `TaskAssignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,year,week]` on the table `WeeklyReport` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `ProjectAssignment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `RolePermission` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `SectionAssignment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `TaskAssignment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `WeeklyReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `week` to the `WeeklyReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `WeeklyReport` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectAssignment" DROP CONSTRAINT "ProjectAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "SectionAssignment" DROP CONSTRAINT "SectionAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignment" DROP CONSTRAINT "TaskAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "WeeklyReport" DROP CONSTRAINT "WeeklyReport_userId_fkey";

-- DropIndex
DROP INDEX "Comment_isFixed_idx";

-- DropIndex
DROP INDEX "Project_deadline_idx";

-- DropIndex
DROP INDEX "Project_name_idx";

-- DropIndex
DROP INDEX "Section_deadline_idx";

-- DropIndex
DROP INDEX "Section_name_idx";

-- DropIndex
DROP INDEX "Task_deadline_idx";

-- DropIndex
DROP INDEX "User_isActive_idx";

-- DropIndex
DROP INDEX "WeeklyReport_userId_weekStart_key";

-- DropIndex
DROP INDEX "WeeklyReport_weekEnd_idx";

-- DropIndex
DROP INDEX "WeeklyReport_weekStart_idx";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "message",
ADD COLUMN     "content" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProjectAssignment" DROP CONSTRAINT "ProjectAssignment_pkey",
DROP COLUMN "assignedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_pkey",
DROP COLUMN "assignedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SectionAssignment" DROP CONSTRAINT "SectionAssignment_pkey",
DROP COLUMN "assignedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "SectionAssignment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TaskAssignment" DROP CONSTRAINT "TaskAssignment_pkey",
DROP COLUMN "assignedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isActive",
ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WeeklyReport" DROP COLUMN "completedTasks",
DROP COLUMN "overdueTasks",
DROP COLUMN "pendingTasks",
DROP COLUMN "progressPercentage",
DROP COLUMN "totalTasks",
DROP COLUMN "weekEnd",
DROP COLUMN "weekStart",
ADD COLUMN     "hoursLogged" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tasksInProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tasksTodo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "week" INTEGER NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAssignment_projectId_userId_key" ON "ProjectAssignment"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "Section_createdAt_idx" ON "Section"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SectionAssignment_sectionId_userId_key" ON "SectionAssignment"("sectionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_userId_key" ON "TaskAssignment"("taskId", "userId");

-- CreateIndex
CREATE INDEX "WeeklyReport_year_week_idx" ON "WeeklyReport"("year", "week");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_userId_year_week_key" ON "WeeklyReport"("userId", "year", "week");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionAssignment" ADD CONSTRAINT "SectionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
