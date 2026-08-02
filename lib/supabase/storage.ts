import "server-only";
import { createClient } from "@/lib/supabase/server";

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

// Compartilhado entre fotos de produto e de variação — mesmo bucket
// ("produtos"), mesma política de escrita (admin only, ver storage.sql).
export async function uploadFotoProduto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  foto: File,
): Promise<{ url?: string; error?: string }> {
  const extensao = TIPOS_PERMITIDOS[foto.type];
  if (!extensao) {
    return { error: "Formato de imagem inválido. Envie JPEG, PNG ou WebP." };
  }
  if (foto.size > TAMANHO_MAXIMO_BYTES) {
    return { error: "A imagem não pode passar de 5MB." };
  }

  const path = `${crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage
    .from("produtos")
    .upload(path, foto, { contentType: foto.type });
  if (error) return { error: "Não foi possível enviar a foto" };
  const { data } = supabase.storage.from("produtos").getPublicUrl(path);
  return { url: data.publicUrl };
}
