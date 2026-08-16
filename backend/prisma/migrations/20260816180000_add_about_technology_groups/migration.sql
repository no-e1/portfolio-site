-- CreateTable
CREATE TABLE `AboutTechnologyGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aboutPageId` INTEGER NOT NULL,
    `heading` VARCHAR(160) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `AboutTechnologyGroup_aboutPageId_sortOrder_idx`(`aboutPageId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `AboutTechnology` ADD COLUMN `aboutTechnologyGroupId` INTEGER NULL;

-- Preserve existing technologies in one editable group per About page.
INSERT INTO `AboutTechnologyGroup` (`aboutPageId`, `heading`, `sortOrder`)
SELECT DISTINCT `aboutPageId`, 'Technologien', 0
FROM `AboutTechnology`;

UPDATE `AboutTechnology` AS `technology`
INNER JOIN `AboutTechnologyGroup` AS `technologyGroup`
    ON `technologyGroup`.`aboutPageId` = `technology`.`aboutPageId`
    AND `technologyGroup`.`sortOrder` = 0
SET `technology`.`aboutTechnologyGroupId` = `technologyGroup`.`id`;

ALTER TABLE `AboutTechnology`
    MODIFY `aboutTechnologyGroupId` INTEGER NOT NULL;

-- Replace the direct page relation with the technology-group relation.
ALTER TABLE `AboutTechnology`
    DROP FOREIGN KEY `AboutTechnology_aboutPageId_fkey`;

DROP INDEX `AboutTechnology_aboutPageId_sortOrder_idx` ON `AboutTechnology`;

ALTER TABLE `AboutTechnology`
    DROP COLUMN `aboutPageId`;

CREATE INDEX `AboutTechnology_aboutTechnologyGroupId_sortOrder_idx`
    ON `AboutTechnology`(`aboutTechnologyGroupId`, `sortOrder`);

ALTER TABLE `AboutTechnologyGroup`
    ADD CONSTRAINT `AboutTechnologyGroup_aboutPageId_fkey`
    FOREIGN KEY (`aboutPageId`) REFERENCES `AboutPage`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AboutTechnology`
    ADD CONSTRAINT `AboutTechnology_aboutTechnologyGroupId_fkey`
    FOREIGN KEY (`aboutTechnologyGroupId`) REFERENCES `AboutTechnologyGroup`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
