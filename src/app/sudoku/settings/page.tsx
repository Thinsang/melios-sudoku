import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { SettingsForms } from "./SettingsForms";
import { AppearanceSection } from "./AppearanceSection";
import { BoardThemeSection } from "./BoardThemeSection";
import { SettingsBackLink } from "./SettingsBackLink";
import { AvatarUploader } from "./AvatarUploader";
import { ReplayTutorialButton } from "./ReplayTutorialButton";
import { KeyboardSection } from "./KeyboardSection";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sudoku/auth/sign-in?next=/sudoku/settings");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 justify-center px-5 sm:px-6 py-10">
      <div className="w-full max-w-md flex flex-col gap-10">
        <div>
          <SettingsBackLink />
          <h1 className="font-display text-4xl text-ink mt-3">Settings</h1>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg text-ink">Account</h2>
          <div className="rounded-xl border border-edge bg-paper p-4 text-sm text-ink-soft flex flex-col gap-1.5">
            <div>
              <span className="text-ink-faint">Username</span>{" "}
              <span className="text-ink font-medium">@{profile.username}</span>{" "}
              <span className="text-xs text-ink-faint">(can&rsquo;t be changed)</span>
            </div>
            <div>
              <span className="text-ink-faint">Email</span>{" "}
              <span className="text-ink">{user?.email ?? "—"}</span>
            </div>
          </div>
        </section>

        <AvatarUploader
          initialUrl={profile.avatar_url ?? null}
          name={profile.display_name ?? profile.username}
        />

        <AppearanceSection />

        <BoardThemeSection />

        <SettingsForms
          email={user?.email ?? ""}
          initialDisplayName={profile.display_name ?? profile.username}
        />

        <ReplayTutorialButton />

        <KeyboardSection />
      </div>
    </main>
  );
}
