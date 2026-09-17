import { adminDb } from '@/lib/firebase-admin';
import type { CommunityPartner, Sponsor, SponsorTier } from '@/lib/types';

export const TIER_ORDER: SponsorTier[] = ['platinum', 'gold', 'silver', 'community'];

export const TIER_LABELS: Record<SponsorTier, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  community: 'Community',
};

// Logo boxes step down from the Diamond sponsor (Google) and the Venue sponsor (Torrens),
// which sit above every tier, through Platinum to Community. Each box caps both height and
// width, so a stacked lockup fills the height and a wide wordmark the width.
export const LANDING_LOGO_BOXES = {
  diamond: 'h-16 w-52',
  venue: 'h-14 w-44',
  tiers: { platinum: 'h-12 w-40', gold: 'h-11 w-36', silver: 'h-10 w-32', community: 'h-9 w-28' } satisfies Record<SponsorTier, string>,
};

export const PARTNERS_CARD_LOGO_BOXES: Record<SponsorTier, string> = {
  platinum: 'h-22 w-56',
  gold: 'h-20 w-48',
  silver: 'h-14 w-40',
  community: 'h-12 w-36',
};

export const PARTNERS_ROW_LOGO_BOXES: Record<SponsorTier, string> = {
  platinum: 'h-16 w-44',
  gold: 'h-14 w-40',
  silver: 'h-12 w-36',
  community: 'h-10 w-32',
};

// Every fetch here returns an empty value rather than throwing, so a Firestore blip
// leaves a page without its sponsors rather than without itself.
export async function fetchSponsors(): Promise<Sponsor[]> {
  try {
    const snapshot = await adminDb.collection('sponsors').orderBy('order').get();
    // Filtered here rather than in the query: a `where('hidden', '!=', true)` would drop
    // every document without the field, which is most of them.
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Sponsor))
      .filter((sponsor) => !sponsor.hidden);
  } catch {
    return [];
  }
}

export async function fetchCommunityPartners(): Promise<CommunityPartner[]> {
  try {
    const snapshot = await adminDb.collection('partners').orderBy('order').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CommunityPartner));
  } catch {
    return [];
  }
}

export function groupSponsorsByTier(sponsors: Sponsor[]): { tier: SponsorTier; sponsors: Sponsor[] }[] {
  return TIER_ORDER.map((tier) => ({
    tier,
    sponsors: sponsors.filter((sponsor) => sponsor.tier === tier),
  })).filter((group) => group.sponsors.length > 0);
}

export interface PartnerAssets {
  sponsorshipProspectusUrl: string | null;
  googleLogoUrl: string | null;
  torrensLogoUrl: string | null;
}

// The Diamond and Venue sponsor logos and the prospectus PDF all live on the
// settings/site document, so one read covers the lot.
export async function fetchPartnerAssets(): Promise<PartnerAssets> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    const data = doc.data() ?? {};
    return {
      sponsorshipProspectusUrl: (data.sponsorshipProspectusUrl as string | undefined) ?? null,
      googleLogoUrl: (data.googleLogoUrl as string | undefined) ?? null,
      torrensLogoUrl: (data.torrensLogoUrl as string | undefined) ?? null,
    };
  } catch {
    return { sponsorshipProspectusUrl: null, googleLogoUrl: null, torrensLogoUrl: null };
  }
}

export async function fetchSponsorshipProspectusUrl(): Promise<string | null> {
  return (await fetchPartnerAssets()).sponsorshipProspectusUrl;
}
