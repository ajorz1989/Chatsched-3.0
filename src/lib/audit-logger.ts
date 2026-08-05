import { supabase } from './supabase/client';
import { useAuthStore } from '../stores/auth-store';
import { useOrgStore } from '../stores/organization-store';

export async function logAuditEvent(
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: any
) {
  const user = useAuthStore.getState().user;
  const org = useOrgStore.getState().currentOrg;

  return supabase.from('audit_logs').insert({
    user_id: user?.id,
    organization_id: org?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
    ip_address: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip),
    user_agent: navigator.userAgent,
  });
}
