-- Apply after platform_migration.sql. Repair the pre-migration account only.
-- Creates a new private workspace; never attaches the account to an existing client.
BEGIN;
DO $$
DECLARE account RECORD; company UUID;
BEGIN
    SELECT id, email, raw_user_meta_data INTO account
    FROM auth.users WHERE lower(email) = 'ceo@honestone.kr';
    IF NOT FOUND THEN RAISE EXCEPTION 'Existing CEO account was not found'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = account.id) THEN
        INSERT INTO public.companies(name, industry)
        VALUES (COALESCE(NULLIF(account.raw_user_meta_data->>'company_name', ''), '어니스톤'), '미분류')
        RETURNING id INTO company;
        INSERT INTO public.profiles(id, email, full_name, role, company_id)
        VALUES (account.id, account.email,
            COALESCE(NULLIF(account.raw_user_meta_data->>'full_name', ''), split_part(account.email, '@', 1)),
            'MEMBER', company);
        INSERT INTO public.company_members(company_id, user_id, membership_role)
        VALUES (company, account.id, 'OWNER');
    END IF;
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
