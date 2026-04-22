# Eli's Learning — Setup Guide
## Get the demo running in ~15 minutes

---

## Step 1 — Supabase Project

1. Go to https://supabase.com → New Project
2. Name it `elis-learning`, choose a strong password, pick Frankfurt or nearest region
3. Wait for it to provision (~2 min)

---

## Step 2 — Run the Database Schema

1. In your Supabase project → **SQL Editor** → **New Query**
2. Open `supabase/migrations/001_initial_schema.sql` from this folder
3. Paste the entire contents and click **Run**
4. You should see "Success. No rows returned."

---

## Step 3 — Create the Admin Account

1. Supabase dashboard → **Authentication** → **Users** → **Add User**
2. Email: `elizabeth@elislearning.com`
3. Password: choose a strong one, save it
4. Click **Create User** — note the **User UID** shown in the users table

---

## Step 4 — Assign Admin Role (CRITICAL)

In **SQL Editor** run this, replacing `YOUR-USER-UID` with the UID from Step 3:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR-USER-UID', 'admin');
```

---

## Step 5 — Add Teacher Accounts (repeat per teacher)

1. Authentication → Users → Add User → enter teacher's email + password
2. Note their UID
3. In SQL Editor, first create their teacher profile:

```sql
INSERT INTO teachers (name, email, specialization)
VALUES ('Teacher Name', 'teacher@email.com', 'Keyboard')
RETURNING id;
```

4. Copy the returned `id`, then link them:

```sql
INSERT INTO user_roles (user_id, role, teacher_id)
VALUES ('TEACHER-AUTH-UID', 'teacher', 'TEACHER-PROFILE-ID');
```

---

## Step 6 — Environment Variables

1. In the project root, copy `.env.example` to `.env`
2. In Supabase → **Project Settings** → **API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

Your `.env` should look like:
```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 7 — Run the App

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with Elizabeth's credentials.

---

## Step 8 — (Optional) Storage for Photos

1. Supabase → **Storage** → **New Bucket** → name: `student-photos`, make it **Public**
2. Repeat for `teacher-photos`

---

## Step 9 — Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

When prompted, add the two environment variables from Step 6.

---

## Quick Demo Data

To populate the app quickly for a demo, run this in SQL Editor:

```sql
-- Add a sample teacher
INSERT INTO teachers (name, email, specialization, joined_date)
VALUES
  ('Sarah Thompson', 'sarah@elislearning.com', 'Keyboard', '2023-01-15'),
  ('Raj Patel', 'raj@elislearning.com', 'Western Vocal', '2022-09-01');

-- Add sample students (replace teacher_id with real IDs after inserting teachers)
INSERT INTO students (name, course, level, parent_name, parent_phone, monthly_fee, enrolled_date)
SELECT
  name, course, 'Beginner', parent, phone, fee, '2024-01-01'
FROM (VALUES
  ('Aisha Mohammed', 'Keyboard', 'Mrs Mohammed', '+971501234567', 350),
  ('Rohan Sharma', 'Western Vocal', 'Mr Sharma', '+971509876543', 400),
  ('Emma Wilson', 'Art', 'Mrs Wilson', '+971551234567', 300),
  ('Fatima Al Rashid', 'Classical Dance', 'Mrs Al Rashid', '+971561234567', 350),
  ('Lucas Santos', 'Pop Vocal', 'Mr Santos', '+971571234567', 400)
) AS t(name, course, parent, phone, fee);
```

---

## Troubleshooting

**"No students showing" for a teacher** → Check that `user_roles.teacher_id` matches a real `teachers.id`

**"Permission denied" errors** → RLS is blocking you. Check `user_roles` table has a row for your user

**Fees showing wrong month** → Schema uses 1-indexed months (1=January). This is already handled in the code.

**WhatsApp links not opening** → Browser pop-up blocker. Allow pop-ups for localhost / your domain.
