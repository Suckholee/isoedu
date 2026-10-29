-- Run after document_validity_migration.sql. UTC 00:00 = Asia/Seoul 09:00.
-- Private worker; cron executes as the migration owner, never through an anonymous HTTP endpoint.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('honestone-document-validity-daily','0 0 * * *','SELECT public.run_document_checks();');
SELECT jobname,schedule,command,active FROM cron.job WHERE jobname='honestone-document-validity-daily';
