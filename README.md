# ItemIsta Admin Panel

Admin dashboard for **itemista.com** — built with React 19, Tailwind CSS 4, and Supabase.

## Architecture

```
itemista.com         → Public eCommerce (frontend/)
admin.itemista.com   → Admin Dashboard  (admin/)
                       │
                       └─ Same Supabase Backend & Database
```

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 19, Vite, React Router 7    |
| Styling    | Tailwind CSS 4                    |
| Icons      | Lucide React                      |
| Charts     | Recharts                          |
| Backend    | Supabase (PostgreSQL, Auth, Storage) |
| Hosting    | Vercel / Netlify / VPS            |

## Features

- **Dashboard** — Total products, users, orders, revenue, recent activity
- **Product Management** — Full CRUD with image uploads via Supabase Storage
- **Order Management** — View, filter, and update order status
- **User Management** — View all users, roles, login history, metadata
- **Settings** — Admin account info, environment config, quick links
- **Authentication** — Admin-only login with role validation
- **RLS Security** — Database-level access control (admin role check)

## Getting Started

### 1. Install Dependencies

```bash
cd admin
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MAIN_SITE_URL=https://itemista.com
```

**Use the same Supabase project** as the main website.

### 3. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```
supabase/05-admin-migrations.sql
```

This creates:
- `orders` table with full schema
- RLS policies for admin CRUD on products and orders
- `product-images` storage bucket with admin upload policies

### 4. Set Admin Role

In the Supabase SQL Editor, promote a user to admin:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin@email.com';
```

### 5. Run Development Server

```bash
npm run dev
```

Opens at `http://localhost:5174`

## Project Structure

```
admin/
├── src/
│   ├── main.jsx                    # Entry point
│   ├── index.css                   # Tailwind + custom theme
│   ├── lib/supabase.js             # Supabase client
│   ├── context/AuthContext.jsx     # Admin auth with RBAC
│   ├── routes/index.jsx            # Route definitions
│   ├── layouts/AdminLayout.jsx     # Sidebar + Header + Outlet
│   ├── components/
│   │   ├── guards/AdminRoute.jsx   # Route protection
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx         # Collapsible sidebar
│   │   │   └── Header.jsx          # Top bar with user info
│   │   └── ui/                     # Reusable UI components
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Settings.jsx
│   │   ├── products/               # CRUD pages
│   │   ├── orders/                 # Order management
│   │   └── users/                  # User management
│   ├── services/adminService.js    # All Supabase API calls
│   └── utils/                      # Constants & helpers
├── supabase/05-admin-migrations.sql
├── .env.example
├── vite.config.js
└── package.json
```

## Deployment

### Vercel / Netlify

```bash
npm run build
# Deploy dist/ folder
# Set environment variables in dashboard
# Configure custom domain: admin.itemista.com
```

### DNS (CNAME)

| Type  | Name  | Value                        |
|-------|-------|------------------------------|
| CNAME | admin | your-deployment-url.vercel.app |

## Security

1. **Frontend**: AdminRoute guard checks `isAuthenticated && isAdmin`
2. **Auth**: Login rejects non-admin users
3. **Database**: RLS policies enforce admin-only write operations
4. **Storage**: Product image upload restricted to admin role
5. **Subdomain**: Separate deployment from public site
