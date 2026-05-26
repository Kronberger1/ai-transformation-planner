-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT organisation_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT role = 'super_admin' FROM public.users WHERE id = auth.uid()
$$;

-- ============================================================
-- USERS TABLE
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: read own org"
  ON users FOR SELECT
  USING (organisation_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "users: org_admin can insert in own org"
  ON users FOR INSERT
  WITH CHECK (
    organisation_id = get_my_org_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin','super_admin')
  );

CREATE POLICY "users: org_admin can update in own org"
  ON users FOR UPDATE
  USING (organisation_id = get_my_org_id())
  WITH CHECK (organisation_id = get_my_org_id());

-- ============================================================
-- ACTIVITIES TABLE
-- ============================================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities: read own org"
  ON activities FOR SELECT
  USING (organisation_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "activities: insert own org only"
  ON activities FOR INSERT
  WITH CHECK (organisation_id = get_my_org_id());

CREATE POLICY "activities: update own org only — validates drag targets"
  ON activities FOR UPDATE
  USING (organisation_id = get_my_org_id())
  WITH CHECK (
    organisation_id = get_my_org_id()
    AND dimension_id IN (
      SELECT id FROM dimensions WHERE organisation_id = get_my_org_id()
    )
    AND time_horizon_id IN (
      SELECT id FROM time_horizons WHERE organisation_id = get_my_org_id()
    )
  );

CREATE POLICY "activities: delete own org only"
  ON activities FOR DELETE
  USING (organisation_id = get_my_org_id());

-- ============================================================
-- DIMENSIONS & TIME_HORIZONS
-- ============================================================
ALTER TABLE dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_horizons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dimensions: read own org"
  ON dimensions FOR SELECT
  USING (organisation_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "dimensions: admin can modify"
  ON dimensions FOR ALL
  USING (
    organisation_id = get_my_org_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin','super_admin')
  );

CREATE POLICY "time_horizons: read own org"
  ON time_horizons FOR SELECT
  USING (organisation_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "time_horizons: admin can modify"
  ON time_horizons FOR ALL
  USING (
    organisation_id = get_my_org_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin','super_admin')
  );

-- ============================================================
-- AUDIT LOG — read-only for org members, write via trigger only
-- ============================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log: read own org"
  ON audit_log FOR SELECT
  USING (organisation_id = get_my_org_id() OR is_super_admin());

-- No INSERT/UPDATE/DELETE policies — writes via SECURITY DEFINER trigger only

-- ============================================================
-- ORGANISATIONS
-- ============================================================
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organisations: members read own"
  ON organisations FOR SELECT
  USING (id = get_my_org_id() OR is_super_admin());

CREATE POLICY "organisations: super_admin manages all"
  ON organisations FOR ALL
  USING (is_super_admin());

-- ============================================================
-- NEVER USE THESE ANTI-PATTERNS:
-- USING (auth.uid() IS NOT NULL)  ← exposes all orgs to any logged-in user
-- USING (true)                     ← fully public
-- ============================================================
