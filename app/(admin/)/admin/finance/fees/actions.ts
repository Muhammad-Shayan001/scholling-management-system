'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface FeeStructureInput {
  class_id: string;
  fee_category: string;
  amount: number;
  billing_cycle: 'monthly' | 'termly' | 'annually';
  description: string;
}

export async function createFeeStructure(input: FeeStructureInput) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization not found' };
  const orgId = membership.organization_id;

  try {
    const { error } = await adminSupabase
      .from('fee_structures')
      .insert({
        organization_id: orgId,
        class_id: input.class_id,
        fee_category: input.fee_category,
        amount: input.amount,
        billing_cycle: input.billing_cycle,
        description: input.description,
      });

    if (error) throw error;

    revalidatePath('/admin/finance/fees');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to create fee structure' };
  }
}

export async function generateInvoicesForClass(classId: string, month: string, year: string) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization not found' };
  const orgId = membership.organization_id;

  try {
    // 1. Get all active students in the class
    const { data: enrollments } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('class_id', classId)
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) return { error: 'No active students found in this class' };

    // 2. Get all fee structures for this class
    const { data: structures } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('class_id', classId);

    if (!structures || structures.length === 0) return { error: 'No fee structures defined for this class' };

    // 3. Generate invoices
    for (const enrollment of enrollments) {
      const studentId = enrollment.student_id;

      // Calculate total for this student
      const totalAmount = structures.reduce((sum, s) => sum + s.amount, 0);

      const { error: invoiceError } = await adminSupabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          student_id: studentId,
          amount: totalAmount,
          due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          status: 'unpaid',
          billing_period: `${month} ${year}`,
        });

      if (invoiceError) console.error(`Error generating invoice for ${studentId}:`, invoiceError);
    }

    revalidatePath('/admin/finance/invoices');
    return { success: true, count: enrollments.length };
  } catch (error: any) {
    return { error: error.message || 'Failed to generate invoices' };
  }
}
