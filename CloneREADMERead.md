# White-Labeling & Cloning Guide

This document outlines the step-by-step process for cloning the NOESIS store codebase for a new client, white-labeling the branding, setting up a fresh database, and deploying the application.

Included in each section are **"Antigravity Prompts"**—commands you can copy and paste to me (your AI assistant) to help automate or streamline the specific task.

---

## Phase 1: Codebase Setup
You need a fresh copy of the code that is legally and technically separate from the original project.

### Steps:
1.  **Duplicate the Folder**: Copy the entire project folder to a new location.
2.  **Reset Git History**: Remove the old version control tracking to start fresh.
3.  **Clean Dependencies**: Remove existing `node_modules` to ensure a clean install for the new environment.

### 🤖 Antigravity Prompts
> "Create a copy of this entire project in a new directory called `[NEW_CLIENT_NAME]/store`."

> "Remove the `.git` directory and the `node_modules` folder from the current directory so I can start fresh."

---

## Phase 2: Database Setup (Supabase)
For the new client to have their own products and users, they need a dedicated Supabase project.

### Steps:
1.  **Create a New Project**: Go to [Supabase.com](https://supabase.com) and create a new project.
2.  **Run Core Migrations**: Apply database scripts from the `server/` and `supabase/migrations/` directories in this specific order to ensure tables exist before they are referenced:
    - `server/create_store_settings.sql` - Core store configuration
    - `supabase/migrations/create_team_members_table.sql` - Admin & Team roles
    - `server/create_orders.sql` - Orders and Order items
    - `server/product_variations_setup.sql` - Product variations and stock alerts
    - `server/create_articles_schema.sql` - Article/community system
    - `server/create_analytics.sql` - User interaction tracking
    - `server/create_pages_table.sql` - Custom page content
    - `supabase/migrations/update_team_members_policies.sql` - Finalize security policies

3.  **Setup Storage Buckets**: Create and configure the following **Public** storage buckets:
    - `product-images` - For product photos
    - `logo` - For store branding assets
    - `profile-pictures` - For user avatars (optional)

4.  **Auth Configuration**: 
    - Enable Email/Password login in Authentication settings.
    - Set up email provider (Resend recommended).
    - Configure redirects to your new domain in the Auth settings.

5.  **Edge Functions**: Deploy functions from `supabase/functions/` to handle background tasks:
    - `send-email` - Customer/Admin notifications
    - `create-user` - Admin user invitation system

### 🤖 Antigravity Prompts
> "Consolidate all SQL migration files in `server` and `supabase/migrations` into one optimized setup script for a new project."

> "Show me the deployment commands for the Supabase Edge Functions in `supabase/functions/`."

---

## Phase 3: Configuration & Environment
Connect the code to the new database and configure system settings.

### Steps:
1.  **Update Environment Variables**:
    - Edit `client/.env`:
      ```env
      VITE_SUPABASE_URL=[YOUR_NEW_PROJECT_URL]
      VITE_SUPABASE_ANON_KEY=[YOUR_NEW_ANON_KEY]
      VITE_ADMIN_EMAILS=[PRIMARY_ADMIN_EMAIL]
      ```
    - `VITE_ADMIN_EMAILS` allows the specified email to bypass initial permission checks to set up the store.
    
2.  **Payment Gateway Setup**:
    - Add your keys to `.env` if using Paystack:
      ```env
      VITE_PAYSTACK_PUBLIC_KEY=[YOUR_PAYSTACK_PUBLIC_KEY]
      ```
    
3.  **Update Package Info**:
    - Edit `client/package.json` to update the project name (e.g., `"new-client-store"`).

4.  **Initialize Primary Admin**:
    - After deployment, sign up with the email used in `VITE_ADMIN_EMAILS`.
    - Once logged in, go to **Settings → Team Management** and confirm your admin role.

### 🤖 Antigravity Prompts
> "Update the `client/.env` file. Change the Supabase URL to `[NEW_URL]`, the Anon Key to `[NEW_KEY]`, and the Admin Email to `[NEW_EMAIL]`."

> "Show me a list of all environment variables I need for a production Vercel deployment."

---

## Phase 4: White-Labeling (Branding)
Change the visual identity (colors, fonts, logos) to match the new client.

### Steps:
1.  **Color Palette**: 
    - Modify `client/tailwind.config.js`.
    - Update the `colors` object (primarily `primary` and its variants).

2.  **Logos & Icons**: 
    - Replace assets in `client/public/`.
    - Upload the main store logo via **Admin Dashboard → Settings → General**.

3.  **Hero & Content (Admin Dashboard)**:
    - **Homepage**: Upload new Hero images and Philosophy section visuals via Settings.
    - **Navigation**: Configure menu links (Shop, Men, Women, etc.) via Settings → Navigation.
    - **Search & UI**: The store includes a global search and optimized mobile menu that automatically adapts to your logo and colors.

4.  **Meta Data**: 
    - Update `<title>` in `client/index.html`.
    - Configure SEO defaults (Site Name, Global Description) in **Settings → SEO**.

### 🤖 Antigravity Prompts
> "I want to rebrand the site. Change the 'primary' color in `tailwind.config.js` to `[HEX_CODE]`."

> "Sync all branding assets. Update the site title in `index.html` and verify if the logo path is correct in `Navbar.jsx`."

---

## Phase 5: Verification & Launch
Ensure every critical system is functional before public launch.

### Critical Tests:
1.  **Order Flow**: Add a product, search for it using the new search bar, and complete a checkout with a test card.
2.  **Email Alerts**: Verify you receive an order confirmation email via the Resend integration.
3.  **Mobile Navigation**: Test the enhanced mobile menu on a real device or responsive simulator.
4.  **Admin Command**: Ensure you can edit products and update store settings.

### 🤖 Antigravity Prompts
> "Generate a QA checklist focusing on the search functionality, cart flow, and payment integration."

---

## Important Database Tables
Ensure your new Supabase project has all these tables active:

- **products** / **categories** - The core catalog structure.
- **product_variations** - Handles sizes, colors, and specific stock.
- **orders** / **order_items** - Sales and transaction data.
- **store_settings** - The "brain" of the store (Branding, SEO, Policies).
- **team_members** - Role-based access control (RBAC).
- **articles** / **article_categories** - Community/Blog content.
- **analytics_events** - Logs for user behavior and store performance.
- **admin_notifications** - Real-time alerts for low stock or new orders.

---

## Troubleshooting
- **Dashboard Access**: If you see "Access Denied", verify your email is in the `team_members` table or matches the `VITE_ADMIN_EMAILS` env variable.
- **Images Not Loading**: Ensure the `product-images` and `logo` buckets are set to **Public** in Supabase Storage.
- **Search Not Returning Results**: Verify that the search term matches product names or categories (search is case-insensitive).

---

For custom development or urgent issues, consult with your development team.
