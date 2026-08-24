# System Design Write-Up — Society Maintenance Tracker

## Complaint History Model

A complaint's status is never overwritten in place. `Complaint.status` reflects
the current state, but every transition — Open → In Progress, In Progress →
Resolved, or any admin-initiated change — writes a new immutable row to a
separate `ComplaintHistory` table containing: `complaintId`, `actorId`,
`previousStatus`, `newStatus`, an optional `note`, and a `timestamp`. This
event-sourcing-style append-only log means the complaint's full lifecycle can
always be reconstructed and displayed to the resident, and nothing is ever
silently lost — if an admin needs to review why a complaint sat in "In
Progress" for two weeks, the notes and timestamps are all there. The
`Complaint` row itself is a cache of "current state" for fast filtering and
listing; the `ComplaintHistory` table is the source of truth for anything
audit-related. Once a complaint reaches `Resolved`, the API rejects further
status transitions (returns a 400), and `resolvedAt` is stamped — this closes
the lifecycle cleanly rather than leaving it ambiguous whether a "Resolved"
complaint can silently reopen.

## Overdue Detection

Overdue status is deliberately **not** a stored column. Storing a boolean
`isOverdue` flag invites staleness — it would need a cron job or scheduled
function to keep it accurate as time passes, which is unnecessary complexity
for what is really a derived value. Instead, overdue is computed at query
time in `lib/overdue.ts`: a complaint is overdue if `status != Resolved` and
`createdAt` is older than a threshold. This is evaluated directly wherever
complaints are queried, and the sort order forces overdue complaints to the
top of the admin view regardless of whatever other filters (category, status,
date range) are active — so an admin scanning the queue always sees the most
urgent items first without having to remember to sort by "oldest."

One deliberate deviation from a single flat threshold: rather than one
configurable `OVERDUE_THRESHOLD_DAYS` applied uniformly, the threshold is
**per-priority** — High-priority complaints are flagged overdue after 24
hours open, Medium after 72 hours, and Low after 168 hours (7 days). The
reasoning: a single flat threshold treats a burst pipe and a squeaky door
identically, which doesn't reflect how a society actually needs to triage —
a High-priority issue sitting untouched for three days is a much bigger
problem than a Low-priority one in the same state, and a flat threshold
either desensitizes admins to real urgency (if set high) or floods the
overdue list with non-urgent noise (if set low). Tying the threshold to
priority means the "overdue" signal stays meaningful regardless of what an
admin has set the priority to. The trade-off is that this isn't currently
admin-configurable at runtime — the thresholds are constants in
`lib/overdue.ts` rather than an environment variable or database setting.
If the society wanted to tune these values, it would require a code change
and redeploy today; a natural extension is moving them to a single-row
`Config` table (one column per priority tier) so an admin can adjust
sensitivity live from the UI without touching infrastructure at all.

## Photo Handling

Complaint photos are optional and uploaded as `multipart/form-data` alongside
the complaint's category and description. On the server, the file is
validated for MIME type (JPEG/PNG only) and size (capped at 5MB) before being
forwarded to Cloudinary's upload API; only the returned secure HTTPS URL is
persisted on the `Complaint` row — the binary itself never touches the
application server's filesystem. This matters specifically because the app
is deployed on Vercel, where the filesystem is ephemeral and read-only at
runtime, so local disk storage was never a viable option for a hosted
deployment. Using a managed image host also means resizing, CDN delivery,
and format optimization come for free rather than being something the app
has to implement. If a resident's upload fails validation, the complaint
submission is rejected with a clear error before any database write happens,
so there's never a complaint record with a broken or partial photo reference.

## Notification Flow

Several distinct triggers fire outbound email, all via Brevo's transactional
email API (`POST /v3/smtp/email`), and all are fire-and-forget relative to
the primary request: the underlying API call is never blocked or failed by
an email delivery issue, since email is a side effect and not the source of
truth. Brevo was chosen over an initial Resend integration specifically
because Resend's free tier, without a verified sending domain, restricts
delivery to only the account owner's own inbox — unworkable for a system
that needs to notify arbitrary residents. Brevo's free tier allows sending
to any recipient once a single sender *address* (not a full domain) is
verified, which fits a fast-turnaround deployment with no DNS access.

**Complaint submission emails** fire when a resident successfully creates a
complaint, confirming receipt with the category and description — giving
the resident an immediate paper trail independent of the in-app history.

**Status change emails** fire inside the same request handler that writes a
new `ComplaintHistory` row for a status transition. The resident receives an
email summarizing the previous status, the new status, and the admin's note
if one was provided. When the new status is `Resolved`, the email explicitly
states the complaint is resolved and closed, so the resident isn't left
guessing whether further action is expected on their end.

**Admin note emails** fire when an admin adds a note to a complaint's
timeline without changing its status — handled by the same `ComplaintHistory`
write path, just with `previousStatus === newStatus`. This lets an admin
communicate progress or ask a clarifying question mid-lifecycle, and the
resident is notified the same way as a status change.

**Priority change emails** fire when an admin adjusts a complaint's priority,
independent of status — since a priority bump is itself meaningful
information (e.g. "we've escalated this") worth surfacing to the resident.

**Important notice emails** fire when an admin creates a notice with
`isImportant = true`. The handler fetches all users with role `RESIDENT` and
sends each one an email containing the notice title and body. At the scale
of a single apartment society (tens to low hundreds of residents), a simple
loop of individual sends is well within Brevo's free-tier limits (300/day)
and avoids the complexity of a queue or batch job; if the resident count
grew significantly, this is the natural place to introduce a background job
queue rather than sending synchronously inside the API request.

Every path is wrapped in try/catch with explicit error logging, so a
transient email provider failure never surfaces as a failed status update or
failed complaint submission to the user — it's logged server-side for
debugging, and the core data operation still succeeds regardless. This keeps
the notification layer additive and non-critical-path, which is the right
trade-off for a system where email is a convenience layered on top of an
in-app system of record, not the system of record itself.
