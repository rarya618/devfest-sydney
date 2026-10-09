'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';

// The survey is open to anyone with the link, so this is for spam and for someone who
// asks for what they wrote to be removed. Gone for good: there is nothing to restore.
export async function deleteFeedbackResponse(responseId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('feedback').doc(responseId).delete();
    revalidatePath('/admin/feedback');
    return {};
  } catch {
    return { error: 'Could not delete this response. Please try again.' };
  }
}
