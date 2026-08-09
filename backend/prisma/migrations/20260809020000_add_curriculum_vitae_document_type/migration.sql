-- AlterTable
ALTER TABLE `PrivateDocument`
    MODIFY `type` ENUM('curriculumVitae', 'gibbCertificate', 'bwdCertificate', 'secondarySchoolCertificate', 'uekCompetenceRecord') NOT NULL DEFAULT 'uekCompetenceRecord';
