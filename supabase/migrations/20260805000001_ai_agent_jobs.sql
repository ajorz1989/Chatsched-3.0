-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the audit trail table
CREATE TABLE IF NOT EXISTS public.ai_agent_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL, -- 'campaign_matching', 'fraud_check', 'pricing_suggestion', etc.
    input_data JSONB NOT NULL, -- The user input / campaign data
    output_data JSONB, -- The AI's structured output
    fallback_used BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add indexes for fast lookups
CREATE INDEX idx_ai_jobs_created_by ON public.ai_agent_jobs(created_by);
CREATE INDEX idx_ai_jobs_status ON public.ai_agent_jobs(status);
CREATE INDEX idx_ai_jobs_created_at ON public.ai_agent_jobs(created_at);

-- Set RLS so users can only view their own AI job traces
ALTER TABLE public.ai_agent_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI jobs" 
ON public.ai_agent_jobs 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "System can insert AI jobs" 
ON public.ai_agent_jobs 
FOR INSERT 
WITH CHECK (true); -- Service role / Edge Function handles insertion
