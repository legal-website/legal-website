-- Create amendments table
CREATE TABLE amendments (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    userId VARCHAR(191) NOT NULL,
    type VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    status ENUM('pending', 'in_review', 'waiting_for_payment', 'payment_received', 'approved', 'rejected', 'closed') NOT NULL DEFAULT 'pending',
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    documentUrl TEXT,
    receiptUrl TEXT,
    paymentAmount DECIMAL(10, 2),
    notes TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create amendment status history table
CREATE TABLE amendment_status_history (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    amendmentId VARCHAR(191) NOT NULL,
    status ENUM('pending', 'in_review', 'waiting_for_payment', 'payment_received', 'approved', 'rejected', 'closed') NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    notes TEXT,
    FOREIGN KEY (amendmentId) REFERENCES amendments(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_amendments_userId ON amendments(userId);
CREATE INDEX idx_amendments_status ON amendments(status);
CREATE INDEX idx_amendment_history_amendmentId ON amendment_status_history(amendmentId);

