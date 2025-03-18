-- Table for annual report deadlines
CREATE TABLE IF NOT EXISTS `annual_report_deadlines` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `dueDate` datetime NOT NULL,
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `lateFee` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','completed','overdue') NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `annual_report_deadlines_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for annual report filings
CREATE TABLE IF NOT EXISTS `annual_report_filings` (
  `id` varchar(191) NOT NULL,
  `deadlineId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `receiptUrl` text,
  `reportUrl` text,
  `status` enum('pending_payment','payment_received','completed','rejected') NOT NULL DEFAULT 'pending_payment',
  `adminNotes` text,
  `userNotes` text,
  `filedDate` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `deadlineId` (`deadlineId`),
  KEY `userId` (`userId`),
  CONSTRAINT `annual_report_filings_ibfk_1` FOREIGN KEY (`deadlineId`) REFERENCES `annual_report_deadlines` (`id`) ON DELETE CASCADE,
  CONSTRAINT `annual_report_filings_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for filing requirements
CREATE TABLE IF NOT EXISTS `filing_requirements` (
  `id` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `details` text,
  `isActive` boolean NOT NULL DEFAULT TRUE,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default filing requirements
INSERT INTO `filing_requirements` (`id`, `title`, `description`, `details`, `isActive`) VALUES
(UUID(), 'Annual Report', 'Your company is required to file an annual report with the Secretary of State by July 15 each year.', 'Filing fee: $75.00\nLate fee: $25.00 per month\nRequired information: Company address, registered agent, officer information', TRUE),
(UUID(), 'Tax Filings', 'Annual tax filings are due by September 30. Consult with your accountant for specific requirements.', NULL, TRUE);

