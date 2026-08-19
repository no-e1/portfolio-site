-- CreateTable
CREATE TABLE `AboutCompetency` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aboutPageId` INTEGER NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `AboutCompetency_aboutPageId_sortOrder_idx`(`aboutPageId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AboutCompetency`
    ADD CONSTRAINT `AboutCompetency_aboutPageId_fkey`
    FOREIGN KEY (`aboutPageId`) REFERENCES `AboutPage`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
