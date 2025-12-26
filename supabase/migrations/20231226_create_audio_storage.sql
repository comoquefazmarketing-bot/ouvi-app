-- 1. Criar o bucket de áudio (se não existir)
insert into storage.buckets (id, name, public)
values ('audio-comments', 'audio-comments', true)
on conflict (id) do nothing;

-- 2. Remover políticas antigas para evitar conflitos (opcional, mas seguro)
drop policy if exists "Usuários podem subir áudios" on storage.objects;
drop policy if exists "Áudios são públicos" on storage.objects;
drop policy if exists "Usuários podem apagar seus próprios áudios" on storage.objects;

-- 3. Política de Inserção: Apenas usuários logados
create policy "Usuários podem subir áudios"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'audio-comments'
);

-- 4. Política de Leitura: Público (qualquer um ouve)
create policy "Áudios são públicos"
on storage.objects for select
to public
using (
  bucket_id = 'audio-comments'
);

-- 5. Política de Delete: Apenas o dono do áudio pode apagar
create policy "Usuários podem apagar seus próprios áudios"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'audio-comments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
