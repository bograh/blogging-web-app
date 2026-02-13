"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed) return;

    const handleOAuthCallback = async () => {
      setHasProcessed(true);

      try {
        const token = searchParams.get("token");

        if (!token) {
          console.error("OAuth callback: No token in URL parameters");
          toast.error("Authentication failed: No token received");
          setStatus("error");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        console.log("OAuth callback: Token received, attempting login...");

        // Log in with the token
        await loginWithToken(token);

        console.log("OAuth callback: Login successful");
        toast.success("Welcome! Signed in with Google");
        setStatus("success");

        // Get return path or default to home
        const returnPath = sessionStorage.getItem('oauth_return_path') || '/';
        sessionStorage.removeItem('oauth_return_path');

        // Redirect immediately without delay to avoid loops
        router.replace(returnPath);
      } catch (error) {
        console.error("OAuth callback error:", error);
        let errorMessage = "Authentication failed";

        if (error && typeof error === "object") {
          if ("errorMessage" in error && typeof error.errorMessage === "string") {
            errorMessage = error.errorMessage;
          } else if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          } else if (Object.keys(error).length === 0) {
            errorMessage = "Unable to authenticate. Please try again.";
          }
        }

        toast.error(errorMessage);
        setStatus("error");
        setTimeout(() => router.replace("/login"), 2000);
      }
    };

    handleOAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              Completing sign in...
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we authenticate your account
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              Sign in successful!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting you now...
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              Sign in failed
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}

export default function OAuthCallbackWrapper() {
  return (
    <AuthProvider>
      <OAuthCallbackPage />
    </AuthProvider>
  );
}
