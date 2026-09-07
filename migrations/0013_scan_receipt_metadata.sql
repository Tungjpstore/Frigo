-- Migration 0013: receipt-level metadata and item pricing for async/sync scans.
-- Additive columns keep existing fridge scan rows and clients compatible.
ALTER TABLE scans ADD COLUMN merchant_name TEXT;
ALTER TABLE scans ADD COLUMN invoice_number TEXT;
ALTER TABLE scans ADD COLUMN purchase_date TEXT;
ALTER TABLE scans ADD COLUMN total_amount_vnd REAL;

ALTER TABLE scan_items ADD COLUMN unit_price_vnd REAL;
ALTER TABLE scan_items ADD COLUMN total_price_vnd REAL;

