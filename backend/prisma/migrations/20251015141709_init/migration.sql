-- CreateTable
CREATE TABLE `auditlog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(50) NOT NULL,
    `entity` VARCHAR(50) NOT NULL,
    `entityId` INTEGER NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `idNumber` VARCHAR(50) NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contactlead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(30) NULL,
    `message` TEXT NOT NULL,
    `source` VARCHAR(100) NOT NULL DEFAULT 'Formulaire site',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `propertyId` INTEGER NULL,

    INDEX `ContactLead_propertyId_fkey`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coownership` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyId` INTEGER NOT NULL,
    `clientId` INTEGER NOT NULL,
    `share` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `role` VARCHAR(30) NOT NULL DEFAULT 'coowner',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CoOwnership_clientId_fkey`(`clientId`),
    UNIQUE INDEX `CoOwnership_propertyId_clientId_key`(`propertyId`, `clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(20) NOT NULL DEFAULT 'sale',
    `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
    `basePrice` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `commissionRate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `expectedClose` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `propertyId` INTEGER NULL,
    `clientId` INTEGER NOT NULL,

    INDEX `Deal_clientId_fkey`(`clientId`),
    INDEX `Deal_propertyId_fkey`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `category` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `payee` VARCHAR(100) NULL,
    `dealId` INTEGER NULL,
    `propertyId` INTEGER NULL,

    INDEX `Expense_dealId_fkey`(`dealId`),
    INDEX `Expense_propertyId_fkey`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inquiry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyId` INTEGER NOT NULL,
    `fullName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `message` TEXT NULL,
    `type` ENUM('visit', 'info') NOT NULL DEFAULT 'info',
    `status` ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Inquiry_propertyId_fkey`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(50) NOT NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'open',
    `dealId` INTEGER NOT NULL,

    UNIQUE INDEX `Invoice_number_key`(`number`),
    INDEX `Invoice_dealId_fkey`(`dealId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagecontent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `page` VARCHAR(50) NOT NULL,
    `section` VARCHAR(50) NOT NULL,
    `key` VARCHAR(50) NOT NULL,
    `value` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PageContent_page_section_key_key`(`page`, `section`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(14, 2) NOT NULL,
    `method` VARCHAR(30) NOT NULL DEFAULT 'cash',
    `reference` VARCHAR(100) NULL,
    `dealId` INTEGER NOT NULL,
    `invoiceId` INTEGER NULL,

    INDEX `Payment_dealId_fkey`(`dealId`),
    INDEX `Payment_invoiceId_fkey`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paymentschedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dealId` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `paymentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentSchedule_dealId_fkey`(`dealId`),
    INDEX `PaymentSchedule_paymentId_fkey`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `coverImage` VARCHAR(255) NULL,
    `status` VARCHAR(20) NULL,
    `location` VARCHAR(150) NULL,
    `category` VARCHAR(50) NULL,
    `startedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projectmedia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `kind` VARCHAR(20) NOT NULL DEFAULT 'image',
    `url` VARCHAR(255) NOT NULL,
    `alt` VARCHAR(200) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectMedia_projectId_fkey`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `property` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(15, 2) NULL,
    `location` VARCHAR(191) NULL,
    `category` VARCHAR(50) NULL,
    `bedrooms` INTEGER NULL,
    `bathrooms` INTEGER NULL,
    `area_m2` DECIMAL(10, 2) NULL,
    `surfaceHabitable` INTEGER NULL,
    `type` VARCHAR(50) NULL,
    `yearOfConstruction` INTEGER NULL,
    `capacity` INTEGER NULL,
    `status` VARCHAR(191) NULL,
    `mainImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Property_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `propertyimage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyId` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `alt` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PropertyImage_propertyId_fkey`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `title` VARCHAR(150) NULL,
    `description` TEXT NULL,
    `content` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `slug` VARCHAR(100) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NULL,
    `isStaff` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projectmedia` ADD CONSTRAINT `projectmedia_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propertyimage` ADD CONSTRAINT `propertyimage_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
