/*
  Warnings:

  - The values [Cpp,Csh] on the enum `languages` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `memory_limit` on the `tasks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the `Submission` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "languages_new" AS ENUM ('JavaScript', 'TypeScript', 'Python', 'C', 'C++', 'Ruby', 'Java', 'C#');
ALTER TABLE "Submission" ALTER COLUMN "language" TYPE "languages_new" USING ("language"::text::"languages_new");
ALTER TYPE "languages" RENAME TO "languages_old";
ALTER TYPE "languages_new" RENAME TO "languages";
DROP TYPE "public"."languages_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_task_id_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_user_id_fkey";

-- DropForeignKey
ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_task_id_fkey";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "memory_limit" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "Submission";

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "time" DECIMAL(65,30),
    "status" "status_codes" NOT NULL,
    "language" "languages" NOT NULL,
    "result" JSONB NOT NULL,
    "error_message" TEXT,
    "memory_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submissions_user_id_task_id_idx" ON "submissions"("user_id", "task_id");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
