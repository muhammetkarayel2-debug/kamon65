import { ReactNode, useMemo } from "react";
import { RouterProvider } from "react-router";
import { router } from "../routes";
import { AuthProvider } from "./auth-context";

interface AppProvidersProps {
  children?: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Memoize the router instance to prevent recreation on hot reload
  const stableRouter = useMemo(() => router, []);

  return (
    <AuthProvider>
      {children || <RouterProvider router={stableRouter} />}
    </AuthProvider>
  );
}
