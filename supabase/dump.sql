

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_published_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set published_at when status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at = timezone('utc'::text, now());
  END IF;
  
  -- Clear published_at when status changes away from 'published'
  IF NEW.status != 'published' AND OLD.status = 'published' THEN
    NEW.published_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_published_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_auth_users_is_active"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the user has at least one active organization membership
  IF EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_active = true
  ) THEN
    -- Update is_active to true if user is active in at least one organization
    UPDATE auth_users 
    SET is_active = true, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_active = false;
  ELSE
    -- Update is_active to false if user is not active in any organization
    UPDATE auth_users 
    SET is_active = false, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_active = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_auth_users_is_active"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_auth_users_is_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the user has at least one owner role in any organization
  IF EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
    AND role = 'owner' 
    AND is_active = true
  ) THEN
    -- Update is_owner to true if user is owner in at least one organization
    UPDATE auth_users 
    SET is_owner = true, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_owner = false;
  ELSE
    -- Update is_owner to false if user is not owner in any organization
    UPDATE auth_users 
    SET is_owner = false, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_owner = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_auth_users_is_owner"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version" character varying(50) NOT NULL,
    "release_notes" "text",
    "download_url" "text" NOT NULL,
    "file_size" bigint DEFAULT 0 NOT NULL,
    "platform" character varying(20) DEFAULT 'win32'::character varying NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "is_critical" boolean DEFAULT false,
    "minimum_version" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "created_by" "uuid",
    "is_latest" boolean DEFAULT false NOT NULL,
    "architecture" "text"
);


ALTER TABLE "public"."app_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_users" (
    "id" "uuid" NOT NULL,
    "is_first_login" boolean DEFAULT true,
    "password_updated" boolean DEFAULT false,
    "last_login" timestamp with time zone,
    "otp_requests_count" integer DEFAULT 0,
    "last_otp_request" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_active" boolean DEFAULT true,
    "email" "text" DEFAULT 'test@gmail.coom'::"text" NOT NULL,
    "has_purchased" boolean DEFAULT false,
    "is_owner" boolean DEFAULT false
);


ALTER TABLE "public"."auth_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "location" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid",
    "contact" "text"
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issue_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "email" "text" NOT NULL,
    "screenshot_url" "text",
    "user_id" "uuid",
    "user_agent" "text",
    "app_version" "text",
    "platform" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "notes" "text",
    CONSTRAINT "issues_issue_type_check" CHECK (("issue_type" = ANY (ARRAY['bug_report'::"text", 'feedback'::"text", 'suggestion'::"text"]))),
    CONSTRAINT "issues_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "issues_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."issues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "logo" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "currency" "text" DEFAULT 'GHS'::"text",
    "logo_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "brand_colors" "jsonb" DEFAULT '{}'::"jsonb",
    "notification_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "theme_name" "text"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "avatar" "text",
    "phone" "text",
    "gender" "text",
    "date_of_birth" "date",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid" NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."user_branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    CONSTRAINT "user_organizations_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'branch_admin'::"text", 'write'::"text", 'read'::"text"])))
);


ALTER TABLE "public"."user_organizations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_versions"
    ADD CONSTRAINT "app_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_versions"
    ADD CONSTRAINT "app_versions_version_platform_key" UNIQUE ("version", "platform");



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_user_branch_org_unique" UNIQUE ("user_id", "branch_id", "organization_id");



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_user_id_organization_id_key" UNIQUE ("user_id", "organization_id");



CREATE INDEX "idx_app_versions_created_at" ON "public"."app_versions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_app_versions_is_latest" ON "public"."app_versions" USING "btree" ("is_latest", "platform", "status");



CREATE INDEX "idx_app_versions_platform" ON "public"."app_versions" USING "btree" ("platform");



CREATE INDEX "idx_app_versions_status" ON "public"."app_versions" USING "btree" ("status");



CREATE INDEX "idx_app_versions_version" ON "public"."app_versions" USING "btree" ("version");



CREATE INDEX "idx_auth_users_id_profiles" ON "public"."auth_users" USING "btree" ("id");



CREATE INDEX "idx_branches_is_active" ON "public"."branches" USING "btree" ("is_active");



CREATE INDEX "idx_branches_org_id" ON "public"."branches" USING "btree" ("organization_id");



CREATE INDEX "idx_issues_created_at" ON "public"."issues" USING "btree" ("created_at");



CREATE INDEX "idx_issues_issue_type" ON "public"."issues" USING "btree" ("issue_type");



CREATE INDEX "idx_issues_priority" ON "public"."issues" USING "btree" ("priority");



CREATE INDEX "idx_issues_status" ON "public"."issues" USING "btree" ("status");



CREATE INDEX "idx_issues_user_id" ON "public"."issues" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_name" ON "public"."organizations" USING "btree" ("name");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_user_branches_branch_id" ON "public"."user_branches" USING "btree" ("branch_id");



CREATE INDEX "idx_user_branches_created_by" ON "public"."user_branches" USING "btree" ("created_by");



CREATE INDEX "idx_user_branches_organization_id" ON "public"."user_branches" USING "btree" ("organization_id");



CREATE INDEX "idx_user_branches_user_id" ON "public"."user_branches" USING "btree" ("user_id");



CREATE INDEX "idx_user_branches_user_id_profiles" ON "public"."user_branches" USING "btree" ("user_id");



CREATE INDEX "idx_user_organizations_created_by" ON "public"."user_organizations" USING "btree" ("created_by");



CREATE INDEX "idx_user_organizations_organization_id" ON "public"."user_organizations" USING "btree" ("organization_id");



CREATE INDEX "idx_user_organizations_user_id" ON "public"."user_organizations" USING "btree" ("user_id");



CREATE INDEX "idx_user_organizations_user_id_auth_users" ON "public"."user_organizations" USING "btree" ("user_id");



CREATE INDEX "idx_user_organizations_user_id_profiles" ON "public"."user_organizations" USING "btree" ("user_id");



CREATE INDEX "user_branches_created_by_idx" ON "public"."user_branches" USING "btree" ("created_by");



CREATE INDEX "user_organizations_created_by_idx" ON "public"."user_organizations" USING "btree" ("created_by");



CREATE OR REPLACE TRIGGER "handle_auth_users_updated_at" BEFORE UPDATE ON "public"."auth_users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_app_versions_published_at" BEFORE UPDATE ON "public"."app_versions" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at"();



CREATE OR REPLACE TRIGGER "trigger_update_is_active_on_delete" AFTER DELETE ON "public"."user_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_auth_users_is_active"();



CREATE OR REPLACE TRIGGER "trigger_update_is_active_on_insert" AFTER INSERT ON "public"."user_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_auth_users_is_active"();



CREATE OR REPLACE TRIGGER "trigger_update_is_active_on_update" AFTER UPDATE ON "public"."user_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_auth_users_is_active"();



CREATE OR REPLACE TRIGGER "trigger_update_is_owner_on_delete" AFTER DELETE ON "public"."user_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_auth_users_is_owner"();



CREATE OR REPLACE TRIGGER "trigger_update_is_owner_on_insert" AFTER INSERT ON "public"."user_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_auth_users_is_owner"();



CREATE OR REPLACE TRIGGER "trigger_update_is_owner_on_update" AFTER UPDATE ON "public"."user_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_auth_users_is_owner"();



CREATE OR REPLACE TRIGGER "update_app_versions_updated_at" BEFORE UPDATE ON "public"."app_versions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_branches_updated_at" BEFORE UPDATE ON "public"."branches" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_issues_updated_at" BEFORE UPDATE ON "public"."issues" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_branches_updated_at" BEFORE UPDATE ON "public"."user_branches" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_organizations_updated_at" BEFORE UPDATE ON "public"."user_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."app_versions"
    ADD CONSTRAINT "app_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_id_fkey1" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_created_by_fkey1" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_created_by_fkey2" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_branches"
    ADD CONSTRAINT "user_branches_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_created_by_fkey1" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_created_by_fkey2" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_user_id_fkey2" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE SET NULL;



CREATE POLICY "Allow all access to authenticated users" ON "public"."branches" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all access to authenticated users" ON "public"."organizations" TO "authenticated" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all access to authenticated users" ON "public"."user_branches" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all access to authenticated users" ON "public"."user_organizations" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users all access" ON "public"."app_versions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users all access" ON "public"."auth_users" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users all access" ON "public"."profiles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."issues" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."auth_users" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."issues" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."organizations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



ALTER TABLE "public"."app_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_branches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_organizations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_published_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_published_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_published_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_auth_users_is_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_auth_users_is_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_auth_users_is_active"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_auth_users_is_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_auth_users_is_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_auth_users_is_owner"() TO "service_role";


















GRANT ALL ON TABLE "public"."app_versions" TO "anon";
GRANT ALL ON TABLE "public"."app_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."app_versions" TO "service_role";



GRANT ALL ON TABLE "public"."auth_users" TO "anon";
GRANT ALL ON TABLE "public"."auth_users" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_users" TO "service_role";



GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";



GRANT ALL ON TABLE "public"."issues" TO "anon";
GRANT ALL ON TABLE "public"."issues" TO "authenticated";
GRANT ALL ON TABLE "public"."issues" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_branches" TO "anon";
GRANT ALL ON TABLE "public"."user_branches" TO "authenticated";
GRANT ALL ON TABLE "public"."user_branches" TO "service_role";



GRANT ALL ON TABLE "public"."user_organizations" TO "anon";
GRANT ALL ON TABLE "public"."user_organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_organizations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
