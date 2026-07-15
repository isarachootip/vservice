-- Add status_updated_date column to repair_request
ALTER TABLE repair_request
ADD COLUMN IF NOT EXISTS status_updated_date TIMESTAMP(6);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_status_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update status_updated_date if status column actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_date = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS repair_request_status_update_trigger ON repair_request;

-- Create the trigger
CREATE TRIGGER repair_request_status_update_trigger
BEFORE UPDATE ON repair_request
FOR EACH ROW
EXECUTE FUNCTION update_status_updated_date();
