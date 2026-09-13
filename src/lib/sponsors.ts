import { adminDb } from '@/lib/firebase-admin';
import type { CommunityPartner, Sponsor, SponsorTier } from '@/lib/types';

export const TIER_ORDER: SponsorTier[] = ['platinum', 'gold', 'silver', 'community'];

export const TIER_LABELS: Record<SponsorTier, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  community: 'Community',
};

// Every fetch here returns an empty value rather than throwing, so a Firestore blip
// leaves a page without its sponsors rather than without itself.
export async function fetchSponsors(): Promise<Sponsor[]> {
  try {
    const snapshot = await adminDb.collection('sponsors').orderBy('order').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sponsor));
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

// The presenting and venue partner logos and the prospectus PDF all live on the
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
