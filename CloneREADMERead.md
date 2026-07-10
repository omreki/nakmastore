# White-Labeling & Cloning Guide (2026 Nakma OS Edition)

This document is the definitive source of truth for cloning the NAKMA store codebase for a new client. It includes all current system features (Community Articles, Stock Visibility, Dynamic Tax, Paystack Integration, **Admin Responsiveness overhaul**, etc.) and provides "Antigravity Prompts" to automate the process with your AI agent.

---

## 🚀 Quick Start for AI Agents (Antigravity)

**Role**: You are an expert DevOps and Full-Stack Engineer.
**Goal**: Clone, configure, and launch a new instance of this store.

### Main "Do Everything" Prompt
> "I am cloning this project for a new client named `[CLIENT_NAME]`. Please guide me through:
> 1. Cleaning the git history and node_modules.
> 2. Setting up the `.env` files for client and functions.
> 3. Running the `server/master_setup.sql` on the new Supabase project.
> 4. Deploying the `paystack-webhook` and `send-email` edge functions.
> 5. Updating the brand colors to `[brand_primary_hex]` and logo.
> 6. Verifying that the 'Community', 'Stock Visibility', and **Responsive Admin Dashboard** features are active."

---

## Phase 1: Codebase Initialization

### Steps
1.  **Duplicate Folder**: Copy the entire project to a new directory.
2.  **Clean Slate**:
    -   Delete `.git` folder.
    -   Delete `node_modules` (root and `client/`).
    -   Delete `dist` or `build` folders.
3.  **Site Identity**:
    -   Update `client/index.html` title and meta description.
    -   Replace `client/public/favicon.png` and `favicon.ico` with the new client's icons.
    -   Update `package.json` names.

### 🤖 Antigravity Prompts
> "Wipe the `.git` folder and all `node_modules` directories to ensure a fresh start. Then initialize a new git repository."
> "I want to change the site name to `[SITE_NAME]`. Update `client/index.html` and let me know where to upload the new favicon."

---

## Phase 2: Database & Backend (Supabase)

### Steps
1.  **Create Project**: New project at [database.new](https://database.new).
2.  **Run Migration**:
    -   Open SQL Editor in Supabase.
    -   Copy/Paste contents of `store/server/master_setup.sql`.
    -   **Run**. This script sets up:
        -   Tables: `products`, `categories`, `orders`, `profiles`, `team_members`, `store_settings`, `articles`, `pages`, `analytics_events`, etc.
        -   Security: Enhanced RLS Policies for all tables (Admins only for sensitive data).
        -   Defaults: Initial store settings (including `hollowText`, `brand_settings`, `product_page_settings`).
3.  **Storage Buckets**:
    -   Create **Public** buckets: `product-images`, `logo`, `assets`, `article-images`.
    -   *Tip: Ensure policies allow public read access.*
4.  **Auth**:
    -   Enable "Email/Password".
    -   Disable "Confirm Email" (optional, for speed).
    -   **Team Members**: Add admin users via the separate `team_members` table or the Admin Dashboard after launch.

### 🤖 Antigravity Prompts
> "Analyze `server/master_setup.sql` and explain what tables it creates. Then, help me run it on my new Supabase project."
> "Generate a SQL script to explicitly insert my admin email `[YOUR_EMAIL]` into the `team_members` table with the role 'admin'."

---

## Phase 3: Edge Functions (Crucial for Payments)

The store relies on Supabase Edge Functions for secure operations.

### Steps
1.  **Login**: `npx supabase login`
2.  **Link**: `npx supabase link --project-ref [YOUR_PROJECT_ID]`
3.  **Set Secrets**:
    ```bash
    npx supabase secrets set PAYSTACK_SECRET_KEY=sk_...
    npx supabase secrets set RESEND_API_KEY=re_...
    ```
4.  **Deploy**:
    ```bash
    npx supabase functions deploy paystack-webhook
    npx supabase functions deploy send-email
    ```
5.  **Webhook Configuration**:
    -   In Paystack Dashboard, set Webhook URL to: `https://[PROJECT_REF].supabase.co/functions/v1/paystack-webhook`

---

## Phase 4: Frontend Configuration

### Environment Variables (`client/.env`)
```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
VITE_ADMIN_EMAILS=[YOUR_EMAIL] (Comma separated)
VITE_PAYSTACK_PUBLIC_KEY=[pk_...]
```

---

## Phase 5: White-Labeling & Branding

### 1. Visual Identity
-   **Tailwind Config**: Update `primary` color in `client/tailwind.config.js`.
-   **Store Settings**: Update `brand_settings` in the DB (Admin Panel > Settings > Branding).
    -   *Primary Color (Hex)*
    -   *Hollow Text*
-   **Favicon**: Replace files in `client/public/`.

### 2. Feature Toggles (Admin Controlled)
-   **Stock Visibility**: Go to **Admin > Products > Settings** and toggle "Show Stock Info".
-   **Tax**: Configure in **Admin > Settings > Taxes**.
-   **Interactive Admin Dashboard**: Full row-click interactivity is active by default. Rows in Orders, Products, and Customers will navigate you to their respective detail/edit views automatically.

### 🤖 Antigravity Prompts
> "Update the global primary color to `[HEX]` in tailwind config and ensure the `StoreSettingsContext` defaults are aligned."
> "Check the `OrderManagementPage` and `AdminProductsPage` to ensure all row-click navigation is working for the new client."

---

## Phase 6: System Verification

1.  **Admin Responsiveness**: Open the Admin Dashboard on a mobile device to verify the glossy card layout and interactive widgets.
2.  **Payment Flow**: Test a purchase with Paystack (Test Mode).
3.  **Webhooks**: Verify that a successful payment updates the order `payment_status` to `Paid` in Supabase.
4.  **SEO**: Verify `SEO.jsx` is pulling dynamic titles for Products and Articles.

---

## Troubleshooting

-   **Paystack 400 Error**: Check if `PAYSTACK_SECRET_KEY` is set in Edge Function secrets.
-   **Images Broken**: Verify Storage Bucket policies are "Public".
-   **"Duplicate Key" Error**: Common in `StoreSettingsContext`. Check for duplicate JSON keys.
-   **RLS Denied**: Ensure `master_setup.sql` was run successfully and you are logged in as a user listed in `team_members` or `profiles` with `admin` role.

---
*Maintained by NAKMA Engineering.*
