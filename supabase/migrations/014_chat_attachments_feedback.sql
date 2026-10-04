-- 014: Chat file sharing + tutor feedback notes
-- 1) Messages can carry an attachment (image/PDF/any file) stored in the
--    public `chat-attachments` storage bucket.
-- 2) Tutors can leave a short feedback note on completed lessons; parents see
--    it as "Recent Feedback" on their dashboard.
alter table messages add column if not exists attachment_url text;
alter table messages add column if not exists attachment_name text;
alter table messages add column if not exists attachment_type text;
alter table sessions add column if not exists feedback text;

-- Public storage bucket for chat attachments (authenticated uploads, public reads).
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

drop policy if exists "chat attachment upload" on storage.objects;
create policy "chat attachment upload"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'chat-attachments');

notify pgrst, 'reload schema';
