#  MultiCart – Multi-Vendor Marketplace

A full-stack multi-vendor marketplace built with Next.js and TypeScript.

This platform allows vendors to publish their shops, admins to verify them, and users to browse and purchase products from verified vendors.

---

## 🚀 Tech Stack

⚡ Next.js

🔷 TypeScript

🎨 Tailwind CSS

🔐 Authentication System

🗄 Database (MongoDB / Prisma / etc.)

🌐 REST API


---

## 🎯 Core Concept

### This project follows a 3-role architecture:

## 👨‍💼 Vendor

1. Create account

2. Publish shop

3. Add products

4. Manage inventory

5. Track orders

## 🛡 Admin

1. Review vendor applications

2. Verify / Reject vendor shops

3. Control marketplace listings

4. Manage platform data

## 🛒 User

1. Browse verified shops

2. View vendor products

3. Add to cart

Place orders

## 🧩 Features
## 🏪 Vendor Side

1. Shop registration system

2. Shop verification status

3. Product management

4. Dashboard panel

## 🛡 Admin Panel

1. Vendor approval system

2. Shop listing control

3. Marketplace moderation

## 👤 User Side

1. Browse verified vendors

2. View vendor-specific products

3. Add to cart

4. Checkout system

---
# Architecture Overview
```
User → Browse Verified Shops → Add to Cart → Place Order

Vendor → Publish Shop → Admin Verification → Listed Publicly

Admin → Approve / Reject Vendors → Control Marketplace
```
---

## 📂 Project Structure
```
MULTICART/
│
├── src/
│   ├── app/              # Next.js App Router (Pages & Layout)
│   │   ├── view-product/ # Product details page
│   │   ├── favicon.ico
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   │
│   ├── assets/           # Static images & media
│   │
│   ├── component/        # Reusable UI components
│   │
│   ├── hooks/            # Custom React hooks
│   │
│   ├── lib/              # Utility & helper functions
│   │
│   ├── models/           # Database schemas & models
│   │
│   ├── redux/            # Global state management
│   │
│   ├── auth.ts           # Authentication configuration
│   ├── global.d.ts       # Global TypeScript types
│   ├── InitUser.tsx      # User initialization logic
│   ├── next-auth.d.ts    # NextAuth type definitions
│   ├── Provider.tsx      # Context/Redux provider
│   └── proxy.ts          # API proxy handling
│
├── .env.local            # Environment variables
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md

```
---

# ⚙️ Installation
```
git clone https://github.com/your-username/multi-cart.git
cd multi-cart
npm install
npm run dev
```
---

## 📈 Future Improvements

💳 Payment Gateway Integration

📦 Order Tracking

⭐ Vendor Rating System

💬 Real-time Chat

📊 Analytics Dashboard

🚀 SEO Optimization

## 👨‍💻 Author

### Sourav Kumar
---

## 📄 License

### MIT License

---
## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
