import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { BTN_PRIMARY_LINK, PAGE_HEADER, SECTION_STACK, TEXT_H1 } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationsTabs } from "@/components/applications-tabs";
import { ApplicationsResults } from "@/app/applications/applications-results";
import { ApplicationRowsSkeleton } from "@/components/application-rows-skeleton";

type ApplicationsPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

function normalizeFilter(raw: string | undefined): "open" | "closed" | "all" {
  if (raw === "closed") return "closed";
  if (raw === "all") return "all";
  return "open";
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const { filter: rawFilter } = await searchParams;
  const filter = normalizeFilter(rawFilter);

  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        <div className={PAGE_HEADER}>
          <h1 className={TEXT_H1}>Applications</h1>
          <Link
            href={`/applications/new${filter !== "open" ? `?from=${filter}` : ""}`}
            className={BTN_PRIMARY_LINK}
          >
            + Add
          </Link>
        </div>

        <ApplicationsTabs active={filter} />

        <Suspense key={filter} fallback={<ApplicationRowsSkeleton />}>
          <ApplicationsResults filter={filter} />
        </Suspense>
      </div>
    </AppShell>
  );
}
