import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/env";

export default function AuthCallbackPage() {
  redirect(ROUTES.login);
}
