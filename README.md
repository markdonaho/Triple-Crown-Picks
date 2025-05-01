# Triple Crown Picks Web App - Development Plan (Revised)

**Overview**
This plan outlines the development of a web app for a family to make picks (1st, 2nd, 3rd) for the three Triple Crown races (Kentucky Derby, Preakness Stakes, Belmont Stakes). The app will allow users to manage their picks until a race is locked, manage a horse list per race, and determine winners by comparing picks to actual results. It uses React for the frontend and Firebase (Firestore, Authentication, Hosting) for the backend and deployment.

**(Status markers: [TODO], [IN PROGRESS], [DONE])**

**Phase 1: Project Setup [DONE]**
*   [DONE] Local React project initialized using Vite (`triple-crown-picks`).
*   [DONE] Dependencies installed: `react`, `firebase`, `react-router-dom`.
*   [DONE] Folder structure created: `src/components`, `src/pages`, `src/services`, `src/styles`, `src/hooks`.
*   [DONE] Local Git repository initialized and initial commit made.
*   [DONE] GitHub repository created by user.
*   [DONE] Firebase project configured (Firestore, Authentication with email/password & Google, Hosting).
*   [DONE] Firebase CLI initialized within the project.
*   [DONE] Firebase config added to `.env` file (handled by user).
*   [DONE] `.gitignore` file created.
*   [DONE] Firebase services initialized in `src/services/firebase.js`.

**Phase 2: Database Design (Firestore) [DONE - Conceptual]**
Objective: Design Firestore collections to store race information, horses, user picks, and user data, supporting multiple races and editable picks.

**Collections:**

1.  **`users`**
    *   Document ID: `user_id` (Firebase Auth UID)
    *   Fields:
        *   `email`: String
        *   `displayName`: String
        *   `isAdmin`: Boolean (Default: `false`) - *For admin controls*
        *   `createdAt`: Timestamp

2.  **`races`**
    *   Document ID: `race_id` (e.g., `kentucky-derby-2025`, `preakness-2025`)
    *   Fields:
        *   `name`: String (e.g., "Kentucky Derby 2025")
        *   `date`: Timestamp (Race date/time)
        *   `status`: String (`upcoming`, `open`, `locked`, `finished`) - *Controls pick editing*
        *   `results`: Map (Optional, added when results are known)
            *   `first`: String (Winning horse `horse_id`)
            *   `second`: String (Place horse `horse_id`)
            *   `third`: String (Show horse `horse_id`)
        *   `resultsSetAt`: Timestamp (Optional)
        *   `createdAt`: Timestamp

3.  **`horses`**
    *   Document ID: `horse_id` (auto-generated or slug)
    *   Fields:
        *   `name`: String (e.g., "Fierceness")
        *   `odds`: String (e.g., "5-2") // Optional
        *   `postPosition`: Number // Optional
        *   `raceIds`: Array<String> (List of `race_id`s this horse is participating in)
        *   `createdAt`: Timestamp

4.  **`picks`**
    *   Document ID: `pick_id` (auto-generated)
    *   Fields:
        *   `userId`: String (Firebase Auth UID)
        *   `raceId`: String (Links to `races` collection)
        *   `first`: String (`horse_id`)
        *   `second`: String (`horse_id`)
        *   `third`: String (`horse_id`)
        *   `submittedAt`: Timestamp
        *   `updatedAt`: Timestamp (For tracking edits)

**Firestore Rules (Conceptual):** [TODO - Needs implementation & testing]
*(See conceptual rules below - requires deployment and testing)*

**Phase 3: Frontend Development (React) [IN PROGRESS]**
Objective: Build UI and logic for race selection, horse management, picks submission/editing, results display, and winner calculation.

**Core Structure & Routing: [DONE]**
*   [DONE] React Router (`react-router-dom`) setup in `App.jsx`.
*   [DONE] Main `Layout` component established.
*   [DONE] `Navbar` component created (`src/components/Navbar.jsx`) with basic links and auth-aware display (using `useAuth`).
*   [DONE] Placeholder pages created for `HomePage`, `PicksPage`, `ResultsPage`, `HorseAdminPage`, `LoginPage`, `SignupPage`, `NotFoundPage`.
*   [DONE] Placeholder components created for `RaceSelector`, `PicksForm`, `PicksDisplay`, `ResultsAdminForm`, `ResultsDisplay`, `WinnerDisplay`.
*   [DONE] Protected routes implemented using `ProtectedRoute` component.

**Authentication: [IN PROGRESS]**
*   [DONE] `useAuth` hook (`src/hooks/useAuth.js`) created to manage Firebase Auth state and check `isAdmin` status from Firestore.
*   [DONE] Implement Login Page (`<LoginPage>`) with Firebase email/password sign-in.
*   [DONE] Implement Signup Page (`<SignupPage>`) with Firebase email/password sign-up & Firestore user document creation.
*   [TODO] Implement Google Sign-in (Optional).
*   [DONE] Store user data (including `isAdmin`) in `users` collection on signup.

**Pages/Components Implementation: [TODO]**
*   Home Page (`<HomePage>`): [TODO] Display upcoming races, links.
*   Horse Management Page (`<HorseAdminPage>`, `/admin/horses`) - *Admin Only*: [TODO] List, add, edit, remove horses. Associate with races.
*   Picks Page (`<PicksPage>`, `/picks/:raceId`):
    *   [TODO] Implement `RaceSelector` logic (fetch races).
    *   [TODO] Fetch horses for the selected race.
    *   [TODO] Implement `PicksForm` logic (fetch/pre-fill user picks, handle submit/update to Firestore based on race `status`).
    *   [TODO] Implement `PicksDisplay` logic (fetch horse names).
    *   [TODO] Fetch race `status` to control form.
*   Results Page (`<ResultsPage>`, `/results/:raceId`):
    *   [TODO] Implement `RaceSelector` logic.
    *   [TODO] Implement `ResultsAdminForm` (Admin Only) to set race `status` and results in Firestore.
    *   [TODO] Implement `ResultsDisplay` logic (fetch official results, horse names).
    *   [TODO] Implement `WinnerDisplay` logic (trigger/display winner calculation).
*   Admin Roles: [DONE] `useAuth` hook checks `isAdmin`. `ProtectedRoute` enforces admin access.

**Logic Implementation: [TODO]**
*   Race Data Fetching: [TODO] Fetch races, horses, picks, results from Firestore where needed.
*   Picks Management (Firestore): [TODO] Create/update pick documents.
*   Horse Management (Firestore): [TODO] CRUD operations on `horses` collection.
*   Results & Winner Calculation: [TODO] Update race status/results in Firestore. Implement `calculateRaceWinner` logic (likely triggered after results are set, potentially via Cloud Function or client-side). Update `ResultsPage` to display.

**Phase 4: API Integration [TODO - Optional]**
*   Objective: Integrate API for horse lists/results (if feasible).
*   Status: Still dependent on finding a suitable free/paid API.
*   Revised Plan: Focus on manual entry first. API integration is optional.

**Phase 5: Testing [TODO]**
*   Unit Tests: [TODO] `calculateRaceWinner` function, Firestore rule logic (using emulator).
*   Integration Tests: [TODO] Auth flows, pick submission/update based on race status, admin actions.
*   User Testing: [TODO] Test pick editing/locking, multi-race navigation, admin controls, responsive design.

**Phase 6: Deployment [TODO]**
*   Objective: Deploy to Firebase Hosting.
*   Tasks: `npm run build`, `firebase deploy --only hosting`.

**Phase 7: Post-Derby Usage (Extended Workflow) [Conceptual]**
*   Workflow applies to each Triple Crown race:
    1.  Admin creates Race document, sets status to `upcoming`.
    2.  Admin adds/associates horses for that race.
    3.  Admin sets status to `open`.
    4.  Users submit/edit picks for that race.
    5.  Admin sets status to `locked` just before the race.
    6.  After the race, Admin sets `results` and status to `finished`.
    7.  App calculates and displays winners for that specific race.

--- Firestore Rules (Conceptual - Requires Implementation & Testing) ---
rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// Users can read their own data, admins can read all
match /users/{userId} {
allow read: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
allow create: if request.auth.uid == userId; // On signup
allow update: if request.auth.uid == userId; // Profile updates
}
// All authenticated users can read races and horses
match /races/{raceId} {
allow read: if request.auth != null;
// Only admins can create, update status/results, or delete races
allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
match /horses/{horseId} {
allow read: if request.auth != null;
// Only admins can add/edit/delete horses
allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
// Users can manage their own picks for a race, but only if the race is 'open' or 'upcoming'
match /picks/{pickId} {
// Allow read own picks, or all picks if admin
allow read: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
// Allow create if user is authenticated, pick belongs to them, and race is open/upcoming
allow create: if request.auth != null
&& request.resource.data.userId == request.auth.uid
&& get(/databases/$(database)/documents/races/$(request.resource.data.raceId)).data.status in ['upcoming', 'open'];
// Allow update if user is authenticated, pick belongs to them, and race is open/upcoming
allow update: if request.auth != null
&& resource.data.userId == request.auth.uid
&& get(/databases/$(database)/documents/races/$(resource.data.raceId)).data.status in ['upcoming', 'open'];
// Prevent deletion generally, maybe allow admin deletion?
allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true; // Or disallow entirely
}
}
}