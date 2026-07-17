-- CreateTable
CREATE TABLE "MemberProject" (
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "MemberProject_pkey" PRIMARY KEY ("userId","projectId")
);

-- AddForeignKey
ALTER TABLE "MemberProject" ADD CONSTRAINT "MemberProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProject" ADD CONSTRAINT "MemberProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
