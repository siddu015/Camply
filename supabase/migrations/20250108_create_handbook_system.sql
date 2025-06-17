-- Migration: Create Handbook System
-- Date: 2025-01-08
-- Description: Add handbook upload, processing, and query system

-- Create handbook system migration
-- This ensures the handbook system is properly set up

-- Check if user_handbooks table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_handbooks') THEN
        -- Create user_handbooks table
        CREATE TABLE public.user_handbooks (
            handbook_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id uuid REFERENCES public.users NOT NULL,
            academic_id uuid REFERENCES public.user_academic_details NOT NULL,

            -- Storage info
            storage_path text NOT NULL,
            original_filename varchar NOT NULL,
            file_size_bytes bigint,

            -- Processing status
            processing_status varchar DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'failed')),
            upload_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            processed_date timestamp with time zone,
            processing_started_at timestamp with time zone,
            error_message text,

            -- Structured JSON Data (extracted from handbook)
            basic_info jsonb,
            semester_structure jsonb,
            examination_rules jsonb,
            evaluation_criteria jsonb,
            attendance_policies jsonb,
            academic_calendar jsonb,
            course_details jsonb,
            assessment_methods jsonb,
            disciplinary_rules jsonb,
            graduation_requirements jsonb,
            fee_structure jsonb,
            facilities_rules jsonb,

            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Enable RLS
        ALTER TABLE public.user_handbooks ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies with TO clause for performance
        CREATE POLICY "Users can view own handbooks" ON public.user_handbooks
            FOR SELECT TO authenticated USING (user_id = auth.uid());

        CREATE POLICY "Users can insert own handbooks" ON public.user_handbooks
            FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

        CREATE POLICY "Users can update own handbooks" ON public.user_handbooks
            FOR UPDATE TO authenticated USING (user_id = auth.uid());

        CREATE POLICY "Users can delete own handbooks" ON public.user_handbooks
            FOR DELETE TO authenticated USING (user_id = auth.uid());

        -- Create indexes
        CREATE INDEX idx_user_handbooks_user_id ON public.user_handbooks(user_id);
        CREATE INDEX idx_user_handbooks_academic_id ON public.user_handbooks(academic_id);    
        CREATE INDEX idx_user_handbooks_status ON public.user_handbooks(processing_status);
        CREATE INDEX idx_user_handbooks_upload_date ON public.user_handbooks(upload_date DESC);
    END IF;
END $$;

-- Check if handbooks bucket exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'handbooks') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
        VALUES (
            'handbooks', 
            'handbooks', 
            false, 
            104857600, -- 100MB limit
            array['application/pdf']
        );
    END IF;
END $$;

-- Ensure storage policies exist
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can upload own handbooks" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view own handbooks" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own handbooks" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own handbooks" ON storage.objects;

    -- Create storage policies for user-handbooks folder structure
    CREATE POLICY "Users can upload own handbooks" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (
            bucket_id = 'handbooks' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[2] = auth.uid()::text
        );

    CREATE POLICY "Users can view own handbooks" ON storage.objects
        FOR SELECT TO authenticated USING (
            bucket_id = 'handbooks' 
            AND (storage.foldername(name))[2] = auth.uid()::text
        );

    CREATE POLICY "Users can update own handbooks" ON storage.objects
        FOR UPDATE TO authenticated USING (
            bucket_id = 'handbooks' 
            AND (storage.foldername(name))[2] = auth.uid()::text
        );

    CREATE POLICY "Users can delete own handbooks" ON storage.objects
        FOR DELETE TO authenticated USING (
            bucket_id = 'handbooks' 
            AND (storage.foldername(name))[2] = auth.uid()::text
        );
END $$;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for handbook updated_at timestamp
DROP TRIGGER IF EXISTS update_user_handbooks_updated_at ON public.user_handbooks;
CREATE TRIGGER update_user_handbooks_updated_at 
    BEFORE UPDATE ON public.user_handbooks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Remove old college_rulebook_url column from user_academic_details
alter table public.user_academic_details drop column if exists college_rulebook_url;

-- Add comment for documentation
comment on table public.user_handbooks is 'Stores uploaded academic handbooks and their processed data';
comment on column public.user_handbooks.processing_status is 'Status: uploaded, processing, completed, failed';
comment on column public.user_handbooks.storage_path is 'Path in Supabase Storage handbooks bucket'; 