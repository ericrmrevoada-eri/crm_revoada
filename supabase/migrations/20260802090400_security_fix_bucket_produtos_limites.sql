-- Correção de segurança (achado #7 do HANDOFF_SEGURANCA.md).
--
-- uploadFotoProduto() usava a extensão do nome de arquivo enviado pelo
-- cliente sem checar MIME/tamanho, e o bucket em si não tinha limite algum
-- — um admin (só admin tem acesso) podia subir um .html/.svg pro bucket
-- público e ele seria servido com o Content-Type que o cliente mandou. A
-- validação em lib/supabase/storage.ts já cobre a aplicação; isso aqui é a
-- mesma regra reforçada no nível do Storage.
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
       file_size_limit = 5242880 -- 5MB
 where id = 'produtos';
