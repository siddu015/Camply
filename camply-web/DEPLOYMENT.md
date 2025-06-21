# 🚀 Camply Web - Production Deployment Guide

## Overview

This guide covers deploying Camply Web to production environments with proper security and performance optimizations.

## ✅ Pre-deployment Checklist

### 1. Environment Configuration

- [ ] All environment variables configured
- [ ] No hardcoded localhost URLs remaining
- [ ] Backend API endpoints verified
- [ ] Supabase project configured for production

### 2. Code Quality

- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Environment validation passes (`npm run validate-env`)
- [ ] Production build succeeds (`npm run build`)

### 3. Security

- [ ] Supabase RLS policies enabled
- [ ] Environment files not committed to git
- [ ] HTTPS configured for production
- [ ] CORS properly configured on backend

## 🌐 Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository:**

   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Environment Variables in Vercel:**

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   VITE_BACKEND_URL=https://your-backend-api.com
   VITE_APP_ENV=production
   VITE_APP_VERSION=1.0.0
   ```

3. **Build Settings:**
   - Build Command: `npm run build:check`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Netlify

1. **Build Settings:**

   ```bash
   # Build command
   npm run build:check

   # Publish directory
   dist
   ```

2. **Environment Variables:**
   Add the same variables as Vercel in Netlify dashboard.

3. **Redirects (\_redirects file):**
   ```
   /*    /index.html   200
   ```

### AWS S3 + CloudFront

1. **Build and Upload:**

   ```bash
   npm run build:check
   aws s3 sync dist/ s3://your-bucket-name
   ```

2. **CloudFront Configuration:**
   - Origin: S3 bucket
   - Default Root Object: `index.html`
   - Error Pages: 404 → `/index.html` (for SPA routing)

## 🔧 Environment Variables Setup

### Required Variables

| Variable                 | Description            | Example                       |
| ------------------------ | ---------------------- | ----------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL   | `https://xyz.supabase.co`     |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ0eXAiOiJKV1QiLCJhbGci...` |
| `VITE_BACKEND_URL`       | Backend API base URL   | `https://api.example.com`     |

### Optional Variables

| Variable           | Description             | Default      |
| ------------------ | ----------------------- | ------------ |
| `VITE_APP_ENV`     | Application environment | `production` |
| `VITE_APP_VERSION` | Application version     | `1.0.0`      |

## 🏗️ Build Process

### Local Production Build

```bash
# Full validation and build
npm run build:check

# Or step by step
npm run type-check
npm run lint
npm run validate-env
npm run build
```

### CI/CD Pipeline Example (GitHub Actions)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Validate environment
        run: npm run validate-env
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_BACKEND_URL: ${{ secrets.VITE_BACKEND_URL }}
          VITE_APP_ENV: production

      - name: Build
        run: npm run build:check
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_BACKEND_URL: ${{ secrets.VITE_BACKEND_URL }}
          VITE_APP_ENV: production

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

## 🔐 Security Configuration

### Supabase Security

1. **Enable RLS (Row Level Security):**

   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_academic_details ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_handbooks ENABLE ROW LEVEL SECURITY;
   ```

2. **Create Policies:**
   ```sql
   -- Users can only access their own data
   CREATE POLICY "Users can view own data" ON users
   FOR SELECT USING (auth.uid() = user_id);
   ```

### CORS Configuration

Ensure your backend allows requests from your production domain:

```javascript
// Backend CORS config
const corsOptions = {
  origin: [
    "https://your-production-domain.com",
    "https://www.your-production-domain.com",
  ],
  credentials: true,
};
```

## 📊 Performance Optimization

### Build Optimizations

- ✅ Code splitting enabled
- ✅ Bundle analysis available
- ✅ Tree shaking enabled
- ✅ Minification in production

### Runtime Optimizations

- ✅ Lazy loading for routes
- ✅ Image optimization
- ✅ Caching strategies
- ✅ Error boundaries

## 🐛 Troubleshooting

### Common Issues

1. **Environment variables not working:**

   ```bash
   # Check if variables are loaded
   npm run validate-env

   # Verify build includes env vars
   cat dist/assets/*.js | grep -o "VITE_.*"
   ```

2. **Backend connection failures:**

   ```bash
   # Test backend connectivity
   curl -I https://your-backend-url.com/health

   # Check CORS headers
   curl -H "Origin: https://your-frontend-domain.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        https://your-backend-url.com/api
   ```

3. **Build failures:**

   ```bash
   # Clear cache and rebuild
   rm -rf node_modules dist
   npm install
   npm run build:check
   ```

4. **Routing issues (404 on refresh):**
   - Configure server redirects for SPA
   - Add `_redirects` file for Netlify
   - Configure CloudFront error pages

## 📈 Monitoring

### Error Tracking

Consider integrating:

- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage metrics

### Performance Monitoring

- Lighthouse CI for performance checks
- Web Vitals monitoring
- Bundle size tracking

## 🔄 Rollback Strategy

1. **Keep previous build artifacts**
2. **Database migration rollback plan**
3. **DNS/CDN cache invalidation**
4. **Environment variable backup**

## 📞 Support

For deployment issues:

1. Check console errors in browser
2. Verify environment variables
3. Test backend connectivity
4. Review deployment logs
5. Check Supabase dashboard for errors

---

**Note:** Always test deployments in a staging environment before production!
