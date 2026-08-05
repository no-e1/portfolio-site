-- AlterTable
ALTER TABLE `PrivateDocument`
    ADD COLUMN `type` ENUM('gibbCertificate', 'bwdCertificate', 'secondarySchoolCertificate', 'uekCompetenceRecord') NOT NULL DEFAULT 'uekCompetenceRecord';
