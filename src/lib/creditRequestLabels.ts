// Browser-safe: no Admin SDK, so the request form and the API route share these limits.

export const CREDIT_REQUEST_NAME_LIMIT = 120;
export const CREDIT_REQUEST_NOTE_LIMIT = 500;

// One option in the workshop select: a workshop on the schedule with a confirmed speaker.
export interface CreditWorkshopOption {
  id: string;
  label: string;
}
