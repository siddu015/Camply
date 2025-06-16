import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

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
  
  // Function to get breadcrumb items based on current route
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Get current route config
    const currentPath = Object.keys(routes)
      .filter(path => {
        // Handle dynamic routes with parameters
        if (path.includes(':')) {
          const pathRegex = new RegExp(
            '^' + path.replace(/:[^/]+/g, '[^/]+') + '$'
          );
          return pathRegex.test(location.pathname);
        }
        return path === location.pathname;
      })
      .sort((a, b) => b.length - a.length)[0]; // Get the most specific match
    
    if (!currentPath) {
      // If no match found, just return default title
      breadcrumbs.push({ title: defaultTitle, path: homeRoute });
      return breadcrumbs;
    }
    
    const currentRoute = routes[currentPath];
    if (!currentRoute) {
      breadcrumbs.push({ title: defaultTitle, path: homeRoute });
      return breadcrumbs;
    }
    
    // Build full breadcrumb trail recursively
    const buildBreadcrumbTrail = (routePath: string, route: RouteConfig): BreadcrumbItem[] => {
      const trail: BreadcrumbItem[] = [];
      
      // Add home/default as first item
      if (route.parent === "Camply") {
        trail.push({ title: "Camply", path: homeRoute });
      }
      
      // If this route has a parent, add the parent's breadcrumb trail first
      if (route.parent && route.parent !== "Camply") {
        // Find parent route by parentPath or by title
        const parentRoute = route.parentPath 
          ? routes[route.parentPath]
          : Object.entries(routes).find(([_, r]) => r.title === route.parent)?.[1];
        
        if (parentRoute) {
          const parentPath = route.parentPath || 
            Object.entries(routes).find(([_, r]) => r.title === route.parent)?.[0] || '';
          
          // Recursively build the parent's trail
          const parentTrail = buildBreadcrumbTrail(parentPath, parentRoute);
          trail.push(...parentTrail);
        } else {
          // If parent not found but we have "Camply" as grandparent
          trail.push({ title: "Camply", path: homeRoute });
          // Add the parent as a non-linked item if we can't find its route
          trail.push({ title: route.parent });
        }
      }
      
      // Add current route
      trail.push({
        title: route.title,
        path: routePath
      });
      
      return trail;
    };
    
    // Build the full breadcrumb trail
    return buildBreadcrumbTrail(currentPath, currentRoute);
  };
  
  const breadcrumbItems = getBreadcrumbItems();
  
  // Remove duplicates (can happen with recursive building)
  const uniqueBreadcrumbs = breadcrumbItems.filter(
    (item, index, self) => 
      index === self.findIndex(t => t.title === item.title)
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