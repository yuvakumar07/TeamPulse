-- Add offshore and onsite manager columns to invoices table

USE employee_management;

-- Add manager columns to invoices table
ALTER TABLE invoices
ADD COLUMN offshore_manager VARCHAR(100) DEFAULT NULL,
ADD COLUMN onsite_manager VARCHAR(100) DEFAULT NULL;
