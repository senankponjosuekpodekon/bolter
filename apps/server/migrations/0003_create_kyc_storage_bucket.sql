-- Create KYC documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/png',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all KYC documents
CREATE POLICY "Admins can view kyc documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Users can upload their own KYC documents
CREATE POLICY "Users can upload their own kyc documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can delete KYC documents
CREATE POLICY "Admins can delete kyc documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
