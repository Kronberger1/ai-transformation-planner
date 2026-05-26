-- organisations
CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  config jsonb DEFAULT '{}'::jsonb
);

-- users (extends Supabase auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users,
  organisation_id uuid REFERENCES organisations(id),
  role text NOT NULL CHECK (role IN ('super_admin','org_admin','member')),
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- dimensions
CREATE TABLE dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id),
  name text NOT NULL,
  color text,
  sort_order int DEFAULT 0
);

-- time_horizons
CREATE TABLE time_horizons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id),
  label text NOT NULL,
  horizon_type text CHECK (horizon_type IN ('short','mid','long')),
  sort_order int DEFAULT 0
);

-- activities
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id),
  dimension_id uuid REFERENCES dimensions(id),
  time_horizon_id uuid REFERENCES time_horizons(id),
  title text NOT NULL,
  description text,
  owner_name text,
  status text DEFAULT 'not_started' CHECK (
    status IN ('not_started','in_progress','on_track','at_risk','blocked','complete')
  ),
  progress_pct int DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  due_date date,
  ai_suggested boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- audit_log
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id),
  user_id uuid REFERENCES users(id),
  table_name text,
  record_id uuid,
  action text CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Trigger function: auto-update updated_at on activities
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger function: audit log for activities
CREATE OR REPLACE FUNCTION audit_activities()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.organisation_id;
  ELSE
    v_org_id := NEW.organisation_id;
  END IF;

  INSERT INTO audit_log (organisation_id, user_id, table_name, record_id, action, old_values, new_values)
  VALUES (
    v_org_id,
    auth.uid(),
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER activities_audit
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW EXECUTE FUNCTION audit_activities();

-- Trigger function: handle new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, organisation_id, role, display_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'organisation_id')::uuid,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
