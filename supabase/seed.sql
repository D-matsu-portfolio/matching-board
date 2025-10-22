--
-- Clear existing public data to avoid conflicts
--
DELETE FROM public.applications;
DELETE FROM public.postings;
DELETE FROM public.companies;
DELETE FROM public.profiles;

--
-- Clear existing auth data
-- Note: This is more complex due to dependencies. Run these in order.
--
DELETE FROM auth.users WHERE email IN ('company@example.com', 'applicant@example.com');

--
-- Create sample users
--
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, email_change_token_current, email_change_sent_at)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'authenticated', 'authenticated', 'company@example.com', crypt('password123', gen_salt('bf')), '2023-01-01 00:00:00+00', 'recovery-token-1', '2023-01-01 00:00:00+00', '2023-01-01 00:00:00+00', '{"provider":"email","providers":["email"]}', '{}', '2023-01-01 00:00:00+00', '2023-01-01 00:00:00+00', 'confirmation-token-1', '', '', '', NULL),
    ('00000000-0000-0000-0000-000000000000', 'b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'authenticated', 'authenticated', 'applicant@example.com', crypt('password123', gen_salt('bf')), '2023-01-01 00:00:00+00', 'recovery-token-2', '2023-01-01 00:00:00+00', '2023-01-01 00:00:00+00', '{"provider":"email","providers":["email"]}', '{}', '2023-01-01 00:00:00+00', '2023-01-01 00:00:00+00', 'confirmation-token-2', '', '', '', NULL);

--
-- Create corresponding identities with provider_id
--
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
    ('company@example.com', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', '{"sub":"a1b2c3d4-e5f6-7890-1234-567890abcdef","email":"company@example.com"}', 'email', '2023-01-01 00:00:00+00', '2023-01-01 00:00:00+00', '2023-01-01 00:00:00+00'),
    ('applicant@example.com', 'b2c3d4e5-f6a7-8901-2345-67890abcdef0', '{"sub":"b2c3d4e5-f6a7-8901-2345-67890abcdef0","email":"applicant@example.com"}', 'email', '2023-01-01 00:00:00+00', '2023-01-01 00:00:00+00', '2023-01-01 00:00:00+00');

--
-- Create corresponding profiles
--
INSERT INTO public.profiles (id, username, full_name, bio)
VALUES
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'TechCorpAdmin', '田中 太郎 (企業)', 'TechCorpの採用担当です。'),
    ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'ApplicantUser', '鈴木 一郎 (応募者)', '新しい挑戦を探しています。');

--
-- Create a sample company owned by company@example.com
--
INSERT INTO public.companies (name, description, website, owner_id)
VALUES
    ('TechCorp', '革新的なテクノロジーで未来を創造する企業です。', 'https://example.com', 'a1b2c3d4-e5f6-7890-1234-567890abcdef');

--
-- Create sample postings for TechCorp
--
INSERT INTO public.postings (title, description, position_type, location, company_id)
VALUES
    ('フロントエンドエンジニア', 'Reactを使ったWebアプリケーションの開発。UI/UXの改善にも携わっていただきます。', 'エンジニア', '東京', (SELECT id FROM public.companies WHERE name = 'TechCorp')),
    ('バックエンドエンジニア', 'Node.jsとPostgreSQLを用いたAPI開発。大規模トラフィックを捌く経験が積めます。', 'エンジニア', '大阪', (SELECT id FROM public.companies WHERE name = 'TechCorp')),
    ('UI/UXデザイナー', 'ユーザー中心設計に基づいた、使いやすいインターフェースのデザイン。', 'デザイナー', 'フルリモート', (SELECT id FROM public.companies WHERE name = 'TechCorp'));

--
-- Create a sample application from applicant@example.com to the Frontend Engineer posting
--
INSERT INTO public.applications (user_id, posting_id, status, message)
VALUES
    ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', (SELECT id FROM public.postings WHERE title = 'フロントエンドエンジニア'), 'applied', '貴社のフロントエンドエンジニア職に大変興味があり、応募いたしました。');