import "server-only";
import { createClient } from "@/lib/supabase/server";

// Compartilhado entre fotos de produto e de variação — mesmo bucket
// ("produtos"), mesma política de escrita (admin only, ver storage.sql).
export async function uploadFotoProduto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  foto: File,
): Promise<{ url?: string; error?: string }> {
  const extensao = foto.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from("produtos").upload(path, foto);
  if (error) return { error: "Não foi possível enviar a foto" };
  const { data } = supabase.storage.from("produtos").getPublicUrl(path);
  return { url: data.publicUrl };
}
