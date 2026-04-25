/*
  Warnings:

  - Added the required column `expected_output` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputType` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "expected_output" JSONB NOT NULL,
ADD COLUMN     "inputType" JSONB NOT NULL;
