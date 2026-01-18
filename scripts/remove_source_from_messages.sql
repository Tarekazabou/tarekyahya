-- Remove the 'source' key from message metadata for all existing rows
-- Run this against your database (e.g., psql or Supabase SQL editor)

UPDATE messages
SET metadata = metadata - 'source'
WHERE metadata ? 'source';

-- Optionally verify the cleanup:
-- SELECT id, metadata->>'source' AS old_source FROM messages WHERE metadata ? 'source';
-- Should return zero rows after running the UPDATE above.
