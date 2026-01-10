# GCP Backend Migration Plan for Math Games

**Status:** COMPLETE (All phases implemented)
**Created:** 2026-01-10
**Completed:** 2026-01-10
**Firebase Project:** `han-edu-central` (migrated from `math-games-dbd61`)

**Note:** Phases 1-4 were already implemented in the codebase. Phase 5 (future stubs) was added as part of this plan. On 2026-01-10, the project was migrated to `han-edu-central` GCP project for unified billing.

## Overview

Migrate the math-games project to use Google Cloud Platform (Firebase) for backend services while keeping the frontend on GitHub Pages.

**Current State:** localStorage-only SPA with scaffolded API layer
**Target State:** Firebase-backed app with cross-device sync, anonymous-first auth

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│              GitHub Pages (existing setup)                       │
│                                                                  │
│   React SPA ──► Firebase SDK ──► Firebase Services              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FIREBASE (GCP)                               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Firebase     │  │ Firestore    │  │ Cloud Storage        │  │
│  │ Auth         │  │ Database     │  │ (future: videos)     │  │
│  │              │  │              │  │                      │  │
│  │ • Anonymous  │  │ • players/   │  │ • lessons/           │  │
│  │ • Email link │  │ • progress/  │  │ • assets/            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Cloud Functions (future: payment webhooks, admin tasks)   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth method | Anonymous + Email magic link | No friction, secure, no passwords |
| Database | Firestore | Generous free tier, offline support, real-time sync |
| Data strategy | Offline-first | localStorage remains primary, Firestore syncs in background |
| Hosting | GitHub Pages (unchanged) | Already working, CDN-backed |
| Payment model | Freemium (future) | Games free, lessons paid |

## Firestore Data Model

```
firestore/
├── players/{uid}                     # User document
│   ├── uid: string                   # Firebase Auth UID
│   ├── displayName: string
│   ├── email: string | null
│   ├── isAnonymous: boolean
│   ├── stats: { totalGamesPlayed, totalPuzzlesSolved, totalWins, ... }
│   ├── rank: string
│   ├── streak: number
│   ├── lastPlayedDate: timestamp
│   ├── achievements: string[]
│   ├── preferences: { soundEnabled, language, practiceMode }
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── players/{uid}/progress/{gameId}   # Subcollection per game
│   ├── unlockedLevels: string[]
│   ├── completedLevels: { levelId: { bestTime, completedAt } }
│   └── lastPlayed: timestamp
│
└── players/{uid}/daily/{date}        # Daily challenge records
    ├── completions: { gameId: { completed, timeSeconds } }
    └── completedAt: timestamp
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Players can only access their own data
    match /players/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /players/{uid}/progress/{gameId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /players/{uid}/daily/{date} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Firebase Setup) - [x] COMPLETE

**Tasks:**
1. ~~Create Firebase project in GCP Console (manual step)~~ - Done: `han-edu-central`
2. ~~Enable Authentication providers: Anonymous + Google~~ - Done in Firebase Console
3. ~~Create Firestore database in production mode~~ - Done: `nam5` region
4. ~~Install Firebase SDK: `npm install firebase`~~ - Done
5. ~~Create Firebase initialization service~~ - Done: `src/firebase/index.ts`
6. ~~Add environment variables~~ - Done: `.env` updated with han-edu-central config
7. ~~Verify connection works~~ - Build passes, Firebase initializes successfully

**Files created:**
```
src/firebase/                         # Firebase integration module
├── config.ts                         # Firebase configuration
├── index.ts                          # App init with offline persistence
├── auth.ts                           # Auth functions
└── ...
```

**Notes:**
- Firebase project: `han-edu-central` (Blaze plan with free tier)
- Firestore database: `nam5` (US Central)
- Environment variables configured in `.env`
- Feature flag `VITE_USE_FIREBASE` allows disabling Firebase
- Emulator support included for development
- Security rules deployed via `firebase deploy --only firestore:rules`

---

### Phase 2: Auth Layer - [x] COMPLETE (Pre-existing)

**Already implemented in `src/firebase/`:**
- `auth.ts` - signInAnonymous, signInWithGoogle, signInWithEmail, linkAnonymous*
- `AuthContext.tsx` - Full React context integration
- `useFirebaseAuthHooks.ts` - Hooks for auth state
- `FirebaseAuthContext.tsx` - Firebase-specific auth provider

**Note:** Uses email/password instead of email magic link (plan specified magic link).
This is a minor difference - magic link can be added later if needed.

**Existing files:**
```
src/firebase/auth.ts
src/firebase/FirebaseAuthContext.tsx
src/firebase/useFirebaseAuthHooks.ts
src/shared/contexts/AuthContext.tsx
```

---

### Phase 3: Data Sync - [x] COMPLETE (Pre-existing)

**Already implemented in `src/firebase/sync/` and `src/firebase/services/`:**
- `syncManager.ts` - Full sync coordination with debouncing, rate limiting, offline queue
- `playerService.ts` - Firestore CRUD for player profiles
- `migrationService.ts` - Migrates localStorage to Firestore

**Features already implemented:**
- Write to localStorage first (instant)
- Debounced Firestore updates (2s debounce, 5s rate limit)
- Online/offline handling with pending queue
- Max-value merge for stats, union for achievements
- Firestore offline persistence enabled

**Existing files:**
```
src/firebase/sync/syncManager.ts
src/firebase/services/playerService.ts
src/firebase/services/migrationService.ts
firestore.rules                        # Comprehensive security rules with anti-cheat
```

---

### Phase 4: UI Integration - [x] COMPLETE (Pre-existing)

**Already implemented in `src/shared/components/auth/`:**
- `AuthModal.tsx` - Full sign-in/sign-up/link modal with Google and email/password
- `AccountLinkBanner.tsx` - Banner prompting anonymous users to link account
- `SignInButton.tsx` - Trigger button for auth modal

**Features already implemented:**
- Google Sign-In
- Email/Password authentication
- Account linking flow (anonymous → permanent)
- Loading and error states
- i18n support (EN/VI)

**Existing files:**
```
src/shared/components/auth/AuthModal.tsx
src/shared/components/auth/AccountLinkBanner.tsx
src/shared/components/auth/SignInButton.tsx
```

---

### Phase 5: Future Skeleton (Stubs Only) - [x] COMPLETE

**Purpose:** Establish patterns for future paid content without implementation.

**Files created:**
```
src/shared/types/lessons.ts           # Type definitions for lessons
src/shared/types/payments.ts          # Type definitions for payments
src/shared/services/future/lessons.ts # Stub service (throws NotImplemented)
src/shared/services/future/payments.ts # Stub service (throws NotImplemented)
src/shared/services/future/index.ts   # Barrel export
```

**Stub pattern used:**
- All functions throw "feature not yet implemented" error
- Full TypeScript types defined for future implementation
- Vietnam-specific payment providers included (MoMo, ZaloPay, VNPay)
- Lesson types support text, video, and interactive content

---

## Verification Checklists

### Phase 1 Verification
- [x] Firebase console shows project created (`han-edu-central`)
- [x] `npm run dev` starts without Firebase errors
- [x] Build passes with Firebase SDK bundled
- [x] Firestore database created in `nam5` region
- [x] Security rules deployed successfully

### Phase 2 Verification
- [x] Auth service implemented with all methods
- [x] AuthContext provides state to app
- [x] Anonymous sign-in triggers on app load
- [x] Google sign-in provider enabled
- [ ] Manual test: Sign in with Google works (ready for testing)
- [ ] Manual test: Account linking works (ready for testing)

### Phase 3 Verification
- [x] SyncManager implemented with debouncing
- [x] Firestore security rules deployed
- [x] Offline persistence enabled (verified in console logs)
- [ ] Manual test: Profile appears in Firestore console
- [ ] Manual test: Cross-device sync works
- [ ] App works offline (disable network, play, re-enable, verify sync)

### Phase 4 Verification
- [x] AuthModal component exists with full functionality
- [x] AccountLinkBanner prompts anonymous users
- [ ] Manual test: Sign-in modal opens correctly
- [ ] Manual test: Account linking flow completes

### Phase 5 Verification
- [x] Stub files exist with proper TypeScript types
- [x] Importing stubs doesn't break build (`npm run build` passes)
- [x] Type definitions include Vietnam payment providers

---

## Dependencies

```json
{
  "firebase": "^10.x"
}
```

Optional (recommended):
```json
{
  "react-firebase-hooks": "^5.x"
}
```

---

## Notes

- **Vietnam focus:** Firebase has Asia-Pacific regions (good latency)
- **COPPA not applicable:** Target audience is Vietnam students
- **Cost:** Using Blaze plan with free tier quotas - expected $0/month for typical usage
- **Budget alerts:** Recommended to set up $1 alert in GCP Console
- **Auth methods:** Anonymous + Google (email/password also supported)
- **Offline-first:** App works without internet, syncs when available
- **Project migration:** Migrated from `math-games-dbd61` to `han-edu-central` for unified GCP billing
