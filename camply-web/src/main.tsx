import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Validate environment on app startup
try {
  // Import environment validation
  import('./lib/env-validation').then(({ validateEnvironment }) => {
    validateEnvironment();
  }).catch((error) => {
    console.error('Environment validation failed:', error);
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #ef4444;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui;
        z-index: 9999;
      ">
        <div style="text-align: center; max-width: 600px; padding: 2rem;">
          <h1 style="margin: 0 0 1rem 0;">Configuration Error</h1>
          <p style="margin: 0 0 1rem 0;">The application is missing required environment variables.</p>
          <details style="text-align: left; background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 4px;">
            <summary style="cursor: pointer;">Error Details</summary>
            <pre style="margin: 1rem 0 0 0; white-space: pre-wrap;">${error.message}</pre>
          </details>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
  });
} catch (error) {
  console.error('Failed to validate environment:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
