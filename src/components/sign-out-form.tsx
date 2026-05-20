"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();

    // Next.js will handle the redirect via middleware
    window.location.href = "/login";
  };

  return (
    <form onSubmit={handleSignOut}>
      <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-50">
        {isLoading ? "Signing out..." : "Sign out"}
      </button>
    </form>
  );
}
