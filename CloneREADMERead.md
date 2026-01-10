# White-Labeling & Cloning Guide (2026 Edition)

This document outlines the step-by-step process for cloning the NAKMA store codebase for a new client. It covers white-labeling the branding, setting up a fresh Supabase database, configuring automated emails, and deploying to Vercel.

Included in each section are **"Antigravity Prompts"**—commands you can copy and paste to me (your AI assistant) to automate these tasks.

---

## Phase 1: Codebase Initialization
Prepare the project folder for a new identity.

### Steps:
1.  **Duplicate the Folder**: Copy the current codebase to a new directory.
2.  **Reset Git**: Delete the `.git` folder to remove old history and start a new repository.
3.  **Wipe Dependencies**: Delete `node_modules` in both root and `client/` to ensure clean installations.
4.  **Rename Project**: Update `name` and `description` in `package.json` and `client/package.json`.

### 🤖 Antigravity Prompts
> "Copy this entire project into a new folder named `[NEW_CLIENT_NAME]` and initialize a fresh git repository."

> "Clean all `node_modules` and re-install dependencies using `npm install`."

---

## Phase 2: Database Setup (Supabase)
Create the "brain" of the store.

### Steps:
1.  **Create Supabase Project**: Go to [Supabase.com](https://supabase.com) and create a new project.
2.  **Run Master Script**: Execute `server/master_setup.sql` in the Supabase SQL Editor. This script is idempotent and creates all tables, functions, and initial settings.
    - *Note: Ensure the `pages` table includes `status` and `custom_css` columns.*
3.  **Configure Storage**: Create the following **Public** buckets:
    - `product-images` - For inventory photos.
    - `logo` - For official branding.
    - `assets` - For hero images and banners.
4.  **Auth Settings**: 
    - Enable Email login.
    - Disable "Confirm Email" for faster testing (re-enable for production).

### 🤖 Antigravity Prompts
> "Read `server/master_setup.sql` and verify if it contains the latest schema for `pages` (status and custom_css) and `store_settings` (brand_settings)."

---

## Phase 3: Configuration & Environment
Link the code to your new Supabase project.

### Steps:
1.  **Environment Variables**: Update `client/.env` with your new credentials.
    ```env
    VITE_SUPABASE_URL=[YOUR_PROJECT_URL]
    VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
    VITE_ADMIN_EMAILS=[YOUR_EMAIL]
    VITE_PAYSTACK_PUBLIC_KEY=[OPTIONAL_KEY]
    ```
2.  **Resend (Email) Integration**:
    - Get an API key from [Resend.com](https://resend.com).
    - Insert the key into the `store_settings` table via SQL or Admin Dashboard:
      ```sql
      UPDATE store_settings SET resend_config = '{"apiKey": "re_...", "fromEmail": "onboarding@resend.dev"}' WHERE id = 1;
      ```

### 🤖 Antigravity Prompts
> "Config the `client/.env` with my new Supabase credentials and set `VITE_ADMIN_EMAILS` to `[YOUR_EMAIL]`."

---

## Phase 4: White-Labeling (Visual Identity)
Personalize the store's look and feel.

### Steps:
1.  **Branding Palette**: 
    - Modify `client/tailwind.config.js`. Update the `primary` color (Default: `#b82063`).
    - Sync the brand color in `client/src/context/StoreSettingsContext.jsx` if you want it as a fallback.
2.  **Upload Logo**: Log into the Admin Dashboard (`/login`), navigate to **Settings → General**, and upload the new logo.
3.  **Hero Section Configuration**:
    - Hero sections are designed to stay visible even without an image to maintain layout consistency.
    - If no image is added, the site provides a sleek dark fallback with gradients.
4.  **SEO Setup**:
    - Update the site title in `client/index.html`.
    - Set global SEO defaults (Meta Title, Description) in **Admin → Settings → SEO**.

### 🤖 Antigravity Prompts
> "Update the primary brand color in `tailwind.config.js` to `[HEX_CODE]` and refresh the UI theme."

> "Verify that the SEO component is correctly implemented in `MenPage.jsx`, `WomenPage.jsx`, and `AboutPage.jsx`."

---

## Phase 5: Content & Pages
Populate the store with products and info.

### Steps:
1.  **Add Categories**: Use the Admin Dashboard to create your main categories (e.g., Men, Women, Accessories).
2.  **Create Products**: Add items with variations (Sizes/Colors).
3.  **Custom Pages**: Create informational pages (Privacy, Shipping, Terms) via **Admin → Pages**.
    - These pages support **Markdown** for content and **Custom CSS** for unique styling per page.
    - Every page automatically gets its own SEO metadata fields.

### 🤖 Antigravity Prompts
> "Create a sample 'Privacy Policy' page in the `pages` table with some professional boilerplate text."

---

## Phase 6: Launch Checklist
Run these tests before going live.

1.  **Order Success**: Perform a full checkout (including payment if integrated).
2.  **Admin Alerts**: Verify that a new order triggers an admin notification.
3.  **Responsive Check**: Ensure the mobile menu and product grid look premium on all screens.
4.  **Email Receipt**: Check your inbox for the customer order confirmation email.

### 🤖 Antigravity Prompts
> "Final scan: Check for any hardcoded 'NAKMA' references that still need to be swapped for the new client name."

---

## Troubleshooting & FAQ
- **Images don't show**: Ensure Storage buckets are set to **Public**.
- **Admin Login fails**: Verify your email is in the `VITE_ADMIN_EMAILS` list in `.env`.
- **Hero text is white/invisible**: Hero sections use white text by default; ensure your background color or image provides enough contrast.
- **Paystack doesn't load**: Ensure your Public Key is correct and you are viewing the site over HTTPS (or localhost).

---
*Created for Advanced Agentic Coding - NAKMA Store Framework.*
