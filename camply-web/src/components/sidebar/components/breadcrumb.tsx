import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  title: string;
  path?: string;
}

export interface RouteConfig {
  title: string;
  parent?: string;
  parentPath?: string;
  path?: string;
}

export interface BreadcrumbsConfig {
  routes: Record<string, RouteConfig>;
  defaultTitle: string;
  homeRoute: string;
}

interface BreadcrumbsProps {
  config: BreadcrumbsConfig;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ config, className }) => {
  const location = useLocation();
  const { routes, defaultTitle, homeRoute } = config;
  
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    const currentPath = Object.keys(routes)
      .filter(path => {
        if (path.includes(':')) {
          const pathRegex = new RegExp(
            '^' + path.replace(/:[^/]+/g, '[^/]+') + '$'
          );
          return pathRegex.test(location.pathname);
        }
        return path === location.pathname;
      })
      .sort((a, b) => b.length - a.length)[0];
    
    if (!currentPath) {
      breadcrumbs.push({ title: defaultTitle, path: homeRoute });
      return breadcrumbs;
    }
    
    const currentRoute = routes[currentPath];
    if (!currentRoute) {
      breadcrumbs.push({ title: defaultTitle, path: homeRoute });
      return breadcrumbs;
    }
    
    const buildBreadcrumbTrail = (routePath: string, route: RouteConfig): BreadcrumbItem[] => {
      const trail: BreadcrumbItem[] = [];
      
      if (route.parent === "Camply") {
        trail.push({ title: "Camply", path: homeRoute });
      }
      
      if (route.parent && route.parent !== "Camply") {
        const parentRoute = route.parentPath 
          ? routes[route.parentPath]
          : Object.entries(routes).find(([, routeConfig]) => routeConfig.title === route.parent)?.[1];
        
        if (parentRoute) {
          const parentPath = route.parentPath || 
            Object.entries(routes).find(([, routeConfig]) => routeConfig.title === route.parent)?.[0] || '';
          
          const parentTrail = buildBreadcrumbTrail(parentPath, parentRoute);
          trail.push(...parentTrail);
        } else {
          trail.push({ title: "Camply", path: homeRoute });
          trail.push({ title: route.parent });
        }
      }
      
      trail.push({
        title: route.title,
        path: routePath
      });
      
      return trail;
    };
    
    return buildBreadcrumbTrail(currentPath, currentRoute);
  };
  
  const breadcrumbItems = getBreadcrumbItems();
    
  const uniqueBreadcrumbs = breadcrumbItems.filter(
    (item, index, self) => 
      index === self.findIndex(breadcrumb => breadcrumb.title === item.title)
  );
  
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {uniqueBreadcrumbs.map((item, index) => {
          const isLast = index === uniqueBreadcrumbs.length - 1;
          
          return (
            <li key={item.title} className="flex items-center">
              {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
              
              {isLast ? (
                <span className="text-foreground">{item.title}</span>
              ) : (
                item.path ? (
                  <Link 
                    to={item.path}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{item.title}</span>
                )
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}; 