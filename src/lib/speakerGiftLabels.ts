// Browser-safe: no Admin SDK, so the speaker gift form and the API route share these.

export const SPEAKER_GIFT_TEXT_LIMIT = 120;
export const SPEAKER_GIFT_POSTCODE_LIMIT = 20;
export const SPEAKER_GIFT_PHONE_LIMIT = 30;

// Shown beside the tick and stored as agreed to, so the wording a speaker saw is the
// wording we act on. Change it here and both the form and the privacy note follow.
export const ASANA_CONSENT_LABEL =
  'I agree to GDG Sydney sharing my name and work email with Asana, so they can set up my trial.';

// What a speaker can see and change on their own form: everything they sent, but none of
// the bookkeeping.
export interface SpeakerGiftFormFields {
  wantsMug: boolean;
  recipientName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  phone: string;
  wantsAsanaTrial: boolean;
  workEmail: string;
  asanaConsent: boolean;
}

export const EMPTY_SPEAKER_GIFT_FIELDS: SpeakerGiftFormFields = {
  wantsMug: true,
  recipientName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postcode: '',
  country: 'Australia',
  phone: '',
  wantsAsanaTrial: true,
  workEmail: '',
  asanaConsent: false,
};

export type SpeakerGiftErrors = Partial<Record<keyof SpeakerGiftFormFields | 'form', string>>;

// The one set of rules, run by the form before it posts and by the API route after, so
// the two can't drift. Returns an empty object when the fields are good to save.
export function findSpeakerGiftErrors(fields: SpeakerGiftFormFields, emailPattern: RegExp): SpeakerGiftErrors {
  const errors: SpeakerGiftErrors = {};
  const tooLong = (limit: number) => `This must be ${limit} characters or fewer.`;

  if (!fields.wantsMug && !fields.wantsAsanaTrial) {
    errors.form = 'Pick the mug, the Asana trial or both, or just close this page if you\'d rather not have either.';
  }

  if (fields.wantsMug) {
    const required: [keyof SpeakerGiftFormFields, string][] = [
      ['recipientName', 'Please enter the name to put on the parcel.'],
      ['addressLine1', 'Please enter your street address.'],
      ['city', 'Please enter your city or suburb.'],
      ['country', 'Please enter your country.'],
      ['phone', 'Please enter a phone number, in case the courier needs to reach you.'],
    ];
    for (const [key, message] of required) {
      if (!String(fields[key]).trim()) errors[key] = message;
    }
    for (const key of ['recipientName', 'addressLine1', 'addressLine2', 'city', 'region', 'country'] as const) {
      if (!errors[key] && fields[key].trim().length > SPEAKER_GIFT_TEXT_LIMIT) errors[key] = tooLong(SPEAKER_GIFT_TEXT_LIMIT);
    }
    if (fields.postcode.trim().length > SPEAKER_GIFT_POSTCODE_LIMIT) errors.postcode = tooLong(SPEAKER_GIFT_POSTCODE_LIMIT);
    if (!errors.phone && fields.phone.trim().length > SPEAKER_GIFT_PHONE_LIMIT) errors.phone = tooLong(SPEAKER_GIFT_PHONE_LIMIT);
  }

  if (fields.wantsAsanaTrial) {
    if (!emailPattern.test(fields.workEmail.trim())) errors.workEmail = 'Please enter your work email address.';
    else if (fields.workEmail.trim().length > SPEAKER_GIFT_TEXT_LIMIT) errors.workEmail = tooLong(SPEAKER_GIFT_TEXT_LIMIT);
    if (!fields.asanaConsent) errors.asanaConsent = 'We need your OK to pass your work email to Asana, or untick the trial.';
  }

  return errors;
}
