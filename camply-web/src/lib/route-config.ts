import type { RouteConfig } from '@/components/sidebar/components/breadcrumb';

export const deskRouteConfig: Record<string, RouteConfig> = {
  "/desk": { title: "Desk", parent: "Camply" },
  "/profile/campus": { title: "Campus", parent: "Desk", parentPath: "/desk" },
  "/profile/academics": { title: "Academics", parent: "Desk", parentPath: "/desk" },
  "/semester/overview": { title: "Overview", parent: "Desk", parentPath: "/desk" },
  "/semester/courses": { title: "Courses", parent: "Desk", parentPath: "/desk" },
  "/courses/:courseId": { title: "Course Details", parent: "Courses", parentPath: "/semester/courses" },
  "/profile/campus/:feature": { title: "Feature", parent: "Campus", parentPath: "/profile/campus" },
  "/profile/campus/news": { title: "News", parent: "Campus", parentPath: "/profile/campus" },
  "/profile/campus/placements": { title: "Placements", parent: "Campus", parentPath: "/profile/campus" },
  "/profile/campus/achievements": { title: "Achievements", parent: "Campus", parentPath: "/profile/campus" },
  "/profile/campus/statistics": { title: "Statistics", parent: "Campus", parentPath: "/profile/campus" },
  "/profile/campus/events": { title: "Events", parent: "Campus", parentPath: "/profile/campus" },
  "/profile/campus/tour": { title: "Campus Tour", parent: "Campus", parentPath: "/profile/campus" },
};

if (typeof window !== 'undefined') {
  window.__CAMPLY_ROUTE_CONFIG = deskRouteConfig;
}

export default deskRouteConfig; 