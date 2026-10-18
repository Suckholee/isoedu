-- Existing private bucket only. Policies, ownership and public=false remain unchanged.
UPDATE storage.buckets SET file_size_limit=104857600,
allowed_mime_types=ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/x-hwp','application/haansofthwp','application/vnd.hancom.hwp','application/hwp+zip','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','image/png','image/jpeg']
WHERE id='iso-vault' AND public=false;
SELECT id,public,file_size_limit FROM storage.buckets WHERE id='iso-vault';
