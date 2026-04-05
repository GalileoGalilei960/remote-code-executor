-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "is_published" SET DEFAULT false;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
