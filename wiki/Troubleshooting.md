# Troubleshooting Guide

This document provides diagnostic steps and verified resolutions for common operational, development, and deployment issues.

---

## 1. Authentication & Clerk Issues

### Problem: Infinite redirect loop after Google Sign-in
* **Root Cause**: Mismatch between Clerk's configured redirect URLs and application environment variables.
* **Resolution**:
  1. Open the Clerk Dashboard ──► **Configure** ──► **Paths**.
  2. Verify that:
     * Sign-in URL = `/login`
     * Sign-up URL = `/signup`
     * After sign-in = `/dashboard`
     * After sign-up = `/onboarding`
  3. Ensure your production domain is listed under **Allowed Callback URLs** in Clerk.

### Problem: Non-institutional user blocked during sign-up
* **Root Cause**: The platform enforces `@glbajajgroup.org` Google accounts.
* **Resolution**: If the user is an invited external mentor or VIP guest, add their email address to the `WhitelistedEmail` table through the `/admin` console with the appropriate role (`STUDENT` or `MENTOR`).

---

## 2. Database & Connection Pooling Issues

### Problem: `PrismaClientInitializationError: Can't reach database server`
* **Root Cause**: Password contains unencoded special characters or incorrect pooler port.
* **Resolution**:
  1. Ensure `DATABASE_URL` connects to port `6543` with `?pgbouncer=true`.
  2. Ensure `DIRECT_URL` connects to port `5432`.
  3. URL-encode special characters in the password (e.g. replace `?` with `%3F`, `#` with `%23`).

### Problem: `PrismaClientKnownRequestError: Prepared statement already exists`
* **Root Cause**: Connecting to PgBouncer in transaction mode without `?pgbouncer=true` flag.
* **Resolution**: Append `?pgbouncer=true` to the `DATABASE_URL` query string.

---

## 3. Environment & Token Issues

### Problem: Application crashes on startup with `NEXTAUTH_SECRET is too short`
* **Root Cause**: Security hardening requires `NEXTAUTH_SECRET` to be at least 32 characters long to prevent session forgery.
* **Resolution**: Generate a secure 48-byte hex string and update your `.env` / hosting settings:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

---

## 4. Search & Directory Issues

### Problem: Search input does not immediately update results on the first letter
* **Root Cause**: By design, text search requires at least 2 characters before activating the 300ms debounce timer to prevent single-letter query storms against the database.
* **Resolution**: Type at least 2 characters or click a popular suggestion chip (e.g. `+ React`, `+ Python`).

### Problem: Search results show outdated data after a profile update
* **Root Cause**: In-memory `QueryClient` cache has not been invalidated.
* **Resolution**: Mutation handlers automatically invoke `QueryClient.invalidate('teammates:*')` or `QueryClient.invalidate('teams:*')`. If testing manually, refresh the page or clear the client session.

---

## 5. Avatar Streaming Issues

### Problem: Avatar upload fails with `415 Unsupported Media Type`
* **Root Cause**: The image file is not an allowed raster format (e.g. SVG or PDF).
* **Resolution**: Upload only standard raster formats: JPEG, PNG, WebP, or GIF.

### Problem: Avatar upload fails with `413 Payload Too Large`
* **Root Cause**: Uploaded avatar exceeds the **500 KB** safety ceiling.
* **Resolution**: Compress the profile image before uploading.

---

[← Deployment](Deployment) • [Next: Changelog →](Changelog)
