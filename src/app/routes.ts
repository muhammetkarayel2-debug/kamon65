import { createBrowserRouter, type RouteObject } from "react-router";
import { RootLayout } from "./components/root-layout";
import { LandingPage } from "./components/landing-page";
import { WizardPage } from "./components/wizard-page";
import { DashboardPage } from "./components/dashboard-page";
import { BlogPage } from "./components/blog-page";
import { BlogDetailPage } from "./components/blog-detail-page";
import { AdminPage } from "./components/admin-page";

const routes: RouteObject[] = [
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true,          Component: LandingPage    },
      { path: "wizard",       Component: WizardPage     },
      { path: "dashboard",    Component: DashboardPage  },
      { path: "blog",         Component: BlogPage       },
      { path: "blog/:slug",   Component: BlogDetailPage },
      { path: "admin",        Component: AdminPage      },
      { path: "panel",        Component: AdminPage      },
    ],
  },
];

// Create router instance once at module level
let routerInstance: ReturnType<typeof createBrowserRouter> | null = null;

export function getRouter() {
  if (!routerInstance) {
    routerInstance = createBrowserRouter(routes, {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    });
  }
  return routerInstance;
}

// For backward compatibility
export const router = getRouter();
