-- Bucket para fotos de produto: leitura pública (uso interno, sem dado sensível),
-- escrita restrita ao admin.
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

create policy "produtos_public_read" on storage.objects
  for select using (bucket_id = 'produtos');

create policy "produtos_admin_insert" on storage.objects
  for insert with check (bucket_id = 'produtos' and public.is_admin());

create policy "produtos_admin_update" on storage.objects
  for update using (bucket_id = 'produtos' and public.is_admin())
  with check (bucket_id = 'produtos' and public.is_admin());

create policy "produtos_admin_delete" on storage.objects
  for delete using (bucket_id = 'produtos' and public.is_admin());
