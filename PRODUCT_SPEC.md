# Product Specification Document — Medical Radiation Survey (المسح الإشعاعي الطبي)

## 1. Product Overview
**Medical Radiation Survey (المسح الإشعاعي الطبي)** is an Arabic-language, offline-capable (PWA) educational and reference web application for medical radiation surveying in clinics and hospitals. It helps medical physicists, radiation safety officers (RSOs), and trainees learn survey procedures, select measurement instruments, document measurement geometry, perform radiation safety calculations, and prepare technical survey reports.

- **Platform:** Client-side React 19 + TypeScript + Vite + Tailwind CSS v4 Single Page Application (SPA).
- **Authentication:** None required. All user progress, bookmarks, checklist states, quiz attempts, certificates, and theme preferences are stored locally in browser storage (`localStorage`).
- **Direction & Language:** Arabic (`RTL`) with bilingual technical terminology.

## 2. Core Features & Routes

### 2.1 Home & Onboarding (`/`, `/start`, `/tracks`)
- **Home (`/`):** Landing overview with quick navigation to tracks, library, equipment, planner, calculators, forms, and scenarios.
- **Start Here (`/start`):** Guided onboarding and track selection.
- **Learning Tracks (`/tracks`):** Structured learning tracks (`beginner`, etc.) with progress tracking and completion certificate issuance (`issueTrackCertificate`).

### 2.2 Educational Library (`/library`, `/library/:lessonId`)
- Browseable catalog of 25 educational lessons on medical radiation surveying.
- Lesson detail view with:
  - Lesson content and visit tracking (`lastLessonId`).
  - Mark lesson complete/incomplete toggle.
  - Bookmark toggle.
  - Interactive checklists persisted per lesson.
  - Embedded lesson quiz (`LessonQuizCard`) with attempt and score recording.

### 2.3 Measurement Equipment Catalog & Comparison (`/equipment`, `/equipment/:deviceId`, `/compare`)
- **Equipment Catalog (`/equipment`):** Directory of 14 radiation survey instruments (e.g., RaySafe 452, Atomtex AT1123, Ludlum 9DP-1*).
- **Equipment Detail (`/equipment/:deviceId`):** Detailed specifications, use cases, bookmarking, and add/remove from comparison list (up to 3 devices).
- **Equipment Comparison (`/compare`):** Side-by-side comparison of up to 3 selected instruments.

### 2.4 Interactive Room Survey Planner (`/planner`)
- Interactive room/geometry survey planner for documenting radiation survey points and measurement geometry.

### 2.5 Documented Radiation Calculators (`/calculators`, `/calculators/:calcId`)
- 8 documented radiation safety and survey calculators (`CALCULATOR_DOCS`) with interactive inputs, outputs, and bookmarking.

### 2.6 Forms & Technical Reports (`/forms`)
- Ready-to-use survey forms and report templates for medical radiation survey documentation.

### 2.7 Training Scenarios (`/scenarios`, `/scenarios/:scenarioId`)
- **Scenarios List (`/scenarios`):** Practical field case scenarios.
- **Scenario Detail (`/scenarios/:scenarioId`):** Interactive scenario walkthroughs with scoring (`scenarioScores`) and bookmarking.

### 2.8 Reference, Offline & Info Pages (`/glossary`, `/references`, `/about`, `/privacy`)
- **Glossary (`/glossary`):** Searchable radiation protection terminology.
- **References (`/references`):** Standards and technical references.
- **About & Offline (`/about`):** PWA offline status, offline pack download, update application, and local progress backup/restore.
- **Privacy (`/privacy`):** Local-only data privacy policy.
- **404 Handling:** `NotFoundPage` for unknown routes.

### 2.9 Global Shell & UX (`Layout.tsx`)
- Primary navigation bar (`PRIMARY_NAV`), global search across lessons, equipment, glossary, scenarios, and calculators, bookmarks drawer/indicator, dark/light theme toggle, and online/offline PWA status indicators.
