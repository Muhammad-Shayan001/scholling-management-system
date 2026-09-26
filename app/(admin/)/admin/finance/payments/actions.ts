'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface PaymentInput {
  invoice_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'online';
  transaction_id?: string;
  notes?: string;
}

export async function recordPayment(input: PaymentInput) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    // 1. Verify invoice exists and is not fully paid
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('amount, status')
      .eq('id', input.invoice_id)
      .single();

    if (invError || !invoice) throw new Error('Invoice not found');
    if (invoice.status === 'paid') throw new Error('Invoice is already fully paid');

    // 2. Record the payment
    const { error: payError } = await adminSupabase
      .from('payments')
      .insert({
        invoice_id: input.invoice_id,
        amount: input.amount_paid,
        payment_date: input.payment_date,
        payment_method: input.payment_method,
        transaction_id: input.transaction_id,
        notes: input.notes,
        recorded_by: user.id,
      });

    if (payError) throw payError;

    // 3. Update Invoice Status
    // In a real system, we'd calculate total payments vs invoice amount
    const { error: statusError } = await adminSupabase
      .from('invoices')
      .update({ status: 'paid' }) // Simplified: mark as paid on any payment for now
      .eq('id', input.invoice_id);

    if (statusError) throw statusError;

    revalidatePath('/admin/finance/invoices');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to record payment' };
  }
}
