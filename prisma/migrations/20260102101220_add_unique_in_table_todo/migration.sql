/*
  Warnings:

  - A unique constraint covering the columns `[userId,title]` on the table `todos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,userId]` on the table `todos` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "todos_title_key";

-- CreateIndex
CREATE UNIQUE INDEX "todos_userId_title_key" ON "todos"("userId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "todos_id_userId_key" ON "todos"("id", "userId");
