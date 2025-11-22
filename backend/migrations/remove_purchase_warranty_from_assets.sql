-- Remove purchase_price and warranty_expiry_date columns from assets table
ALTER TABLE assets
  DROP COLUMN purchase_price,
  DROP COLUMN warranty_expiry_date;
