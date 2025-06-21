import { RouteConfig } from '@/components/sidebar/components/breadcrumb';

declare global {
  interface Window {
    __CAMPLY_ROUTE_CONFIG?: Record<string, RouteConfig>;
  }
}

export {};
