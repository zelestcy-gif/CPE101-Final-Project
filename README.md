Course Exploration Portal

A full-featured Course Management System prototype built with Vanilla HTML/JS and Supabase. This application allows instructors to manage course content dynamically and students to view materials, submit assignments, and communicate with staff.

Features

Student Dashboard

Dynamic Content: View Announcements, Syllabus, Lessons, and Project Groups fetched in real-time.

Gallery: View course activity photos.

Submission Portal: Upload assignment files (PDFs, Zips) directly to cloud storage.

Status Tracking: See which assignments have been submitted (Green Badge) and remove submissions if needed.

Direct Messages: Send messages to instructors (Anonymous or Signed).

Admin Panel (Protected)

Secure Access: Only users listed in the admins database table can access this page.

Content Management: Create/Delete Announcements, Syllabus items, Lessons, and Project Groups.

Media Management: Upload photos to the Gallery.

Assignment Management: Create new assignment "buckets" for students.

Inbox: Read Direct Messages (shows sender email unless sent anonymously).

Grading/Review: View and download student submissions.

Tech Stack

Frontend: HTML5, CSS3, Vanilla JavaScript (ES Modules).

Backend: Supabase (PostgreSQL Database).

Auth: Supabase Auth (Email/Password).

Storage: Supabase Storage (for images and assignment files).

Security: PostgreSQL Row Level Security (RLS) Policies.

Setup Guide

1. Prerequisites

A Supabase account.

Node.js (optional, only if using npm start to serve).

VS Code "Live Server" extension (alternative to Node.js).

2. Supabase Setup

Create a new Supabase project.

Go to the SQL Editor and run the schema setup (see "Database Schema" section below).

Go to Storage, create a new bucket named course-content, and toggle Public to ON.

Go to Authentication settings and disable "Confirm Email" if you want instant logins for testing.

3. Local Installation

Clone or download this repository.

Create a supabaseConfig.js file (or edit the existing one) with your credentials:

// supabaseConfig.js
// Use your specific Project URL and Anon Key
window.__SUPABASE_URL = "[https://your-project-id.supabase.co](https://your-project-id.supabase.co)";
window.__SUPABASE_ANON_KEY = "your-anon-key";


(Note: The project is set up to fetch these from Vercel environment variables in production, or window globals/localStorage in development).

Run the project:

Using VS Code: Right-click index.html -> "Open with Live Server".

Using Node: Run npm install then npm start.

Database Schema & SQL Setup

To make the app function, run the following SQL in your Supabase Dashboard:

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

-- 3. Admin Security Table
create table admins ( email text primary key, created_at timestamptz default now() );

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

-- 5. Helper Function for Admin Check
create or replace function is_admin() returns boolean as $$
begin
  return exists (select 1 from admins where email = auth.jwt() ->> 'email');
end;
$$ language plpgsql security definer;

-- 6. Add Policies (Summary)
-- Run specific policy creation scripts to:
-- - Allow public read on content.
-- - Allow is_admin() to insert/delete content.
-- - Allow authenticated users to insert submissions/messages.


How to make yourself an Admin

Since the Admin Panel is protected by the database, you must manually add your email to the admins table via the SQL Editor:

INSERT INTO admins (email) VALUES ('your-email@example.com');


Project Structure

index.html: Login / Landing page.

dashboard.html: Main student view (Syllabus, Assignments, etc.).

admin.html: Instructor CMS (Content Entry, Inbox).

script.js: Logic for Login/Auth.

dashboard.js: Logic for fetching data, rendering lists, and handling uploads.

supabaseConfig.js: Supabase client initialization.

style.css: Global styling variables and layout.

Deployment (Vercel)

Push code to GitHub.

Import project into Vercel.

In Vercel Project Settings > Environment Variables, add:

SUPABASE_URL

SUPABASE_ANON_KEY

Deploy! The api/config.js (serverless function) will handle passing these keys to the frontend securely.