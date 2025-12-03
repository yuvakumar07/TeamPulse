-- Modify invoices table to support date range instead of month/year
-- This migration adds date_from and date_to columns and removes invoice_month/invoice_year

USE employee_management;

-- Step 1: Add new date range columns
ALTER TABLE invoices
ADD COLUMN date_from DATE NULL AFTER team_id,
ADD COLUMN date_to DATE NULL AFTER date_from;

-- Step 2: Migrate existing data from month/year to date range
-- Convert existing invoice_month and invoice_year to date_from (first day of month) and date_to (last day of month)
UPDATE invoices
SET date_from = STR_TO_DATE(CONCAT(invoice_year, '-', LPAD(invoice_month, 2, '0'), '-01'), '%Y-%m-%d'),
    date_to = LAST_DAY(STR_TO_DATE(CONCAT(invoice_year, '-', LPAD(invoice_month, 2, '0'), '-01'), '%Y-%m-%d'))
WHERE invoice_month IS NOT NULL AND invoice_year IS NOT NULL;

-- Step 3: Make the new columns NOT NULL after data migration
ALTER TABLE invoices
MODIFY COLUMN date_from DATE NOT NULL,
MODIFY COLUMN date_to DATE NOT NULL;

-- Step 4: Drop old unique constraint
ALTER TABLE invoices
DROP INDEX unique_invoice;

-- Step 5: Create new unique constraint with date range
ALTER TABLE invoices
ADD UNIQUE KEY unique_invoice (project_id, team_id, date_from, date_to);

-- Step 6: Drop old index
DROP INDEX idx_invoice_date ON invoices;

-- Step 7: Create new index for date range queries
CREATE INDEX idx_invoice_date_range ON invoices(date_from, date_to);

-- Step 8: Drop old month/year columns
ALTER TABLE invoices
DROP COLUMN invoice_month,
DROP COLUMN invoice_year;
