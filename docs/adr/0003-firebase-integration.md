# ADR 0003: Firebase Integration Plan

## Status
Proposed

## Context
The math-games project currently uses localStorage for all data persistence via TypedStorage with Zod validation. To enable cross-device sync, account persistence, and potential classroom features, we need a backend database. Firebase is chosen for:
- Free tier sufficient for educational use
- Built-in authentication providers
- Firestore's offline-first capabilities align with current architecture
- No server management required
- GitHub Pages frontend compatibility

## Decision

### Firebase Services

| Service | Purpose |
|---------|---------|
| Firebase Authentication | User accounts (Google, email/password, anonymous) |
| Cloud Firestore | Document database for player data |
| Firebase Hosting | (Optional) Alternative to GitHub Pages |

---

## Data Architecture

### Firestore Collections

```
users/
├── {userId}/                          # Firebase Auth UID
│   ├── profile                        # Document: PlayerProfile
│   │   ├── displayName: string
│   │   ├── stats: PlayerStats
│   │   ├── rank: PlayerRank
│   │   ├── streak: number
│   │   ├── lastPlayedDate: string | null
│   │   ├── achievements: string[]
│   │   ├── preferences: PlayerPreferences
│   │   ├── createdAt: Timestamp
│   │   ├── updatedAt: Timestamp
│   │   └── version: number
│   │
│   ├── dailyChallenges/               # Subcollection
│   │   └── {date}/                    # e.g., "2025-01-15"
│   │       ├── completions: DailyChallengeCompletion[]
│   │       └── completedAt: Timestamp
│   │
│   ├── gameProgress/                  # Subcollection
│   │   └── {gameId}/                  # e.g., "magic-graph"
│   │       ├── unlockedLevels: string[]
│   │       ├── completedLevels: Map<string, LevelCompletion>
│   │       ├── totalScore: number
│   │       └── lastPlayed: Timestamp
│   │
│   └── streaks/                       # Subcollection
│       └── {gameId}/
│           ├── currentStreak: number
│           ├── longestStreak: number
│           └── lastCompletedDate: string | null

leaderboards/                          # Global collection (optional, Phase 2)
├── {gameId}/
│   └── entries/
│       └── {oderedEntry}/
│           ├── playerId: string
│           ├── displayName: string
│           ├── time: number
│           └── achievedAt: Timestamp
```

### Why This Structure?

1. **User-centric**: All user data under `users/{userId}` for simple security rules
2. **Subcollections**: DailyChallenges and gameProgress as subcollections for:
   - Independent queries (get today's challenge without loading full profile)
   - Pagination (history queries)
   - Atomic updates per document
3. **Denormalized streaks**: Separate from dailyChallenges for fast reads
4. **Timestamps**: Firestore Timestamps instead of ISO strings for server-time accuracy

---

## Authentication Strategy

### Auth Providers (Priority Order)

1. **Anonymous Auth** - Immediate play, upgrade later
2. **Google Sign-In** - One-click, trusted for schools
3. **Email/Password** - Traditional option

### Auth Flow

```
┌─────────────────┐
│  App Launch     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Yes    ┌──────────────────┐
│ Existing Auth?  │───────────▶│ Load User Data   │
└────────┬────────┘            └──────────────────┘
         │ No
         ▼
┌─────────────────┐     Yes    ┌──────────────────┐
│ localStorage    │───────────▶│ Offer Account    │
│ data exists?    │            │ Link or Continue │
└────────┬────────┘            │ as Guest         │
         │ No                  └──────────────────┘
         ▼
┌─────────────────┐
│ Anonymous Auth  │
│ (auto-created)  │
└─────────────────┘
```

### Guest Mode vs Anonymous Auth

| Aspect | Current Guest Mode | Firebase Anonymous |
|--------|-------------------|-------------------|
| Data persistence | localStorage only | Firestore + localStorage |
| Cross-device | No | No (until linked) |
| Upgradeable | No | Yes (link to Google/email) |
| Data on device wipe | Lost | Recoverable if linked |

**Decision**: Replace current guest mode with Firebase Anonymous Auth. True "practice mode" (zero persistence) remains unchanged.

---

## Sync Strategy

### Offline-First Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │────▶│  Context    │────▶│  Firestore  │
└─────────────┘     └─────────────┘     │  SDK Cache  │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Firestore  │
                                        │  Cloud      │
                                        └─────────────┘
```

Firestore SDK handles:
- Local cache (IndexedDB)
- Automatic sync when online
- Conflict resolution (last-write-wins by default)

### Sync Rules

| Data Type | Sync Direction | Conflict Resolution |
|-----------|---------------|---------------------|
| Stats | Bidirectional | Server wins (prevents cheating) |
| Achievements | Bidirectional | Union (never lose achievements) |
| Preferences | Bidirectional | Last-write-wins |
| Daily completions | Client → Server | Append-only |
| Game progress | Bidirectional | Max values win |

### Migration: localStorage → Firestore

On first authenticated session:
1. Check if Firestore has existing data for user
2. If no Firestore data: Upload localStorage data
3. If Firestore data exists: Merge (max stats, union achievements)
4. Clear migration flag in localStorage

```typescript
async function migrateLocalToFirestore(userId: string) {
  const localProfile = profileStorage.get();
  const firestoreProfile = await getDoc(doc(db, 'users', userId, 'profile'));

  if (!firestoreProfile.exists()) {
    // First time: upload local data
    await setDoc(doc(db, 'users', userId, 'profile'), localProfile);
  } else {
    // Merge: take best of both
    const merged = mergeProfiles(localProfile, firestoreProfile.data());
    await setDoc(doc(db, 'users', userId, 'profile'), merged);
  }
}
```

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Validate profile updates
    match /users/{userId}/profile {
      allow write: if request.auth.uid == userId
        && request.resource.data.displayName.size() <= 20
        && request.resource.data.stats.totalGamesPlayed >= 0
        && request.resource.data.stats.totalPuzzlesSolved >= 0;
    }

    // Leaderboards: anyone can read, only owner can write their entry
    match /leaderboards/{gameId}/entries/{entryId} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.data.playerId == request.auth.uid;
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Firebase Setup & Auth (Foundation)

**Tasks:**
1. Create Firebase project in Firebase Console
2. Enable Authentication providers (Anonymous, Google)
3. Create Firestore database (start in test mode, then secure)
4. Install Firebase SDK: `npm install firebase`
5. Create Firebase config file (`src/firebase/config.ts`)
6. Create Firebase initialization (`src/firebase/index.ts`)
7. Update environment variables for API keys

**Files to create:**
```
src/
├── firebase/
│   ├── config.ts           # Firebase configuration
│   ├── index.ts            # Firebase app initialization
│   ├── auth.ts             # Auth helper functions
│   └── firestore.ts        # Firestore helper functions
```

**Deliverable:** Firebase initialized, auth working (can sign in anonymously)

---

### Phase 2: Auth Context & UI

**Tasks:**
1. Create `FirebaseAuthContext` to replace/enhance current `AuthStateContext`
2. Implement auth state listener (`onAuthStateChanged`)
3. Create sign-in/sign-out functions
4. Add Google Sign-In button to settings/header
5. Implement anonymous-to-permanent account linking
6. Update `CompactHeader` with auth status indicator

**Files to modify:**
```
src/shared/contexts/AuthStateContext.tsx  # Enhance with Firebase
src/shared/components/layout/CompactHeader.tsx  # Auth UI
```

**New files:**
```
src/shared/components/auth/
├── SignInButton.tsx
├── SignOutButton.tsx
├── AccountLink.tsx         # Link anonymous to permanent
└── AuthModal.tsx           # Sign-in options modal
```

**Deliverable:** Users can sign in with Google, anonymous auth auto-creates

---

### Phase 3: Firestore Integration

**Tasks:**
1. Create Firestore service layer (`src/firebase/services/`)
2. Mirror existing service functions with Firestore equivalents
3. Update `PlayerContext` to use Firestore when authenticated
4. Implement real-time listeners for profile updates
5. Add offline persistence configuration
6. Implement localStorage ↔ Firestore migration

**New files:**
```
src/firebase/services/
├── playerService.ts        # Profile CRUD
├── dailyService.ts         # Daily challenges
├── progressService.ts      # Game progress
└── migrationService.ts     # localStorage migration
```

**Files to modify:**
```
src/shared/contexts/PlayerContext.tsx  # Add Firestore integration
src/shared/services/player.ts          # Add Firestore calls
src/shared/services/daily.ts           # Add Firestore calls
```

**Deliverable:** All data syncs to Firestore, works offline

---

### Phase 4: Data Sync & Conflict Resolution

**Tasks:**
1. Implement merge strategies for each data type
2. Add sync status indicator (synced/syncing/offline)
3. Handle network transitions gracefully
4. Add manual sync trigger (pull-to-refresh equivalent)
5. Implement rate limiting for writes
6. Add error handling and retry logic

**Files to create:**
```
src/firebase/
├── sync/
│   ├── syncManager.ts      # Coordinates sync operations
│   ├── mergeStrategies.ts  # Conflict resolution
│   └── syncStatus.ts       # Sync state management
```

**Components to add:**
```
src/shared/components/ui/
├── SyncIndicator.tsx       # Shows sync status
└── OfflineBanner.tsx       # "You're offline" notification
```

**Deliverable:** Reliable sync with conflict resolution, offline support

---

### Phase 5: Testing & Polish

**Tasks:**
1. Add Firebase emulator configuration for local testing
2. Write unit tests for Firebase services
3. Write E2E tests for auth flows
4. Add Firestore security rules tests
5. Performance testing (cold start, sync latency)
6. Update Storybook stories for auth components

**Files to create:**
```
firebase.json               # Firebase project config
firestore.rules             # Security rules
firestore.indexes.json      # Index definitions
src/firebase/__tests__/     # Unit tests
e2e/firebase-auth.spec.ts   # E2E auth tests
```

**Deliverable:** Full test coverage, production-ready

---

### Phase 6: (Optional) Leaderboards & Social

**Tasks:**
1. Implement global leaderboards collection
2. Add leaderboard UI components
3. Implement daily/weekly/all-time views
4. Add classroom/group features (future)

---

## Environment Configuration

### Development
```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=math-games-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=math-games-dev
VITE_FIREBASE_STORAGE_BUCKET=math-games-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### Production
```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=math-games-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=math-games-prod
...
```

### GitHub Actions Secrets
- `FIREBASE_API_KEY`
- `FIREBASE_PROJECT_ID`
- etc.

---

## Cost Considerations (Firebase Free Tier)

| Resource | Free Tier Limit | Expected Usage |
|----------|----------------|----------------|
| Auth | 10K verifications/month | Well under |
| Firestore reads | 50K/day | ~1K/day estimate |
| Firestore writes | 20K/day | ~500/day estimate |
| Firestore storage | 1 GB | < 100 MB |
| Bandwidth | 10 GB/month | < 1 GB |

**Verdict**: Free tier is sufficient for educational use with hundreds of students.

---

## Rollback Strategy

If Firebase integration causes issues:
1. localStorage continues to work independently
2. Feature flag to disable Firestore sync
3. All local services remain functional
4. Can revert to localStorage-only by removing Firebase context

```typescript
// Feature flag in config
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
```

---

## File Changes Summary

### New Files (17)
```
src/firebase/
├── config.ts
├── index.ts
├── auth.ts
├── firestore.ts
├── services/
│   ├── playerService.ts
│   ├── dailyService.ts
│   ├── progressService.ts
│   └── migrationService.ts
├── sync/
│   ├── syncManager.ts
│   ├── mergeStrategies.ts
│   └── syncStatus.ts
└── __tests__/

src/shared/components/auth/
├── SignInButton.tsx
├── SignOutButton.tsx
├── AccountLink.tsx
└── AuthModal.tsx

src/shared/components/ui/
├── SyncIndicator.tsx
└── OfflineBanner.tsx

firebase.json
firestore.rules
firestore.indexes.json
```

### Modified Files (6)
```
src/shared/contexts/AuthStateContext.tsx
src/shared/contexts/PlayerContext.tsx
src/shared/services/player.ts
src/shared/services/daily.ts
src/shared/components/layout/CompactHeader.tsx
package.json (add firebase dependency)
```

---

## Consequences

### Positive
- Cross-device sync for students
- Data survives device/browser changes
- Foundation for classroom features
- No server maintenance
- Works offline (Firestore cache)

### Negative
- Added complexity
- External dependency (Firebase)
- Requires Google account for full features
- Privacy considerations for student data

### Mitigations
- Keep localStorage as fallback
- Anonymous auth for privacy-conscious users
- Clear data retention policies
- COPPA compliance review needed for under-13 users

---

## References

- [Firebase Web SDK Documentation](https://firebase.google.com/docs/web/setup)
- [Firestore Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Firebase Auth with React](https://firebase.google.com/docs/auth/web/start)
- Current architecture: `docs/ARCHITECTURE.md`
- TypedStorage pattern: `docs/adr/0002-typed-storage-zod.md`
