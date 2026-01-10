# Frontend Revamp Plan

## Executive Summary
The app currently has strong i18n infrastructure (Vietnamese as default ✓) but has gaps in localization completeness and a generic Linear Editorial design. This plan will: (1) Complete Vietnamese localization across ALL features, (2) Replace design with a unique Dark Vietnamese Premium aesthetic.

---

## PHASE 1: Vietnamese Localization Completion (Priority: Critical)

### 1.1 Hardcoded String Extraction
**Files to fix:**
- `src/shared/components/auth/AuthModal.tsx` - 20+ strings (auth.titles, descriptions, buttons)
- `src/firebase/FirebaseAuthContext.tsx` - 6 error messages
- `src/shared/components/ui/OfflineBanner.tsx` - 2 strings
- `src/shared/components/ui/SyncIndicator.tsx` - 3 status strings
- `src/shared/components/auth/AccountLinkBanner.tsx` - 3 strings
- `src/shared/components/LearnModal/LearnModal.tsx` - Review tutorial strings
- `src/games/*/components/*.tsx` - Keyboard shortcuts, aria-labels, mode labels

**Action:**
1. Add new namespace `auth.json` for authentication
2. Add new namespace `sync.json` for Firebase sync
3. Add new namespace `common2.json` for UI patterns (modals, toasts, overlays)
4. Create `keyboard.json` for accessibility labels

### 1.2 Vietnamese Text Quality Fix
**Critical Issue:** Shape Architect tutorial (common.json:325-336) has broken Vietnamese characters without accents:
```json
"step1Title": "Chao mung den voi Kien Truc Su Hinh Khoi!",
"step1": "Xay dung hinh muc tieu bang cac manh ghep trong kho cua ban."
```

**Should be:**
```json
"step1Title": "Chào mừng đến với Kiến Trúc Sư Hình Khối!",
"step1": "Xây dựng hình mục tiêu bằng các mảnh ghép trong kho của bạn."
```

**Action:** Full audit of Vietnamese text for missing diacritics and proper terminology.

### 1.3 Translation Gaps to Fill
Based on grep analysis, missing keys needed in `common.json`:
```json
"auth": {
  "signIn": "Đăng nhập",
  "signUp": "Đăng ký",
  "linkAccount": "Liên kết tài khoản",
  "email": "Email",
  "password": "Mật khẩu",
  "continueWithGoogle": "Tiếp tục với Google",
  "useEmail": "Sử dụng email",
  "createAccount": "Tạo tài khoản",
  "signInButton": "Đăng nhập",
  "continueAsGuest": "Tiếp tục với tư cách khách",
  "linkSubtitle": "Lưu tiến độ trên nhiều thiết bị",
  "signUpSubtitle": "Tạo tài khoản để đồng bộ tiến độ",
  "signInSubtitle": "Đăng nhập để truy cập tiến độ đã lưu"
},
"sync": {
  "synced": "Đã đồng bộ",
  "offline": "Ngoại tuyến",
  "error": "Lỗi đồng bộ",
  "offlineMessage": "Bạn đang ngoại tuyến. Thay đổi sẽ đồng bộ khi kết nối lại.",
  "retry": "Thử lại"
},
"controls": {
  "moveControls": "Các điều khiển di chuyển mảnh",
  "movingPiece": "Đang di chuyển mảnh",
  "rotateX": "Xoay trục X",
  "rotateY": "Xoay trục Y",
  "rotateZ": "Xoay trục Z",
  "cancelMove": "Hủy di chuyển",
  "moveHint": "Chạm vào ô đích để di chuyển mảnh đến đó"
},
"modal": {
  "cancel": "Hủy",
  "validPlacement": "Vị trí hợp lệ",
  "position": "Vị trí",
  "confirm": "Đặt",
  "rotate": "Xoay"
},
"unsolvable": {
  "button": "Khai báo không thể giải"
}
```

---

## PHASE 2: Design System Transformation - Dark Vietnamese Premium

### 2.1 New Color Palette
Replace Linear Editorial with Vietnamese-inspired palette:

```css
/* Vietnamese Premium Palette */
:root {
  /* Deep rich backgrounds */
  --bg-primary: #0d1b2a;      /* Deep indigo navy */
  --bg-secondary: #1b263b;    /* Lighter navy for cards */
  --bg-tertiary: #263545;     /* Accent surface */

  /* Traditional Vietnamese accent colors */
  --accent-gold: #d4af37;     /* Gold (lotus temples) */
  --accent-emerald: #10b981;   /* Emerald green (bamboo) */
  --accent-coral: #f97316;    /* Coral (traditional textiles) */
  --accent-lotus: #e11d48;    /* Lotus pink */

  /* Text hierarchy */
  --text-primary: #f1f5f9;     /* Off-white */
  --text-secondary: #94a3b8;  /* Slate gray */
  --text-muted: #64748b;      /* Dimmed gray */

  /* Borders & dividers */
  --border: #334155;
  --border-gold: #d4af374d;   /* Gold with opacity */

  /* Game-specific Vietnamese accents */
  --game-magic: #c084fc;      /* Lavender */
  --game-race: #fbbf24;       /* Amber */
  --game-shape: #2dd4bf;      /* Teal */
}
```

### 2.2 Vietnamese Pattern Integration
Create new patterns inspired by Vietnamese art:

**File:** `src/shared/styles/patterns-vn.css`
```css
/* Traditional Vietnamese Patterns */

/* Bamboo pattern (subtle vertical lines with variation) */
.pattern-bamboo {
  background-image: repeating-linear-gradient(
    90deg,
    var(--border-gold) 0px,
    var(--border-gold) 1px,
    transparent 1px,
    transparent 20px
  );
  background-size: 20px 100%;
}

/* Lotus petal pattern (overlapping curves) */
.pattern-lotus {
  background-image:
    radial-gradient(ellipse at 50% 0%, var(--accent-lotus) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 100%, var(--accent-lotus) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 100%, var(--accent-lotus) 0%, transparent 40%);
  background-size: 60px 60px;
  opacity: 0.05;
}

/* Traditional cloud pattern (geometric clouds) */
.pattern-cloud {
  background-image:
    radial-gradient(circle at 20% 30%, var(--accent-gold) 2px, transparent 3px),
    radial-gradient(circle at 80% 70%, var(--accent-gold) 2px, transparent 3px);
  background-size: 100px 100px;
}

/* Lacquer texture (subtle wood grain) */
.pattern-lacquer {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    var(--bg-tertiary) 2px,
    var(--bg-tertiary) 4px
  );
  opacity: 0.3;
}
```

### 2.3 Typography Enhancements
Add Vietnamese-friendly fonts while maintaining current structure:

```css
/* Import Vietnamese-supporting fonts */
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  --font-display: 'Crimson Pro', serif;      /* Elegant for Vietnamese headlines */
  --font-mono: 'Space Grotesk', sans-serif;  /* Modern, geometric */
}

/* Vietnamese diacritic support improvements */
.vi-text {
  -webkit-font-feature-settings: 'ss01';
  font-feature-settings: 'ss01';
  letter-spacing: 0.01em; /* Slightly tighter for Vietnamese */
}
```

### 2.4 Component Design Updates

**Game Cards (Slab redesign):**
- Add subtle Vietnamese pattern background
- Gold border accents on hover
- Traditional corner decoration (1px diagonal lines at corners)
- Lotus pink accent for "New" badges

**Buttons:**
- Add gold border accent to primary buttons
- Hover state with emerald glow (box-shadow: 0 0 0 1px var(--accent-emerald))
- Traditional textile-inspired geometric hover patterns

**Modals/Overlays:**
- Lotus petal pattern backdrop at 5% opacity
- Gold accent top border (3px solid var(--accent-gold))
- Bamboo pattern for info panels

**Navigation:**
- Bottom nav with gradient: linear-gradient(180deg, transparent, var(--bg-secondary))
- Active indicator using gold color
- Traditional motif for home icon

---

## PHASE 3: Vietnamese Cultural Elements Integration

### 3.1 Custom Vietnamese Icons
Replace existing generic icons with Vietnamese-inspired designs:

**Files to update:**
- `src/shared/components/Icons/*.tsx`

**Icon concepts:**
- **Home:** Traditional Vietnamese house (nhà sàn) silhouette
- **Profile:** Traditional fan or conical hat outline
- **Settings:** Traditional lantern
- **Learn:** Lotus flower with book
- **Achievements:** Dragon scale or medal with traditional patterns
- **Stats:** Bamboo leaf with graph lines

**Game icons:**
- **Magic Graph:** Vietnamese star pattern (ngôi sao) with nodes
- **Sequence Race:** Traditional racing flag with bamboo pattern
- **Shape Architect:** Traditional temple silhouette with geometric shapes

### 3.2 Achievement/Rank Updates with Vietnamese Terms
Update ranks to Vietnamese cultural progression:

```json
"ranks": {
  "beginner": "Học Sinh",
  "learner": "Tập Sinh",
  "apprentice": "Thợ Học",
  "intermediate": "Thợ Thủ Công",
  "advanced": "Nghệ Nhân",
  "expert": "Chuyên Gia",
  "master": "Đại Sư",
  "grandmaster": "Vô Địch"
}
```

### 3.3 Tutorial Enhancements
Add Vietnamese cultural context to tutorials:
- Magic Graph: Mention traditional math games like cờ cá ngựa
- Sequence Race: Reference traditional counting rhymes
- Shape Architect: Connect to Vietnamese architecture (pagodas, communal houses)

---

## PHASE 4: Implementation Tasks

### Sprint 1: Localization Foundation
1. Create `auth.json`, `sync.json`, `common2.json`, `keyboard.json` translation files
2. Fix Shape Architect Vietnamese text (diacritics)
3. Extract and translate 50+ hardcoded strings from components
4. Add aria-label translations for accessibility
5. Update i18n configuration to load new namespaces

### Sprint 2: Design System Core
1. Update `palette.css` with Vietnamese Premium palette
2. Create `patterns-vn.css` with bamboo, lotus, cloud, lacquer patterns
3. Update typography in `type.css` with Vietnamese fonts
4. Update `game-base.css` for Vietnamese accent integration
5. Update `index.css` with new theme variables

### Sprint 3: Component Redesign
1. Redesign `GameCard.tsx` with Vietnamese patterns
2. Update `Button.tsx` with gold accents and hover effects
3. Update modal components with lotus backdrop pattern
4. Redesign `BottomNav.tsx` with Vietnamese iconography
5. Update game-specific CSS with new accent colors

### Sprint 4: Icon System
1. Redesign core UI icons (Home, Profile, Settings, Learn)
2. Create Vietnamese game icons
3. Update achievement/rank badges with traditional patterns
4. Update tutorial illustrations with Vietnamese art style

### Sprint 5: Polish & Testing
1. Audit all Vietnamese text for consistency
2. Test all components in both VI/EN
3. Test accessibility with Vietnamese screen readers
4. Performance check for new patterns/fonts
5. E2E tests for all user flows

---

## PHASE 5: Files to Modify

### Localization
```
src/i18n/locales/vi/
├── auth.json (NEW)
├── sync.json (NEW)
├── keyboard.json (NEW)
├── common.json (UPDATE - fix accents, add missing keys)
├── magicGraph.json (UPDATE - add missing strings)
├── sequenceRace.json (UPDATE - add missing strings)
└── shapeArchitect.json (UPDATE - add missing strings)

src/i18n/locales/en/
├── auth.json (NEW)
├── sync.json (NEW)
└── keyboard.json (NEW)
```

### Design System
```
src/shared/styles/tokens/
├── palette.css (REPLACE)
└── type.css (UPDATE)

src/shared/styles/
├── patterns-vn.css (NEW)
├── game-base.css (UPDATE)
└── index.css (UPDATE)
```

### Components
```
src/shared/components/ui/
├── Button.tsx (UPDATE)
├── Card.tsx (UPDATE)
└── Modal.tsx (UPDATE)

src/shared/components/layout/
├── BottomNav.tsx (UPDATE - new icons)
└── GameCard.tsx (UPDATE - patterns, accents)

src/shared/components/Icons/
└── *.tsx (REPLACE all - Vietnamese designs)

src/games/*/*.css (UPDATE - new accent colors)
```

### Component Files with Hardcoded Strings
```
src/shared/components/auth/AuthModal.tsx
src/shared/components/auth/AccountLinkBanner.tsx
src/shared/components/ui/OfflineBanner.tsx
src/shared/components/ui/SyncIndicator.tsx
src/firebase/FirebaseAuthContext.tsx
src/games/*/components/*.tsx
```

---

## Success Criteria

### Vietnamese Localization:
- 100% of UI strings translatable (no hardcoded text)
- Proper Vietnamese diacritics throughout
- Consistent terminology across all features
- ARIA labels fully localized for accessibility

### Design Uniqueness:
- Custom Vietnamese color palette (navy/emerald/gold)
- Vietnamese pattern backgrounds (bamboo, lotus, clouds)
- Custom Vietnamese-inspired iconography
- No generic Linear Editorial elements remaining
- Distinctive look not similar to AI-generated designs

### Quality:
- All Storybook components updated
- E2E tests pass
- Lint and typecheck pass
- Accessibility compliance maintained

---

## Estimated Timeline
- **Sprint 1-2:** Localization completion (2-3 days)
- **Sprint 3:** Design system foundation (2 days)
- **Sprint 4:** Component redesign (3-4 days)
- **Sprint 5:** Icons & polish (2-3 days)

**Total:** ~10-12 days
