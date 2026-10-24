# CineNova — complete project bundle

This ZIP includes the Next.js website, Supabase authentication, database schema, a protected catalogue admin area, and a Paystack checkout starter. It is a deployable project foundation, not a ready-to-stream commercial service: live video delivery, production payment webhooks, live currency conversion, and licensed film/TV assets still require external services and configuration.

## 1. Accounts/services you need
1. GitHub account.
2. Vercel account connected to GitHub.
3. Supabase project (authentication + PostgreSQL database).
4. Paystack account for Nigerian NGN payments. Start with test keys.
5. A licensed video hosting/streaming provider (for example, Mux or another provider that supports your rights and target regions).
6. Permission/licences for every movie, series, trailer, poster, and audio track you distribute.

## 2. Upload this ZIP to GitHub
- Download and unzip `CineNova-Complete-Project.zip`.
- Create a new GitHub repository called `cinenova`.
- Upload the CONTENTS of the unzipped folder to the repository root (not a folder nested inside another folder).
- Confirm `package.json`, `app/`, `lib/`, and `supabase/` appear at repository root.

## 3. Configure Supabase
- Create a Supabase project and open **Project Settings → API**.
- Copy the Project URL and anon/public key.
- Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and run it.
- Open **Authentication → URL Configuration**. Set Site URL to your Vercel domain after deployment, and add redirect URLs for `http://localhost:3000/**` and `https://YOUR-VERCEL-DOMAIN/**`.
- Create an account through `/login`. Confirm your email if email confirmation is enabled.
- In Supabase SQL Editor, promote your own account to admin using your actual auth user UUID:
  `update public.profiles set role='admin' where id='YOUR-AUTH-USER-UUID';`
  Find the UUID in Authentication → Users. Do not promote an account you do not control.

## 4. Deploy on Vercel
- In Vercel choose **Add New → Project**, import the GitHub repository.
- Framework should be detected as Next.js.
- Before deploying, add Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/public key
  - `NEXT_PUBLIC_SITE_URL` = your deployed URL, e.g. `https://your-project.vercel.app`
  - `PAYSTACK_SECRET_KEY` = your Paystack **test secret** key initially
- Deploy. After deployment, update Supabase redirect URLs with the exact Vercel URL. Redeploy if you change environment variables.

## 5. Test authentication and admin
- Open the deployed site and select Sign in → Create account.
- Confirm the email if required, then sign in.
- Promote your account to admin in Supabase SQL Editor (step 3).
- Visit `/admin`, add a test title with poster/backdrop URLs, and publish it.
- The homepage reads published catalogue entries from Supabase. If no records exist, it displays demonstration cards.

## 6. Paystack: important limitations
- Membership prices displayed on the website are USD base prices and the country selector uses illustrative sample conversion rates. Those values are NOT live exchange rates and are not used by checkout.
- The included checkout endpoint currently charges these Nigerian test amounts in **kobo**: Basic ₦2,890; Standard ₦5,770; Premium ₦8,890. This is a safe starter mapping, not an automatic conversion from the USD plan prices. Change the server-side mapping only after deciding the actual commercial NGN prices.
- The included payment verification route is a starter only. For production, configure a Paystack webhook with signature verification, idempotent event processing, server-trusted subscription writes, plan renewals/cancellations, failed payment handling, and receipt emails. Do not launch recurring subscriptions or advertise that the 7-day free trial is active until the trial and recurring billing logic is implemented and tested.
- Do not put `PAYSTACK_SECRET_KEY` in any `NEXT_PUBLIC_` variable or frontend file.
- International customers need a supported payment method/provider and actual local-currency price configuration. Merely showing a currency symbol is not local payment support.

## 7. Video, seasons, and episodes
- Admin currently stores title metadata and an optional playback URL. The playback button is a placeholder until a licensed video provider and secure playback-token route are integrated.
- Do not paste public links to copyrighted films or use third-party streams without permission. Use your own content or content licensed for distribution.
- For series, the SQL schema includes seasons and episodes, but season/episode management screens and next-episode playback still need to be built.
- Secure video delivery should use signed playback tokens, entitlement checks, and provider-side access controls; do not expose private source files or long-lived secret URLs.

## 8. Features included vs still needing connection/build work
Included in this bundle:
- Responsive black/champagne-gold/charcoal/burgundy storefront.
- Demo catalogue, search, filters, title detail modal.
- Supabase email/password sign-up, sign-in and password-reset email request.
- Account page, Supabase schema with profiles, titles, seasons, episodes, watchlist, progress, subscriptions and payment events.
- Role-protected admin catalogue entry form.
- Paystack NGN checkout initialization and starter verification route.
- Country selector and clearly labelled illustrative currency conversion.

Still needed before production:
- Production payment webhook, recurring billing/renewals/cancellation, verified 7-day trial logic and refund flows.
- Actual local currency pricing based on live FX and payment-provider availability.
- Licensed video provider integration, protected playback, adaptive streaming, subtitles/audio tracks.
- Complete season/episode management and player experience.
- Persistent user watchlist and continue-watching UI wired to the database.
- Admin user/subscription/payment management and audit logs.
- Security review, accessibility testing, mobile/browser QA, privacy policy, terms, support and licensing agreements.

## 9. Local development (optional)
Install Node.js 20 or later. In the project folder copy `.env.example` to `.env.local`, fill the Supabase values and run:
`npm install`
`npm run dev`
Open `http://localhost:3000`.

If using only a phone, uploading through GitHub's website is possible, but a computer is more convenient for editing environment variables and testing.
