-- CreateTable
CREATE TABLE `HobbyPage` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `introduction` TEXT NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HobbySection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hobbyPageId` INTEGER NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `imageStorageName` VARCHAR(255) NOT NULL,
    `imageOriginalName` VARCHAR(255) NOT NULL,
    `imageMimeType` VARCHAR(100) NOT NULL,
    `imageSize` INTEGER NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HobbySection_imageStorageName_key`(`imageStorageName`),
    INDEX `HobbySection_hobbyPageId_sortOrder_idx`(`hobbyPageId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HobbyTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hobbySectionId` INTEGER NOT NULL,
    `label` VARCHAR(60) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `HobbyTag_hobbySectionId_sortOrder_idx`(`hobbySectionId`, `sortOrder`),
    UNIQUE INDEX `HobbyTag_hobbySectionId_label_key`(`hobbySectionId`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HobbySection` ADD CONSTRAINT `HobbySection_hobbyPageId_fkey` FOREIGN KEY (`hobbyPageId`) REFERENCES `HobbyPage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HobbyTag` ADD CONSTRAINT `HobbyTag_hobbySectionId_fkey` FOREIGN KEY (`hobbySectionId`) REFERENCES `HobbySection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
