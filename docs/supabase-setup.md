# Supabase setup: phone sign-in and the database

The app runs in **local preview mode** until these steps are done. In that mode there is no sign-in, and progress is saved in the browser only.

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) and create a new project. **Singapore** (`ap-southeast-1`) is the closest region to Bangladesh.
2. Save the database password somewhere safe.

## 2. Create the tables

1. Open **SQL Editor → New query**.
2. Paste in the whole of `supabase/migrations/0001_init.sql` and click **Run**.
3. Check **Table Editor**. It should list `profiles`, `journeys`, `task_completions`, `advisors`, `ads` and the other tables.

## 3. Turn on phone sign-in

Open **Authentication → Sign In / Providers → Phone** and enable it.

Supabase needs an SMS provider to send real codes. For development, you don't need one: use **test phone numbers**, which sign in with a fixed code and send no SMS.

- In the Phone provider settings, find **Test Phone Numbers and OTPs**.
- Add for example `8801700000000=123456`.
- In the app, sign in with `01700000000` and the code `123456`.

Supabase may still ask you to pick an SMS provider before it saves the setting. If so, choose Twilio and enter placeholder values; test numbers don't use it.

### Real SMS for Bangladesh (before launch)

Supabase's built-in providers (Twilio, MessageBird, Vonage, Textlocal) all work, but they are expensive for Bangladeshi numbers. A cheaper option is a **Send SMS Hook** (Authentication → Hooks), which passes each code to a local gateway. That is a small edge function, to be added later.

## 4. Connect the app

1. Open **Project Settings → API**.
2. Copy `apps/web/.env.example` to `apps/web/.env.local`.
3. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`: the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the `anon` `public` key (it is safe in the browser; row-level security protects the data)
4. Restart the dev server: `npm run dev --workspace @dreamer/web`.

Never put the `service_role` key in the web app.

## 5. What happens now

| Moment | What the app does |
|---|---|
| First visit | Goes to `/signin`: mobile number, then a 6-digit code |
| First sign-in | Supabase creates the user, and a database trigger creates their `profiles` row |
| Preview progress in this browser | Moved into the new account automatically, then cleared locally |
| Onboarding finished | Profile saved in `profiles`; the generated journey saved in `journeys` (one active per student) |
| Task ticked | A row in `task_completions` (unticking deletes it) |
| Sign out | Link at the bottom of the home screen |

## Making yourself an admin

After you sign in once, run this in the SQL editor, using your own number:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where phone = '8801700000000');
```
