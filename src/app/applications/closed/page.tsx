import { redirect } from "next/navigation";

export default function ClosedApplicationsPage() {
  redirect("/applications?filter=closed");
}
