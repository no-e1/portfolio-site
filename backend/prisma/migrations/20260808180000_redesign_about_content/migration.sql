-- AlterTable
ALTER TABLE `AboutPage` DROP COLUMN `intro`;

-- AlterTable
ALTER TABLE `AboutSection` DROP COLUMN `technologies`;

-- CreateTable
CREATE TABLE `AboutBulletPoint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aboutSectionId` INTEGER NOT NULL,
    `heading` VARCHAR(160) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `AboutBulletPoint_aboutSectionId_sortOrder_idx`(`aboutSectionId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AboutTechnology` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aboutPageId` INTEGER NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `context` VARCHAR(160) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `AboutTechnology_aboutPageId_sortOrder_idx`(`aboutPageId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AboutBulletPoint` ADD CONSTRAINT `AboutBulletPoint_aboutSectionId_fkey` FOREIGN KEY (`aboutSectionId`) REFERENCES `AboutSection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AboutTechnology` ADD CONSTRAINT `AboutTechnology_aboutPageId_fkey` FOREIGN KEY (`aboutPageId`) REFERENCES `AboutPage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
