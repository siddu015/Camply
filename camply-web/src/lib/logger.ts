const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

export const logDev = logger.log;
export const warnDev = logger.warn;
export const errorProd = logger.error;
export const debugDev = logger.debug; 