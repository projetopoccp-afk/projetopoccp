import { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

export async function ensureProfile(user: User) {
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.user_name ||
    "Creator";

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  const usernameBase =
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "creator";

  const username = usernameBase
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        display_name: displayName,
        username,
        avatar_url: avatarUrl,
      },
      {
        onConflict: "id",
      }
    );

  if (error) {
    console.error("Erro ao criar/atualizar profile:", error.message);
  }
}