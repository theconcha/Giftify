-- Storage policies for product-images bucket
CREATE POLICY "users can upload their own product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "product images are publicly viewable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "users can update their own product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users can delete their own product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
