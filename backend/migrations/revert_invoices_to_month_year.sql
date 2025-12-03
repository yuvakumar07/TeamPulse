-- Revert invoices table from date range back to month/year
-- This migration removes date_from and date_to columns and restores invoice_month/invoice_year

USE employee_management;

-- Step 1: Add back the month/year columns
ALTER TABLE invoices
ADD COLUMN invoice_month INT NULL AFTER team_id,
ADD COLUMN invoice_year INT NULL AFTER invoice_month;

-- Step 2: Migrate existing data from date range to month/year
-- Extract month and year from date_from
UPDATE invoices
SET invoice_month = MONTH(date_from),
    invoice_year = YEAR(date_from)
WHERE date_from IS NOT NULL;

-- Step 3: Make the columns NOT NULL after data migration
ALTER TABLE invoices
MODIFY COLUMN invoice_month INT NOT NULL,
MODIFY COLUMN invoice_year INT NOT NULL;

-- Step 4: Drop the unique constraint with date range
ALTER TABLE invoices
DROP INDEX unique_invoice;

-- Step 5: Create the original unique constraint with month/year
ALTER TABLE invoices
ADD UNIQUE KEY unique_invoice (project_id, team_id, invoice_month, invoice_year);

-- Step 6: Drop the date range index
DROP INDEX idx_invoice_date_range ON invoices;

-- Step 7: Create the original index for month/year
CREATE INDEX idx_invoice_date ON invoices(invoice_year, invoice_month);

-- Step 8: Drop the date range columns
ALTER TABLE invoices
DROP COLUMN date_from,
DROP COLUMN date_to;
