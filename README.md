# Triple Crown Picks Web App - Development Plan (Revised)

**Overview**
This plan outlines the development of a web app for a family to make picks (1st, 2nd, 3rd) for the three Triple Crown races (Kentucky Derby, Preakness Stakes, Belmont Stakes). The app will allow users to manage their picks until a race is locked, manage a horse list per race, and determine winners by comparing picks to actual results. It uses React for the frontend and Firebase (Firestore, Authentication, Hosting) for the backend and deployment.

**Phase 1: Project Setup (Completed)**
*   Local React project initialized using Vite (`triple-crown-picks`).
*   Dependencies installed: `react`, `firebase`, `react-router-dom`.
*   Folder structure created: `src/components`, `src/pages`, `src/services`, `src/styles`.
*   Local Git repository initialized and initial commit made.
*   GitHub repository created by user.
*   Firebase project configured (Firestore, Authentication with email/password & Google, Hosting).
*   Firebase CLI initialized within the project.
*   Firebase config added to `.env` file (handled by user).
*   `.gitignore` file created.
*   _(Next Steps: Configure ESLint/Prettier if desired, set up IDE)_

**Phase 2: Database Design (Firestore)**
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

**Firestore Rules (Conceptual):**
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
*(Note: These rules need refinement and testing)*

**Phase 3: Frontend Development (React)**
Objective: Build UI and logic for race selection, horse management, picks submission/editing, results display, and winner calculation.

**Pages/Components:**

*   Auth Pages (`<AuthForm>`, `/login`, `/signup`) - *Mostly unchanged*
*   Home Page (`<Home>`) - Display upcoming races, link to race-specific pages or a general picks page.
*   Race Selection Page (Optional, or integrated into Home/Navbar) - List races (`Kentucky Derby`, `Preakness`, `Belmont`) to navigate to.
*   Horse Management Page (`<HorseAdmin>`, `/admin/horses`) - *Admin Only*. List horses, add/edit/remove horses, associate horses with races. Filter by race.
*   Picks Page (`<PicksInterface>`, `/picks/:raceId`) -
    *   Dropdown/Selector for Race (`Kentucky Derby`, `Preakness`, `Belmont`).
    *   Fetches horses for the selected race.
    *   Form to select 1st, 2nd, 3rd horses.
    *   Displays user's current picks for that race.
    *   Submit/Update button enabled only if race `status` is `upcoming` or `open`. Disabled if `locked` or `finished`.
    *   Components: `<RaceSelector>`, `<PicksForm>`, `<PicksDisplay>`
*   Results Page (`<ResultsInterface>`, `/results/:raceId`) -
    *   Selector for Race.
    *   Form for Admin to set race `status` (`upcoming`, `open`, `locked`, `finished`).
    *   Form for Admin to input 1st, 2nd, 3rd results.
    *   Displays official results for the selected race.
    *   Displays calculated winner(s) for the selected race.
    *   Components: `<RaceSelector>`, `<ResultsAdminForm>`, `<ResultsDisplay>`, `<WinnerDisplay>`
*   Navbar (`<Navbar>`) - Links to Home, Picks, Results. Admin links (Horse Management). User info/logout.

**Logic:**

*   Authentication: Use Firebase Auth. Protect routes. Store user data (including `isAdmin`) in `users` collection.
*   Admin Roles: Check `isAdmin` field from the user's profile in Firestore to control access to admin pages/features.
*   Race Data: Fetch races from Firestore. Use race `status` to control UI elements (e.g., enable/disable pick submission).
*   Horse Management (Admin): CRUD operations on `horses` collection. Manage `raceIds` array.
*   Picks Management:
    *   Fetch horses based on selected `raceId`.
    *   Fetch user's existing pick for the selected `raceId`.
    *   On submit/update: Check race `status`. Create/update pick document in `picks` collection (with `userId`, `raceId`, `updatedAt`). Validate unique horse selections.
*   Results & Winner Calculation:
    *   Admin sets results in the relevant `races` document.
    *   Admin updates race `status` to `locked` before the race, `finished` after results.
    *   Winner Calculation (per race): Fetch all `picks` for the finished `raceId`. Fetch the `results` from the `races` document. Apply scoring logic.
        *   `calculateRaceWinner(raceId)`:
            *   GET `results` for `raceId`
            *   GET all `picks` where `raceId` matches
            *   FOR each `pick`: calculate score based on `results` (e.g., 3 points for 1st, 2 for 2nd, 1 for 3rd; maybe bonus for exact order).
            *   GROUP scores by `userId`
            *   RETURN `userId`(s) with the highest score.

**Phase 4: API Integration**
*   Objective: Integrate API for horse lists/results (if feasible).
*   Status: Still dependent on finding a suitable free/paid API.
*   Revised Plan: Focus on manual entry first. API integration is optional. Admins will manually add horses to the `horses` collection and associate them with races (`raceIds`). Admins will manually update race `status` and `results`.

**Phase 5: Testing**
*   Unit Tests: `calculateRaceWinner` function, Firestore rule logic (using emulator).
*   Integration Tests: Auth flows, pick submission/update based on race status, admin actions.
*   User Testing: Test pick editing/locking, multi-race navigation, admin controls, responsive design.

**Phase 6: Deployment**
*   Objective: Deploy to Firebase Hosting.
*   Tasks: `npm run build`, `firebase deploy --only hosting`.

**Phase 7: Post-Derby Usage (Extended)**
*   Workflow applies to each Triple Crown race:
    1.  Admin creates Race document (e.g., `preakness-2025`), sets status to `upcoming`.
    2.  Admin adds/associates horses for that race.
    3.  Admin sets status to `open`.
    4.  Users submit/edit picks for that race.
    5.  Admin sets status to `locked` just before the race.
    6.  After the race, Admin sets `results` and status to `finished`.
    7.  App calculates and displays winners for that specific race.

**Key Changes from Original Plan:**
*   `races` collection to manage multiple events.
*   `raceId` field added to `horses` (as an array) and `picks`.
*   `status` field in `races` to control pick editing (`upcoming`, `open`, `locked`, `finished`).
*   `isAdmin` field in `users` for role-based access control.
*   Firestore rules updated for multi-race structure and edit permissions based on race status.
*   Frontend logic adjusted for selecting races and handling status-dependent UI.
*   Winner calculation is now per-race.
*   API integration is de-prioritized in favor of manual admin controls.