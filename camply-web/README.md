# Camply Web

A modern React application for campus management and academic assistance.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Backend API server

### Environment Setup

1. **Copy environment template:**

   ```bash
   cp .env.example .env.local
   ```

2. **Configure environment variables in `.env.local`:**

   ```env
   # Required: Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Required: Backend API Configuration
   VITE_BACKEND_URL=http://localhost:8001  # For development
   # VITE_BACKEND_URL=https://your-production-backend.com  # For production

   # Optional: Application Configuration
   VITE_APP_ENV=development
   VITE_APP_VERSION=1.0.0
   ```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run with type checking
npm run type-check

# Run linting
npm run lint
```

## 🏗️ Production Deployment

### Environment Variables for Production

Create a `.env.production` file or configure your hosting platform with:

```env
# Production Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Production Backend API
VITE_BACKEND_URL=https://your-production-backend.com

# Production Configuration
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### Build Commands

```bash
# Full production build with validation
npm run build:check

# Production build only
npm run build

# Staging build
npm run build:staging

# Validate environment variables
npm run validate-env
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase RLS policies enabled
- [ ] Backend API accessible from production domain
- [ ] DNS/CDN configured
- [ ] SSL certificate installed
- [ ] Error monitoring setup

## 🔧 Development Tools

```bash
# Type checking
npm run type-check

# Linting with auto-fix
npm run lint:fix

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── features/           # Feature-specific code
│   ├── academic-form/  # Academic details form
│   ├── camply-ai/      # AI chat bot
│   └── desk/           # Main desk interface
├── hooks/              # Custom React hooks
├── lib/               # Utilities and configurations
├── pages/             # Route components
└── types/             # TypeScript definitions
```

## 🔐 Security

- Environment variables are validated on startup
- Sensitive data never committed to git
- Supabase RLS policies enforced
- Production builds exclude debug logs

## 🛠️ Available Scripts

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start development server       |
| `npm run build`         | Production build               |
| `npm run build:staging` | Staging build                  |
| `npm run build:check`   | Full validation + build        |
| `npm run lint`          | Run ESLint                     |
| `npm run lint:fix`      | Fix ESLint errors              |
| `npm run type-check`    | TypeScript type checking       |
| `npm run validate-env`  | Validate environment variables |
| `npm run preview`       | Preview production build       |

## 📦 Key Dependencies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Supabase** - Backend as a Service
- **React Router** - Navigation
- **Framer Motion** - Animations

## 🚨 Troubleshooting

### Common Issues

1. **Environment variables not loading:**

   - Ensure `.env.local` exists and has correct variables
   - Run `npm run validate-env` to check configuration

2. **Build failures:**

   - Run `npm run type-check` to identify TypeScript errors
   - Run `npm run lint` to check code quality

3. **Backend connection issues:**

   - Verify `VITE_BACKEND_URL` is correct
   - Check if backend server is running and accessible

4. **Supabase authentication issues:**
   - Verify Supabase URL and keys
   - Check RLS policies in Supabase dashboard

For more help, check the console for detailed error messages.
