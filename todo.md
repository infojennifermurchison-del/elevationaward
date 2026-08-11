# RISEhigHER Elevation Award — TODO

## Phase 1: Database & Backend
- [x] Extend drizzle schema: applications table with all 6 parts, budget_items, uploaded_files
- [x] Generate and apply migration SQL
- [x] Add db query helpers for applications
- [x] Add tRPC routers: application CRUD, file upload, admin procedures
- [x] Owner notification on new submission

## Phase 2: Public Landing Page
- [x] Hero section with award name, $1,000 amount, sponsor credit
- [x] Live countdown timer to July 31 11:59 PM CT
- [x] Eligibility requirements section
- [x] Scoring criteria section
- [x] CTA button to apply (login-gated)
- [x] Responsive design, elegant typography

## Phase 3: Application Form (Multi-Step)
- [x] Applicant login/register flow
- [x] Application dashboard (resume/start)
- [x] Part I: Business information (8 fields)
- [x] Part II: Eligibility certifications with disqualification gate
- [x] Part III: Organizational narratives with live word counters
- [x] Part IV: Use of funds + itemized budget builder + 90-day impact
- [x] Part V: Document uploads (4 required PDFs via S3)
- [x] Part VI: Certifications checkboxes + e-signature + date
- [x] Auto-save draft on every change
- [x] Progress indicator across all 6 steps
- [x] Deadline enforcement: lock form after July 31 11:59 PM CT

## Phase 4: Admin Dashboard
- [x] Owner-only route guard
- [x] List all submitted applications with status
- [x] Full application detail view (all 6 parts)
- [x] Download uploaded documents
- [x] Mark winner functionality
- [x] Application status management

## Phase 5: Polish & Tests
- [x] Global design tokens: navy/gold palette, elegant typography
- [x] Responsive mobile layout
- [x] Loading/empty/error states throughout
- [x] Vitest unit tests for key procedures (18 tests passing)
- [x] Deadline enforcement test
- [x] Checkpoint save

## Phase 6: Evaluator System
- [x] evaluator_invites table (token, email, name, used, createdAt)
- [x] evaluator_scores table (inviteId, applicationId, scores per rubric category, notes, submittedAt)
- [x] Admin: create/revoke evaluator invites with copyable magic link
- [x] Evaluator portal: accept invite page, application list, scoring form with 100-pt rubric
- [x] Admin: per-application score breakdown (all evaluator scores visible)
- [x] Admin: auto-ranked leaderboard by average total score
- [x] Evaluator scores averaged and displayed per application

## Phase 7: Founder Story & Mission/Vision
- [x] Add "Why This Award Exists" section — Jennifer's founder story and the $1,000 impact framing
- [x] Add Mission & Vision section — women-founded businesses, supported environment, economic development lane
- [x] Add "About The Murchison Consulting Group" section — Jennifer Murchison, Principal Consultant
- [x] Add organization tagline and positioning on landing page

## Phase 8: UX Improvements
- [x] Add "Save & Exit" button on each step of the application form
- [x] Add contact support link/mailto on the application page

## Phase 9: FAQ & Winner Announcement
- [x] Add FAQ section to landing page with 8-10 common questions
- [x] Add winner announcement toggle in admin dashboard
- [x] Add winner announcement banner on landing page (shown when toggle is on)
- [x] Store announcement state and winner business name in database

## Phase 10: Complete Data & Website Handoff
- [x] Inventory website source, application records, evaluator scores, and uploaded supporting files
- [x] Produce an export package with portable website source and all retrievable application data
- [x] Create an export manifest and secure download instructions
- [x] Correct uploaded-file key persistence so future supporting-document downloads use the actual storage key
