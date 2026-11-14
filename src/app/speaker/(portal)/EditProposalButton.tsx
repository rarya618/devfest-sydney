'use client';

import { useDashboardPanels } from './DashboardWorkspace';
import { secondaryButton } from './portalStyles';

// Opens a pending proposal in the dashboard's panel. A client island inside the server-rendered
// proposals list, which is why it isn't part of that list.
export default function EditProposalButton({ proposalId, talkTitle }: { proposalId: string; talkTitle: string }) {
  const panels = useDashboardPanels();
  return (
    <button
      id={`edit-proposal-${proposalId}`}
      type="button"
      onClick={() => panels.openEditProposal(proposalId, `edit-proposal-${proposalId}`)}
      aria-label={`Edit ${talkTitle}`}
      className={`${secondaryButton} self-start`}
    >
      Edit
    </button>
  );
}
