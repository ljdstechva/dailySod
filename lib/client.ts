import { supabase } from "@/lib/supabaseClient";

export type ClientRow = {
  id: string;
  owner_user_id: string;
  name: string;
  niche: string | null;
};

export async function getOrCreateClient(): Promise<ClientRow> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userData.user;
  if (!user) throw new Error("Not authenticated");

  const { data: existing, error: fetchErr } = await supabase
    .from("clients")
    .select("id, owner_user_id, name, niche")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (existing) return existing as ClientRow;

  const { data: created, error: insertErr } = await supabase
    .from("clients")
    .insert({
      owner_user_id: user.id,
      name: "My Business",
      niche: null,
    })
    .select("id, owner_user_id, name, niche")
    .single();

  if (insertErr) throw insertErr;
  return created as ClientRow;
}
