import type { NextRequest } from 'next/server';
import { respondWith } from '@/lib/publicApi';
import { groupSponsorsByTier, loadCommunityPartners, loadPartnerAssets, loadSponsors, TIER_LABELS } from '@/lib/sponsors';
import type { PartnerOrganisation } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PublicOrganisation {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  description: string | null;
}

// Sort order and the hidden flag stay behind: the lists already arrive in order, and a
// hidden sponsor never reaches this far.
function toPublicOrganisation(organisation: PartnerOrganisation): PublicOrganisation {
  return {
    id: organisation.id,
    name: organisation.name,
    logoUrl: organisation.logoUrl,
    website: organisation.website,
    description: organisation.description ?? null,
  };
}

// What /partners and the landing page's partner strip show. Google (presenting) and Torrens
// (venue) come from settings/site and sit above the tiers, which is why the Diamond tier is
// left out of `sponsorTiers`, as it is on the pages.
export async function GET(request: NextRequest) {
  return respondWith(request, 'partners', async () => {
    const [sponsors, communityPartners, assets] = await Promise.all([
      loadSponsors(),
      loadCommunityPartners(),
      loadPartnerAssets(),
    ]);
    return {
      presentingPartner: { name: 'Google', logoUrl: assets.googleLogoUrl },
      venuePartner: { name: 'Torrens University', logoUrl: assets.torrensLogoUrl },
      sponsorshipProspectusUrl: assets.sponsorshipProspectusUrl,
      sponsorTiers: groupSponsorsByTier(sponsors).map((group) => ({
        tier: group.tier,
        label: TIER_LABELS[group.tier],
        sponsors: group.sponsors.map(toPublicOrganisation),
      })),
      communityPartners: communityPartners.map(toPublicOrganisation),
    };
  });
}
