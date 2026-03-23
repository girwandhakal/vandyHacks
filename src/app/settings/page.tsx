import { Skeleton } from "@/components/shared/skeleton";
import { getSettingsData } from "@/lib/server/settings";
import { SettingsPageClient } from "@/app/settings/settings-page-client";

export default async function SettingsPage() {
  const user = await getSettingsData();

  if (!user) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-24 w-3/4 mb-4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <SettingsPageClient initialUser={user} />;
}
