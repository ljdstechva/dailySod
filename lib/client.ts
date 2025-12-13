import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientRow = {
  id: string;
  user_id: string;
  created_at?: string;
};

export async function getOrCreateClient(
  supabase: SupabaseClient,
  userId: string
): Promise<ClientRow> {
  // 1) Try fetch existing client
  const { data: existing, error: fetchErr } = await supabase
    .from("clients")
    .select("id,user_id,created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (existing) return existing as ClientRow;

  // 2) Create if missing
  const { data: created, error: createErr } = await supabase
    .from("clients")
    .insert({ user_id: userId })
    .select("id,user_id,created_at")
    .single();

  if (createErr) throw createErr;
  return created as ClientRow;
}
