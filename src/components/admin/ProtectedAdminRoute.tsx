"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { useFirebase } from "@/firebase";

type AccessState = "loading" | "authorized" | "unauthorized";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const router = useRouter();
  const { auth, user, isUserLoading } = useFirebase();
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [attemptedSignIn, setAttemptedSignIn] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyAdminAccess = async () => {
      if (isUserLoading) {
        return;
      }

      if (!user) {
        if (attemptedSignIn) {
          if (active) {
            setAccessState("unauthorized");
            router.replace("/404");
          }
          return;
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        setAttemptedSignIn(true);

        try {
          await signInWithPopup(auth, provider);
          return;
        } catch (error) {
          const code = (error as { code?: string })?.code || "";
          if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
            await signInWithRedirect(auth, provider);
            return;
          }

          if (active) {
            setAccessState("unauthorized");
            router.replace("/404");
          }
          return;
        }
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/admin/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!active) {
          return;
        }

        if (!response.ok) {
          setAccessState("unauthorized");
          router.replace("/404");
          return;
        }

        setAccessState("authorized");
      } catch {
        if (active) {
          setAccessState("unauthorized");
          router.replace("/404");
        }
      }
    };

    void verifyAdminAccess();
    return () => {
      active = false;
    };
  }, [auth, attemptedSignIn, isUserLoading, router, user]);

  if (isUserLoading || accessState === "loading") {
    return <div className="flex items-center justify-center h-screen">Checking admin access...</div>;
  }

  if (accessState !== "authorized") {
    return null;
  }

  return <>{children}</>;
}
