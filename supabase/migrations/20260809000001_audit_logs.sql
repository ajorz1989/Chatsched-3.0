-- =====================================================
-- Audit Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'campaign.delete', 'role.update', 'payout.process'
    entity_type TEXT NOT NULL, -- e.g., 'campaigns', 'users', 'payouts'
    entity_id UUID,
    metadata JSONB, -- previous state, reason, IP address, user agent
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);

-- RLS: Only admins and system can read audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs for their org" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = audit_logs.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'admin'
        )
    );

-- System can insert (Edge Functions / triggers)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);
