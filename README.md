# NovaTrek Web App - Monorepo

This is a monorepo containing the NovaTrek travel application components.

## Structure

```
web-app/
├── frontend/         # Next.js web application
│   ├── app/         # App router pages
│   ├── components/  # React components
│   ├── lib/         # Utilities and libraries
│   └── ...
├── functions/       # Firebase Cloud Functions (to be added)
└── README.md       # This file
```

## Frontend

The frontend is a Next.js application with:
- Travel planning features
- Chat functionality
- Trip management
- Dashboard interface
- Stripe integration for subscriptions
- Firebase authentication and Firestore

See [frontend/README.md](frontend/README.md) for more details.

## Functions

Firebase Cloud Functions directory (to be configured).

## Getting Started

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Functions Development

(To be added when Firebase Functions are configured)