-- Add unique constraint to phone_number in users table
ALTER TABLE public.users 
ADD CONSTRAINT unique_phone_number 
UNIQUE (phone_number); 