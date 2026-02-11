"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { ThemeProvider } from "next-themes";

export default function AuthProvider({ children }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;

  if (!domain || !clientId) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
          audience,
        }}
        cacheLocation="localstorage"
        useRefreshTokens
      >
        {children}
      </Auth0Provider>
    </ThemeProvider>
  );
}
