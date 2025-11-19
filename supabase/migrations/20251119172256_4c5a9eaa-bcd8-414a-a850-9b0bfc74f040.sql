-- Create profiles table
create table public.profiles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id);

-- Function to create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

-- Trigger to call function on user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();