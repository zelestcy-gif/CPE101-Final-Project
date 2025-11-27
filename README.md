# Course Exploration Portal

A full-featured Course Management System prototype built with Vanilla HTML/JS and Supabase. This application allows instructors to manage course content dynamically and students to view materials, submit assignments, and communicate with staff.

## Features

### Student Dashboard
* **Dynamic Content:** View Announcements, Syllabus, Lessons, and Project Groups fetched in real-time.
* **Secure Authentication:**
    * **Google OAuth Login:** One-click sign-in with Google.
    * **Domain Restriction:** Sign-ups restricted to specific email domains (e.g., `@kmutt.ac.th`).
    * **Password Reset:** Secure email-based password recovery flow.
* **Gallery:** View course activity photos.
* **Submission Portal:** Upload assignment files (PDFs, Zips) directly to cloud storage.
* **Status Tracking:** See which assignments have been submitted (Green Badge) and remove submissions if needed.
* **Direct Messages:** Send messages to instructors (Anonymous or Signed).

### Admin Panel (Protected)
* **Secure Access:** Only users listed in the `admins` database table can access this page.
* **Content Management:** Create/Delete Announcements, Syllabus items, Lessons, and Project Groups.
* **Media Management:** Upload photos to the Gallery.
* **Assignment Management:** Create new assignment "buckets" for students.
* **Inbox:** Read Direct Messages (shows sender email unless sent anonymously).
* **Grading/Review:** View and download student submissions.

## Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules).
* **Backend:** Supabase (PostgreSQL Database).
* **Auth:** Supabase Auth (Email/Password & Google OAuth).
* **Storage:** Supabase Storage (for images and assignment files).
* **Security:** PostgreSQL Row Level Security (RLS) Policies.

---

## Setup Guide

### 1. Prerequisites
* A [Supabase](https://supabase.com/) account.
* A [Google Cloud Console](https://console.cloud.google.com/) project (for Google Login).
* Node.js (optional, only if using `npm start` to serve).
* VS Code "Live Server" extension (alternative to Node.js).

### 2. Supabase Setup
1.  **Create Project:** Create a new Supabase project.
2.  **Database:** Go to the SQL Editor and run the schema setup (see "Database Schema" section below).
3.  **Storage:** Go to Storage, create a new bucket named `course-content`, and toggle **Public** to **ON**.
4.  **Auth Settings (Crucial):**
    * Go to **Authentication > Providers > Google** and enter your Client ID/Secret (see Google Setup below).
    * Go to **Authentication > URL Configuration > Redirect URLs**. Add the following:
        * `http://127.0.0.1:5500/dashboard.html` (Localhost)
        * `http://127.0.0.1:5500/update-password.html` (Localhost)
        * `https://your-vercel-app.vercel.app/dashboard.html` (Production)
        * `https://your-vercel-app.vercel.app/update-password.html` (Production)
    * Go to **Authentication > Sign In / Providers > Email** (or Attack Protection) and **DISABLE** "Enable email enumeration protection". (This allows the app to tell users if they have already signed up).

### 3. Google Cloud Setup
1.  Create a project in Google Cloud Console.
2.  Go to **APIs & Services > Credentials**.
3.  Create OAuth Client ID (Web Application).
4.  Add your Supabase Callback URL to **Authorized redirect URIs**:
    * `https://<your-project-ref>.supabase.co/auth/v1/callback`

### 4. Local Installation
1.  Clone or download this repository.
2.  Create a `supabaseConfig.js` file (or edit the existing one) with your credentials:
    ```javascript
    // supabaseConfig.js
    window.__SUPABASE_URL = "[https://your-project-id.supabase.co](https://your-project-id.supabase.co)";
    window.__SUPABASE_ANON_KEY = "your-anon-key";
    ```
    *(Note: In production/Vercel, these should be set as Environment Variables).*
3.  Run the project:
    * **VS Code:** Right-click `index.html` -> "Open with Live Server".
    * **Node:** Run `npm install` then `npm start`.

---

## Database Schema & SQL Setup

Run the following SQL in your Supabase Dashboard to create tables and policies:

```sql
-- 1. Content Tables
create table announcements ( id uuid default gen_random_uuid() primary key, title text not null, content text not null, created_at timestamptz default now() );
create table lessons ( id uuid default gen_random_uuid() primary key, week_number text not null, title text not null, description text, created_at timestamptz default now() );
create table syllabus ( id uuid default gen_random_uuid() primary key, week_number text not null, topic text not null, deliverables text, has_badge boolean default false, created_at timestamptz default now() );
create table project_groups ( id uuid default gen_random_uuid() primary key, name text not null, category text, description text, created_at timestamptz default now() );
create table gallery ( id uuid default gen_random_uuid() primary key, caption text, image_url text not null, created_at timestamptz default now() );

-- 2. Interaction Tables
create table assignments ( id uuid default gen_random_uuid() primary key, title text not null, due_date text, format text, created_at timestamptz default now() );
create table submissions ( id uuid default gen_random_uuid() primary key, assignment_id uuid references assignments(id) on delete cascade, student_email text, file_url text not null, submitted_at timestamptz default now() );
create table messages ( id uuid default gen_random_uuid() primary key, topic text, message text not null, is_anonymous boolean default false, student_email text, created_at timestamptz default now() );

-- 3. Security & Auth Tables
create table admins ( email text primary key, created_at timestamptz default now() );

create table allowed_domains ( id uuid default gen_random_uuid() primary key, domain_name text not null, created_at timestamptz default now() );
-- Insert default domain
insert into allowed_domains (domain_name) values ('@kmutt.ac.th');

-- 4. Enable RLS
alter table announcements enable row level security;
alter table lessons enable row level security;
alter table syllabus enable row level security;
alter table project_groups enable row level security;
alter table gallery enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table messages enable row level security;
alter table admins enable row level security;
alter table allowed_domains enable row level security;

-- 5. Policies
-- Allow public read access to domains so login page can check them
create policy "Public read domains" on allowed_domains for select using (true);
-- (Note: You must run separate scripts to add policies for other tables based on your needs)

-- 6. Helper Function for Admin Check
create or replace function is_admin() returns boolean as $$
begin
  return exists (select 1 from admins where email = auth.jwt() ->> 'email');
end;
$$ language plpgsql security definer;