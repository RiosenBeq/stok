'use client';

import { ReactNode } from 'react';

/**
 * Authentication is intentionally disabled for local/demo usage.
 * Render the app as-is without login redirects.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
