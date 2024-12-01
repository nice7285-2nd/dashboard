/*
  Warnings:

  - You are about to drop the column `user_id` on the `lessons` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_user_id_fkey";

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "user_id";

-- AddForeignKey
ALTER TABLE "studyreclist" ADD CONSTRAINT "studyreclist_email_fkey" FOREIGN KEY ("email") REFERENCES "users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_email_fkey" FOREIGN KEY ("email") REFERENCES "users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
