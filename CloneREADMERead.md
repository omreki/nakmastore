# White-Labeling & Cloning Guide (2026 Ultimate Edition)

This document is the definitive source of truth for cloning the NAKMA store codebase for a new client. It includes all recent system features (Community Articles, Stock Visibility, Dynamic Tax, Paystack Integration, etc.) and provides "Antigravity Prompts" to automate the process with your AI agent.

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
> 6. Verifying that the 'Community' and 'Stock Visibility' features are active."

---

## Phase 1: Codebase Initialization

### Steps
1.  **Duplicate Folder**: Copy the entire project to a new directory.
2.  **Clean Slate**:
    -   Delete `.git` folder.
    -   Delete `node_modules` (root and `client/`).
    -   Delete `dist` or `build` folders.
3.  **Rename**: Update `package.json` names.

### 🤖 Antigravity Prompts
> "Wipe the `.git` folder and all `node_modules` directories to ensure a fresh start. Then initialize a new git repository."

---

## Phase 2: Database & Backend (Supabase)

### Steps
1.  **Create Project**: New project at [database.new](https://database.new).
2.  **Run Migration**:
    -   Open SQL Editor in Supabase.
    -   Copy/Paste contents of `store/server/master_setup.sql`.
    -   **Run**. This script is idempotent and sets up:
        -   Tables: `products`, `orders`, `profiles`, `team_members`, `store_settings`, `articles`, `pages`, etc.
        -   Security: RLS Policies for all tables.
        -   Defaults: Initial store settings (including `hollowText`, `product_page_settings`).
3.  **Storage Buckets**:
    -   Create **Public** buckets: `product-images`, `logo`, `assets`, `article-images`.
    -   *Tip: Ensure policies allow public read access.*
4.  **Auth**:
    -   Enable "Email/Password".
    -   Disable "Confirm Email" (optional, for speed).
    -   **Team Members**: Add admin users via the separate `team_members` table or the Admin Dashboard after launch.

### 🤖 Antigravity Prompts
> "Analyze `server/master_setup.sql` and explain what tables it creates. Then, help me run it on my new Supabase project."
> "Generate a SQL script to explicitly insert my admin email `[YOUR_EMAIL]` into the `team_members` table as an 'admin'."

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

### 🤖 Antigravity Prompts
> "Help me deploy the `paystack-webhook` function. What secrets do I need to set in Supabase first?"

---

## Phase 4: Frontend Configuration

### Environment Variables (`client/.env`)
```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
VITE_ADMIN_EMAILS=[YOUR_EMAIL] (Comma separated)
VITE_PAYSTACK_PUBLIC_KEY=[pk_...]
```

### 🤖 Antigravity Prompts
> "Create a new `.env` file in the client directory with these placeholders and ask me for the values."

---

## Phase 5: White-Labeling & Branding

### 1. Visual Identity
-   **Tailwind Config**: Update `primary` color in `client/tailwind.config.js`.
-   **Store Settings**: Update `brand_settings` in the DB (can be done via Admin Panel).
    -   *Primary Color*
    -   *Hollow Text* (Leave empty to disable, or set to "BRANDNAME")
-   **Logo**: Upload to `General Settings`.

### 2. Feature Toggles
-   **Stock Visibility**: Go to **Admin > Products > Settings** and toggle "Show Stock Info".
-   **Tax**: Configure in **Admin > Settings > Taxes**.
-   **Community**: The blog/article system is active by default. Create categories in **Admin > Community**.

### 🤖 Antigravity Prompts
> "Update the global primary color to `[HEX]` in tailwind config and `StoreSettingsContext` defaults."
> "I want to disable the 'Hollow Text' on the homepage. How do I do that?"

---

## Phase 6: Launch & Verification Checklist

1.  **Payment Flow**: Test a purchase with Paystack (Test Mode).
2.  **Webhooks**: Verify that a successful payment updates the order `payment_status` to `Paid` in Supabase `orders` table.
3.  **Emails**: Ensure `send-email` logs success for order confirmations.
4.  **Responsiveness**: Check Mobile Menu (Framer Motion animations) and Checkout flow on phone.
5.  **SEO**: Verify `SEO.jsx` is pulling dynamic titles for Products and Articles.

---

## Troubleshooting

-   **Paystack 400 Error**: Check if `PAYSTACK_SECRET_KEY` is set in Edge Function secrets. Check if `VITE_PAYSTACK_PUBLIC_KEY` is correct in client.
-   **Images Broken**: Verify Storage Bucket policies are "Public".
-   **"Duplicate Key" Error**: Common in `StoreSettingsContext`. Check for duplicate JSON keys in the file if you recently edited it.
-   **Emails Not Sending**: Check `store_settings.resend_config` is valid JSON and the API Key is active.

---
*Maintained by NAKMA Engineering.*
