interface RequiredEnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_BACKEND_URL: string;
}

interface OptionalEnvVars {
  VITE_APP_ENV?: string;
  VITE_APP_VERSION?: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

export const validateEnvironment = (): RequiredEnvVars & OptionalEnvVars => {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_BACKEND_URL'
  ];

  const missingVars: string[] = [];
  const envVars: any = {};

  for (const varName of requiredVars) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    } else {
      envVars[varName] = value;
    }
  }

  envVars.VITE_APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
  envVars.VITE_APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

  if (missingVars.length > 0) {
    throw new EnvironmentError(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  try {
    new URL(envVars.VITE_SUPABASE_URL);
    new URL(envVars.VITE_BACKEND_URL);
  } catch (error) {
    throw new EnvironmentError(
      'Invalid URL format in environment variables. Please check VITE_SUPABASE_URL and VITE_BACKEND_URL.'
    );
  }

  return envVars as RequiredEnvVars & OptionalEnvVars;
};

export const getEnvironmentConfig = () => {
  return validateEnvironment();
};

let environmentConfig: RequiredEnvVars & OptionalEnvVars;
try {
  environmentConfig = validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
  throw error;
}

export { environmentConfig }; 