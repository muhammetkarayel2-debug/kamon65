-- Supabase Storage Upload Policies
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- evraklar bucket - müşteri yüklemeleri
CREATE POLICY "evraklar_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'evraklar');

CREATE POLICY "evraklar_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'evraklar');

-- iskan-belgeleri bucket - wizard iskan yüklemeleri
CREATE POLICY "iskan_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'iskan-belgeleri');

CREATE POLICY "iskan_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'iskan-belgeleri');

-- admin-evraklar bucket - admin belge gönderimi
CREATE POLICY "admin_evrak_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'admin-evraklar');

CREATE POLICY "admin_evrak_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'admin-evraklar');
