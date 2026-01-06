/*
  Warnings:

  - Made the column `image` on table `profile_users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `imagePublicId` on table `profile_users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "profile_users" ALTER COLUMN "image" SET NOT NULL,
ALTER COLUMN "image" SET DEFAULT 'https://res.cloudinary.com/dbhnbrxjb/image/upload/v1767698082/profile_todo_default_oovtib.png',
ALTER COLUMN "imagePublicId" SET NOT NULL,
ALTER COLUMN "imagePublicId" SET DEFAULT 'avatars/default';
