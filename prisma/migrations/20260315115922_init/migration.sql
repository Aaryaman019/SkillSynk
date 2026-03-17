-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "githubUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'developer',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" TEXT[],
    "deadline" TIMESTAMP(3),
    "managerId" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "dailyHours" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillAssessment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "technology" TEXT NOT NULL,
    "selfRating" INTEGER NOT NULL,
    "githubScore" INTEGER,
    "matchStatus" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "SkillAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "assignedTo" INTEGER,
    "title" TEXT NOT NULL,
    "complexity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "estimatedHours" DOUBLE PRECISION,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_projectId_userId_key" ON "TeamMember"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillAssessment_userId_technology_key" ON "SkillAssessment"("userId", "technology");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssessment" ADD CONSTRAINT "SkillAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
