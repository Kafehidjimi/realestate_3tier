-- AlterTable
ALTER TABLE `project` ADD COLUMN `deliveredAt` DATETIME(3) NULL,
    ADD COLUMN `surface` DECIMAL(12, 2) NULL,
    ADD COLUMN `units` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `projectmedia` ADD CONSTRAINT `projectmedia_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propertyimage` ADD CONSTRAINT `propertyimage_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
