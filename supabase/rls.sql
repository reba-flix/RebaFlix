-- RebaFlix Supabase RLS and Storage setup.
-- Run this in the Supabase SQL editor after Prisma migrations create the tables.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  524288000,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/vnd.apple.mpegurl',
    'text/vtt'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table "User" enable row level security;
alter table "Favorite" enable row level security;
alter table "History" enable row level security;
alter table "WatchLater" enable row level security;
alter table "Comment" enable row level security;
alter table "Rating" enable row level security;
alter table "Notification" enable row level security;
alter table "Subscription" enable row level security;
alter table "Payment" enable row level security;
alter table "AnalyticsEvent" enable row level security;

drop policy if exists "Users can read own profile" on "User";
create policy "Users can read own profile" on "User"
  for select using (auth.uid()::text = id);

drop policy if exists "Users can update own profile" on "User";
create policy "Users can update own profile" on "User"
  for update using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

drop policy if exists "Users own favorites" on "Favorite";
create policy "Users own favorites" on "Favorite"
  for all using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

drop policy if exists "Users own history" on "History";
create policy "Users own history" on "History"
  for all using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

drop policy if exists "Users own watch later" on "WatchLater";
create policy "Users own watch later" on "WatchLater"
  for all using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

drop policy if exists "Users own comments" on "Comment";
create policy "Users own comments" on "Comment"
  for all using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

drop policy if exists "Anyone can read comments" on "Comment";
create policy "Anyone can read comments" on "Comment"
  for select using (true);

drop policy if exists "Users own ratings" on "Rating";
create policy "Users own ratings" on "Rating"
  for all using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

drop policy if exists "Users read own notifications" on "Notification";
create policy "Users read own notifications" on "Notification"
  for select using (auth.uid()::text = "userId");

drop policy if exists "Users read own subscriptions" on "Subscription";
create policy "Users read own subscriptions" on "Subscription"
  for select using (auth.uid()::text = "userId");

drop policy if exists "Users read own payments" on "Payment";
create policy "Users read own payments" on "Payment"
  for select using (auth.uid()::text = "userId");

drop policy if exists "Users create own analytics events" on "AnalyticsEvent";
create policy "Users create own analytics events" on "AnalyticsEvent"
  for insert with check (auth.uid()::text = "userId" or "userId" is null);

drop policy if exists "Public media reads" on storage.objects;
create policy "Public media reads" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "Authenticated media uploads" on storage.objects;
create policy "Authenticated media uploads" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and split_part(name, '/', 1) in ('posters', 'backdrops', 'trailers', 'videos', 'subtitles')
  );

drop policy if exists "Authenticated media updates" on storage.objects;
create policy "Authenticated media updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'media')
  with check (
    bucket_id = 'media'
    and split_part(name, '/', 1) in ('posters', 'backdrops', 'trailers', 'videos', 'subtitles')
  );

drop policy if exists "Authenticated media deletes" on storage.objects;
create policy "Authenticated media deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media');
