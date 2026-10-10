'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';

// The form is open to anyone with the link, so this is for spam and for someone who asks
// to be taken off the list.
export async function deleteCreditRequest(requestId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('creditRequests').doc(requestId).delete();
    revalidatePath('/admin/credits');
    return {};
  } catch {
    return { error: 'Could not delete this request. Please try again.' };
  }
}
