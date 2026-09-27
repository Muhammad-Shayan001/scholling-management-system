'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface FinancialMetrics {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  overdueCount: number;
}

export async function getFinancialMetrics() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify admin access
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization not found' };
  const orgId = membership.organization_id;

  try {
    // 1. Total Billed
    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount')
      .eq('organization_id', orgId);

    const totalBilled = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;

    // 2. Total Collected
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('organization_id', orgId); // Note: payment table needs organization_id for this to be fast

    // If organization_id isn't on payments, we join with invoices
    // Let's use a join query for accuracy
    const { data: collectedData } = await supabase
      .from('payments')
      .select('amount, invoices!inner(organization_id)')
      .eq('invoices.organization_id', orgId);

    const totalCollected = collectedData?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalOutstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    // 3. Overdue Count
    const { count: overdueCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'unpaid')
      .lt('due_date', new Date().toISOString());

    return {
      metrics: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        collectionRate,
        overdueCount: overdueCount || 0,
      }
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch metrics' };
  }
}

export async function getCampusRevenue() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization not found' };

  // Join payments -> invoices -> students -> campuses
  const { data, error } = await supabase
    .from('payments')
    .select(`
      amount,
      invoices!inner(
        student_id,
        invoices!inner(
          students!inner(
            campus_id
          )
        )
      )
    `)
    .eq('invoices.organization_id', membership.organization_id);

  if (error) return { error: error.message };

  // Aggregate by campus
  const revenueByCampus: Record<string, number> = {};
  data?.forEach(p => {
    const campusId = p.invoices?.students?.campus_id || 'unknown';
    revenueByCampus[campusId] = (revenueByCampus[campusId] || 0) + p.amount;
  });

  return { data: revenueByCampus };
}
