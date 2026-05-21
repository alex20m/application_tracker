"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function handleAuthCallback(code: string) {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error);
    return false;
  }

  return true;
}

export function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      handleAuthCallback(code)
        .then((success) => {
          if (success) {
            router.push("/applications");
          } else {
            setError("Failed to complete sign-in. Please try again.");
          }
        })
        .catch((err) => {
          setError("An error occurred. Please try again.");
          console.error(err);
        });
    }
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      {error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-w-sm text-center">
          <p className="text-rose-600">{error}</p>
          <a href="/login" className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition bg-indigo-600 text-white hover:bg-indigo-700 mt-4 inline-block">
            Back to Sign In
          </a>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-w-sm text-center">
          <p className="text-slate-600">Completing sign-in...</p>
        </div>
      )}
    </div>
  );
}
