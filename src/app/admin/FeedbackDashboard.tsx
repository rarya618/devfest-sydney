'use client';

import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { csvFilename, downloadCsv } from '@/lib/csv';
import { formatDate } from '@/lib/format';
import {
  FEEDBACK_ACTIVITIES,
  FEEDBACK_ACTIVITY_LABELS,
  FEEDBACK_ASPECTS,
  FEEDBACK_ASPECT_LABELS,
  FEEDBACK_RETURN_INTENTS,
  FEEDBACK_RETURN_LABELS,
  FEEDBACK_ROLES,
  FEEDBACK_ROLE_LABELS,
} from '@/lib/feedbackLabels';
import type { FeedbackResponse } from '@/lib/types';
import { BarRow, BreakdownCard, EmptyState, StatTile } from './(dashboard)/analytics/shared';
import { deleteFeedbackResponse } from './feedbackActions';
import StickyAdminHeader from './StickyAdminHeader';

interface Props {
  responses: FeedbackResponse[];
}

type CommentFilter = 'all' | 'enjoyedMost' | 'improve' | 'topicsNextYear';

const COMMENT_FILTERS: { value: CommentFilter; label: string }[] = [
  { value: 'all', label: 'Everything written' },
  { value: 'enjoyedMost', label: 'Enjoyed most' },
  { value: 'improve', label: 'Do better' },
  { value: 'topicsNextYear', label: 'Next year' },
];

function average(values: number[]): number {
  return values.length > 0 ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0;
}

// Net Promoter Score: the share of 9s and 10s minus the share of 0 to 6, from -100 to 100.
function netPromoterScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const promoters = scores.filter((score) => score >= 9).length;
  const detractors = scores.filter((score) => score <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

function hasWriting(response: FeedbackResponse): boolean {
  return Boolean(response.enjoyedMost || response.improve || response.topicsNextYear);
}

// An average out of 5 as a bar, with how many people it is drawn from. BarRow shows a
// share of a total, which is the wrong reading for a mean.
function AverageRow({ label, ratings }: { label: string; ratings: number[] }) {
  const mean = average(ratings);
  return (
    <div title={`${label}: ${mean} out of 5 from ${ratings.length} ratings`}>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-white/70">{label}</span>
        <span className="text-white/55 text-xs shrink-0 font-mono">
          {ratings.length > 0 ? `${mean.toFixed(1)} / 5 · ${ratings.length}` : 'No ratings'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-google-blue" style={{ width: `${(mean / 5) * 100}%` }} />
      </div>
    </div>
  );
}

function ResponseCard({ response, onError }: { response: FeedbackResponse; onError: (message: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteFeedbackResponse(response.id);
      if (result.error) onError(result.error);
    });
  }

  const writing: { label: string; text: string }[] = [
    { label: 'Enjoyed most', text: response.enjoyedMost },
    { label: 'Do better', text: response.improve },
    { label: 'Next year', text: response.topicsNextYear },
  ].filter((entry) => entry.text);

  return (
    <li className="bg-surface rounded-xl p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
        <span className="px-2 py-1 rounded bg-google-blue/15 text-google-blue-light">Overall {response.overallRating}/5</span>
        <span className="px-2 py-1 rounded bg-white/[0.08] text-white/75">Recommend {response.recommendScore}/10</span>
        {response.role && <span className="px-2 py-1 rounded bg-white/[0.08] text-white/75">{FEEDBACK_ROLE_LABELS[response.role]}</span>}
        <span className="ml-auto text-white/50">{formatDate(response.submittedAt)}</span>
      </div>

      {writing.map((entry) => (
        <div key={entry.label}>
          <p className="text-xs font-bold text-white/55 mb-0.5">{entry.label}</p>
          <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line">{entry.text}</p>
        </div>
      ))}

      {response.favouriteSessionTitle && (
        <p className="text-xs text-white/60"><span className="font-bold text-white/75">Favourite session:</span> {response.favouriteSessionTitle}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
        {response.email ? (
          <a href={`mailto:${response.email}`} className="text-xs text-white/80 underline underline-offset-2 hover:text-white">{response.email}</a>
        ) : (
          <span className="text-xs text-white/50">Anonymous</span>
        )}
        {confirmingDelete ? (
          <span className="flex items-center gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} disabled={isPending} aria-label="Keep this response" className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/35 text-white/80 hover:border-white disabled:opacity-40">
              Keep
            </button>
            <button type="button" onClick={handleDelete} disabled={isPending} aria-label="Delete this response for good" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-google-red-deep border border-google-red-deep text-white hover:opacity-90 disabled:opacity-40">
              Delete
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)} aria-label="Delete this response" className="text-xs font-bold text-white/55 hover:text-google-red-light">
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

export default function FeedbackDashboard({ responses }: Props) {
  const [commentFilter, setCommentFilter] = useState<CommentFilter>('all');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const total = responses.length;
  const recommendScores = responses.map((response) => response.recommendScore);
  const promoterCount = recommendScores.filter((score) => score >= 9).length;
  const passiveCount = recommendScores.filter((score) => score === 7 || score === 8).length;
  const detractorCount = recommendScores.filter((score) => score <= 6).length;
  const firstDevFestAnswers = responses.filter((response) => response.isFirstDevFest !== null);

  const favouriteSessionCounts = new Map<string, number>();
  for (const response of responses) {
    if (response.favouriteSessionTitle) {
      favouriteSessionCounts.set(response.favouriteSessionTitle, (favouriteSessionCounts.get(response.favouriteSessionTitle) ?? 0) + 1);
    }
  }
  const topSessions = [...favouriteSessionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const favouriteSessionAnswerCount = [...favouriteSessionCounts.values()].reduce((sum, count) => sum + count, 0);

  const visibleResponses = responses.filter((response) =>
    commentFilter === 'all' ? hasWriting(response) : Boolean(response[commentFilter])
  );

  function exportCsv() {
    const rows = [
      [
        'Submitted',
        'Overall (1-5)',
        'Recommend (0-10)',
        ...FEEDBACK_ASPECTS.map((aspect) => `${FEEDBACK_ASPECT_LABELS[aspect]} (1-5)`),
        'Got to',
        'Favourite session',
        'Enjoyed most',
        'Do better',
        'Next year',
        'Role',
        'First DevFest',
        'Come back',
        'Email',
      ],
      ...responses.map((response) => [
        response.submittedAt,
        String(response.overallRating),
        String(response.recommendScore),
        ...FEEDBACK_ASPECTS.map((aspect) => String(response.aspectRatings[aspect] ?? '')),
        response.activities.map((activity) => FEEDBACK_ACTIVITY_LABELS[activity]).join('; '),
        response.favouriteSessionTitle,
        response.enjoyedMost,
        response.improve,
        response.topicsNextYear,
        response.role ? FEEDBACK_ROLE_LABELS[response.role] : '',
        response.isFirstDevFest === null ? '' : response.isFirstDevFest ? 'Yes' : 'No',
        response.returnIntent ? FEEDBACK_RETURN_LABELS[response.returnIntent] : '',
        response.email,
      ]),
    ];
    downloadCsv(csvFilename('feedback'), rows);
  }

  return (
    <>
      <StickyAdminHeader className="z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#010103]/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Feedback</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {total} response{total === 1 ? '' : 's'} &middot;{' '}
              <Link href="/feedback" className="underline underline-offset-2 hover:text-white">Open the survey</Link>
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={total === 0}
            aria-label="Download every feedback response as a CSV file"
            className="text-sm font-bold px-4 py-2 rounded-lg border border-white/35 text-white/85 hover:border-white transition-colors disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </StickyAdminHeader>

      <div className="px-4 md:px-5 pb-10">
        {total === 0 ? (
          <EmptyState message="No feedback yet. Share /feedback with attendees to start collecting it." />
        ) : (
          <>
            <div className="flex flex-wrap gap-2.5 mb-6">
              <StatTile label="Responses" count={total} icon="layers" />
              <StatTile label="Overall, out of 5" count={average(responses.map((response) => response.overallRating))} icon="check" accent="green" />
              <StatTile
                label="Net Promoter Score"
                count={netPromoterScore(recommendScores)}
                subtext="Share of 9 and 10 minus share of 0 to 6"
                icon="users"
                accent="blue"
              />
              <StatTile label="Left an email" count={responses.filter((response) => response.email).length} icon="clock" accent="yellow" />
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
              <BreakdownCard title="Overall rating">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <BarRow key={rating} label={`${rating} out of 5`} count={responses.filter((response) => response.overallRating === rating).length} total={total} />
                ))}
              </BreakdownCard>

              <BreakdownCard title="Would recommend">
                <BarRow label="Promoters (9 to 10)" count={promoterCount} total={total} barClass="bg-google-green" />
                <BarRow label="Passives (7 to 8)" count={passiveCount} total={total} barClass="bg-google-yellow" />
                <BarRow label="Detractors (0 to 6)" count={detractorCount} total={total} barClass="bg-google-red" />
              </BreakdownCard>

              <BreakdownCard title="Each part, average">
                {FEEDBACK_ASPECTS.map((aspect) => (
                  <AverageRow
                    key={aspect}
                    label={FEEDBACK_ASPECT_LABELS[aspect]}
                    ratings={responses.flatMap((response) => (response.aspectRatings[aspect] ? [response.aspectRatings[aspect]] : []))}
                  />
                ))}
              </BreakdownCard>

              <BreakdownCard title="What people got to">
                {FEEDBACK_ACTIVITIES.map((activity) => (
                  <BarRow key={activity} label={FEEDBACK_ACTIVITY_LABELS[activity]} count={responses.filter((response) => response.activities.includes(activity)).length} total={total} />
                ))}
              </BreakdownCard>

              <BreakdownCard title="Favourite sessions">
                {topSessions.length === 0 ? (
                  <p className="text-sm text-white/55">Nobody has picked one yet.</p>
                ) : (
                  topSessions.map(([title, count]) => (
                    <BarRow key={title} label={title} count={count} total={favouriteSessionAnswerCount} barClass="bg-google-green" />
                  ))
                )}
              </BreakdownCard>

              <BreakdownCard title="Who answered">
                {FEEDBACK_ROLES.map((role) => (
                  <BarRow key={role} label={FEEDBACK_ROLE_LABELS[role]} count={responses.filter((response) => response.role === role).length} total={total} />
                ))}
                <BarRow
                  label="First DevFest"
                  count={firstDevFestAnswers.filter((response) => response.isFirstDevFest).length}
                  total={firstDevFestAnswers.length}
                  barClass="bg-google-yellow"
                />
                {FEEDBACK_RETURN_INTENTS.map((intent) => (
                  <BarRow
                    key={intent}
                    label={`Coming back: ${FEEDBACK_RETURN_LABELS[intent]}`}
                    count={responses.filter((response) => response.returnIntent === intent).length}
                    total={responses.filter((response) => response.returnIntent).length}
                    barClass="bg-google-green"
                  />
                ))}
              </BreakdownCard>
            </div>

            <h2 className="text-base font-bold text-white mb-3">What people wrote</h2>
            <div role="group" aria-label="Filter written answers" className="mb-4 flex flex-wrap gap-1.5">
              {COMMENT_FILTERS.map((filter) => {
                const count = responses.filter((response) => (filter.value === 'all' ? hasWriting(response) : Boolean(response[filter.value]))).length;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={commentFilter === filter.value}
                    onClick={() => setCommentFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      commentFilter === filter.value ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {filter.label} <span className="font-mono">{count}</span>
                  </button>
                );
              })}
            </div>

            {visibleResponses.length === 0 ? (
              <p className="mt-6 text-center text-sm text-white/55">Nothing written here yet.</p>
            ) : (
              <ul className="space-y-3">
                {visibleResponses.map((response) => (
                  <ResponseCard key={response.id} response={response} onError={setAlertMessage} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
