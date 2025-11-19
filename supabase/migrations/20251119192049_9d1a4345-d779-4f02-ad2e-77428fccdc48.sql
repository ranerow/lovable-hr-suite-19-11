-- Tornar bucket employee-documents público para permitir URLs públicas
UPDATE storage.buckets 
SET public = true 
WHERE id = 'employee-documents';