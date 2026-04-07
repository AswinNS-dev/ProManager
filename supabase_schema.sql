-- 1. DROP OLD TABLES (CLEAN SLATE)
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS task_files CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS project_files CASCADE;
DROP TABLE IF EXISTS team_memberships CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS system_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. CREATE NEW TABLES

-- Table for Individual People
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT,
  email TEXT UNIQUE NOT NULL,
  dob TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Department/Group Names
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Join table: Which members belong to which teams
CREATE TABLE team_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table (Linked to a Team)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  budget TEXT,
  status TEXT DEFAULT 'Active',
  assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  tasks_total INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table (Linked to Project)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Todo',
  due_date TIMESTAMPTZ,
  assigned_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments Table (Linked to Project)
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files Table (Linked to Project)
CREATE TABLE project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  size_kb INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Security for testing
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;


-- 1. Create your Custom User Table for Logins
CREATE TABLE IF NOT EXISTS public.system_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text,
  role text DEFAULT 'Employee' CHECK (role IN ('Manager', 'Employee')),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Insert your first Admin (Commander) Account
INSERT INTO public.system_users (username, password, full_name, role)
VALUES ('admin', 'password123', 'Fleet Commander', 'Manager')
ON CONFLICT (username) DO NOTHING;

-- This script retroactively creates logins for your existing roster
INSERT INTO public.system_users (username, password, full_name, role)
SELECT 
  lower(replace(full_name, ' ', '')) || coalesce(replace(dob, '-', ''), '01012000') as username,
  coalesce(replace(dob, '-', ''), '01012000') as password,
  full_name,
  'Employee' as role
FROM public.team_members
ON CONFLICT (username) DO NOTHING;
