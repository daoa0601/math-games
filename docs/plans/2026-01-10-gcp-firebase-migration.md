# GCP Backend Migration Plan for Math Games

**Status:** In Progress
**Created:** 2026-01-10

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

### Phase 1: Foundation (Firebase Setup) - [ ] NOT STARTED

**Tasks:**
1. Create Firebase project in GCP Console (manual step)
2. Enable Authentication providers: Anonymous + Email Link
3. Create Firestore database in production mode
4. Install Firebase SDK: `npm install firebase`
5. Create Firebase initialization service
6. Add environment variables
7. Verify connection works

**Files to create:**
```
src/shared/services/firebase.ts       # Firebase app init
.env.example                          # Template (VITE_FIREBASE_*)
```

**Environment variables needed:**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

### Phase 2: Auth Layer - [ ] NOT STARTED

**Tasks:**
1. Create auth service with functions:
   - `signInAnonymously()`
   - `sendMagicLink(email)`
   - `completeMagicLinkSignIn()`
   - `linkEmailToAccount(email)`
   - `handleMergeConflict()`
2. Create AuthContext for React state
3. Create useAuth hook
4. Auto sign-in anonymous on app load
5. Handle email link callback URL

**Files to create:**
```
src/shared/services/auth.ts
src/shared/contexts/AuthContext.tsx
src/shared/hooks/auth/useAuth.ts
src/shared/hooks/auth/index.ts
```

**Merge conflict strategy:**
- Stats: MAX values (higher counts win)
- Achievements: Union of both sets
- Best times: Take fastest
- Streak: Take higher

---

### Phase 3: Data Sync - [ ] NOT STARTED

**Tasks:**
1. Create Firestore service with functions:
   - `getPlayerProfile(uid)`
   - `updatePlayerProfile(uid, data)`
   - `getGameProgress(uid, gameId)`
   - `updateGameProgress(uid, gameId, data)`
   - `getDailyChallenge(uid, date)`
   - `completeDailyChallenge(uid, gameId, data)`
2. Deploy Firestore security rules
3. Enable offline persistence
4. Modify existing services to sync:
   - `src/shared/services/player.ts` - add Firestore sync
   - `src/shared/services/daily.ts` - add Firestore sync
5. Implement sync strategy:
   - Write to localStorage first (instant)
   - Queue Firestore update (background)
   - On new device: fetch Firestore → merge → update localStorage

**Files to create/modify:**
```
src/shared/services/firestore.ts      # NEW: Firestore CRUD
firestore.rules                        # NEW: Security rules
src/shared/services/player.ts          # MODIFY: Add sync
src/shared/services/daily.ts           # MODIFY: Add sync
src/shared/utils/syncManager.ts        # NEW: Sync coordination
```

---

### Phase 4: UI Integration - [ ] NOT STARTED

**Tasks:**
1. Create account settings component
2. Create "Save my progress" button
3. Create email input modal
4. Create "I have an account" sign-in flow
5. Create sync status indicator
6. Add account info to CompactHeader
7. Handle auth callback route

**Files to create:**
```
src/shared/components/account/AccountSettings.tsx
src/shared/components/account/LinkEmailModal.tsx
src/shared/components/account/SignInModal.tsx
src/shared/components/account/SyncStatus.tsx
src/shared/components/account/index.ts
```

**UI locations:**
- Dashboard CompactHeader: Show account status + settings button
- Settings modal: "Save my progress" / "Sign in" options
- Sync indicator: Subtle icon showing sync state

---

### Phase 5: Future Skeleton (Stubs Only) - [ ] NOT STARTED

**Purpose:** Establish patterns for future paid content without implementation.

**Files to create (stubs only):**
```
src/shared/services/lessons.ts        # Stub exports
src/shared/services/payments.ts       # Stub exports
src/shared/types/lessons.ts           # Type definitions
src/shared/types/payments.ts          # Type definitions
```

---

## Verification Checklists

### Phase 1 Verification
- [ ] Firebase console shows project created
- [ ] `npm run dev` starts without Firebase errors
- [ ] Console logs show Firebase initialized

### Phase 2 Verification
- [ ] App auto-signs in anonymously (check Firebase Auth console)
- [ ] Can send magic link email (check inbox)
- [ ] Clicking magic link returns to app and completes sign-in
- [ ] UID persists after email linking

### Phase 3 Verification
- [ ] Player profile appears in Firestore console after playing
- [ ] Data syncs when playing on second device (same email)
- [ ] App works offline (disable network, play, re-enable, verify sync)
- [ ] Security rules block access to other users' data

### Phase 4 Verification
- [ ] "Save my progress" button visible in settings
- [ ] Email modal appears and sends link
- [ ] Sync status shows correct state
- [ ] "I have an account" flow works on new device

### Phase 5 Verification
- [ ] Stub files exist with proper TypeScript types
- [ ] Importing stubs doesn't break build
- [ ] Firestore rules file includes placeholder comments

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
- **Cost:** Expected $0/month on Firebase Spark (free) plan
- **No passwords:** Magic link only = more secure, simpler
- **Offline-first:** App works without internet, syncs when available
