-- Create colleges table
create table if not exists public.colleges (
  college_id uuid primary key default uuid_generate_v4(),
  name varchar not null,
  city varchar,
  state varchar,
  university_name varchar,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for colleges
alter table public.colleges enable row level security;

-- Colleges can be read by all
create policy "Anyone can view colleges" on public.colleges
  for select using (true);

-- Migrate existing college data from user_academic_details to colleges table
-- (Only if the column exists)
do $$
begin
  if exists (select 1 from information_schema.columns 
             where table_name = 'user_academic_details' 
             and column_name = 'college_name') then
    
    -- Insert unique colleges from existing data
    insert into public.colleges (name)
    select distinct college_name 
    from public.user_academic_details 
    where college_name is not null
    on conflict do nothing;
    
    -- Add college_id column to user_academic_details if it doesn't exist
    if not exists (select 1 from information_schema.columns 
                   where table_name = 'user_academic_details' 
                   and column_name = 'college_id') then
      alter table public.user_academic_details 
      add column college_id uuid references public.colleges(college_id);
    end if;
    
    -- Update college_id based on college_name
    update public.user_academic_details
    set college_id = c.college_id
    from public.colleges c
    where public.user_academic_details.college_name = c.name;
    
    -- Drop the old college_name column
    alter table public.user_academic_details drop column if exists college_name;
  end if;
end $$;
