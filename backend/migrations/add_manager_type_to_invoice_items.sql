-- Add manager_type column to invoice_items table to track manager bonus
USE employee_management;

ALTER TABLE invoice_items
ADD COLUMN manager_type VARCHAR(50) DEFAULT NULL COMMENT 'Manager type: Offshore or Onsite (NULL for regular employees)';
