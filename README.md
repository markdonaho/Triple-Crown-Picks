# Meal Prep Coordinator - Development Plan

**Overview**
This plan outlines the development of a web application for coordinating meal preparation among a group of people. The app will manage recipes, orders, and meal cycles, allowing users to collaborate on meal planning, shopping, and cooking. It uses React for the frontend and Firebase (Firestore, Authentication, Functions, Storage, Hosting) for the backend and deployment.

**Phase 1: Project Setup**
*   [x] Local React project initialized using Vite (`meal-prep-coordinator`).
*   [x] Dependencies installed: `react`, `firebase`, `react-router-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`.
*   [x] Folder structure created: `src/components`, `src/pages`, `src/services`, `src/styles`, `src/hooks`, `src/contexts`.
*   [x] Local Git repository initialized and initial commit made.
*   [x] GitHub repository created.
*   [x] Firebase project configured (Firestore, Authentication, Functions, Storage, Hosting).
*   [x] Firebase CLI initialized within the project.
*   [x] Firebase config added to `.env` file.
*   [x] `.gitignore` file created.
*   [x] Firebase services initialized in `src/services/firebase.js`.

**Phase 2: Database Design (Firestore)**
Objective: Design Firestore collections to store recipes, meal cycles, orders, and user data, supporting household management and role-based access.

**Collections:**

1.  **`users`**
    *   Document ID: `user_id` (Firebase Auth UID)
    *   Fields:
        *   `email`: String
        *   `displayName`: String
        *   `role`: String (`admin`, `member`) - *For role-based access*
        *   `householdId`: String (Reference to household)
        *   `createdAt`: Timestamp

2.  **`households`**
    *   Document ID: `household_id` (auto-generated)
    *   Fields:
        *   `name`: String
        *   `createdBy`: String (user_id)
        *   `members`: Array<String> (List of user_ids)
        *   `createdAt`: Timestamp

3.  **`recipes`**
    *   Document ID: `recipe_id` (auto-generated)
    *   Fields:
        *   `name`: String
        *   `description`: String
        *   `ingredients`: Array<Map>
            *   `name`: String
            *   `amount`: Number
            *   `unit`: String
        *   `instructions`: Array<String>
        *   `servings`: Number
        *   `prepTime`: Number (minutes)
        *   `cookTime`: Number (minutes)
        *   `imageUrl`: String (optional)
        *   `createdBy`: String (user_id)
        *   `createdAt`: Timestamp

4.  **`mealCycles`**
    *   Document ID: `cycle_id` (auto-generated)
    *   Fields:
        *   `name`: String
        *   `householdId`: String
        *   `status`: String (`planning`, `ordering`, `shopping`, `cooking`, `completed`)
        *   `startDate`: Timestamp
        *   `endDate`: Timestamp
        *   `orderDeadline`: Timestamp
        *   `recipes`: Array<String> (recipe_ids)
        *   `createdBy`: String (user_id)
        *   `createdAt`: Timestamp

5.  **`orders`**
    *   Document ID: `order_id` (auto-generated)
    *   Fields:
        *   `cycleId`: String
        *   `userId`: String
        *   `selections`: Array<Map>
            *   `recipeId`: String
            *   `quantity`: Number
        *   `status`: String (`pending`, `confirmed`, `cancelled`)
        *   `createdAt`: Timestamp
        *   `updatedAt`: Timestamp

6.  **`shoppingLists`**
    *   Document ID: `list_id` (auto-generated)
    *   Fields:
        *   `cycleId`: String
        *   `items`: Array<Map>
            *   `ingredient`: String
            *   `amount`: Number
            *   `unit`: String
            *   `purchased`: Boolean
        *   `createdAt`: Timestamp
        *   `updatedAt`: Timestamp

**Phase 3: Frontend Development (React)**
Objective: Build UI and logic for recipe management, meal cycle coordination, order submission, and shopping list generation.

**Core Structure & Routing:**
*   [x] React Router setup in `App.jsx`.
*   [x] Main `Layout` component established.
*   [x] `Navbar` component created with auth-aware display.
*   [x] Placeholder pages created for `HomePage`, `RecipesPage`, `RecipeDetailPage`, `MealCyclesPage`, `OrdersPage`, `ShoppingListPage`, `LoginPage`, `SignupPage`.
*   [x] Protected routes implemented.

**Authentication:**
*   [x] `useAuth` hook created to manage Firebase Auth state.
*   [x] Implement Login Page with Firebase email/password sign-in.
*   [x] Implement Signup Page with Firebase email/password sign-up.
*   [ ] Implement Google Sign-in.
*   [x] Store user data in `users` collection on signup.
*   [ ] Implement household management.
*   [ ] Implement role-based access control.

**Pages/Components Implementation:**
*   Home Page (`<HomePage>`): 
    *   [x] Display active meal cycles
    *   [x] Quick actions
*   Recipe Management:
    *   [x] Recipe List (`<RecipesPage>`)
    *   [x] Recipe Detail (`<RecipeDetailPage>`)
    *   [x] Add/Edit Recipe form
    *   [ ] Recipe photo upload/display
*   Meal Cycle Management:
    *   [x] Cycle creation
    *   [x] Order submission
    *   [x] Status tracking
    *   [ ] Role assignment
*   Shopping List:
    *   [x] List generation
    *   [ ] Progress tracking
    *   [ ] Distribution management

**Logic Implementation:**
*   Recipe Management: 
    *   [x] CRUD operations on `recipes` collection
*   Meal Cycle Workflow: 
    *   [x] Create cycles
    *   [x] Manage status
    *   [x] Track orders
*   Order Management: 
    *   [x] Submit/modify orders
    *   [x] Aggregate selections
*   Shopping List: 
    *   [x] Generate lists
    *   [ ] Track progress

**Phase 4: Advanced Features**
*   [ ] Recipe scaling functionality
*   [ ] AI integration for recipe formatting
*   [ ] Automated notifications
*   [ ] PWA capabilities
*   [ ] Feedback collection system

**Phase 5: Testing**
*   Unit Tests: 
    *   [ ] Core functions
    *   [ ] Firestore rules
*   Integration Tests: 
    *   [ ] Auth flows
    *   [ ] Order submission
    *   [ ] Shopping list generation
*   User Testing: 
    *   [ ] Complete workflow testing
    *   [ ] UI/UX feedback

**Phase 6: Deployment**
*   [ ] Build production version
*   [ ] Deploy to Firebase Hosting
*   [ ] Configure custom domain (if needed)
*   [ ] Set up monitoring and analytics

--- Firestore Rules (Conceptual - Requires Implementation & Testing) ---
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data and household members' data
    match /users/{userId} {
      allow read: if request.auth != null && (
        request.auth.uid == userId ||
        exists(/databases/$(database)/documents/households/$(resource.data.householdId)/members/$(request.auth.uid))
      );
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
    }

    // Household members can read their household data
    match /households/{householdId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
    }

    // All authenticated users can read recipes
    match /recipes/{recipeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }

    // Household members can manage their meal cycles
    match /mealCycles/{cycleId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/households/$(resource.data.householdId)/members/$(request.auth.uid));
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        exists(/databases/$(database)/documents/households/$(resource.data.householdId)/members/$(request.auth.uid));
    }

    // Users can manage their own orders
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid ||
        exists(/databases/$(database)/documents/households/$(get(/databases/$(database)/documents/mealCycles/$(resource.data.cycleId)).data.householdId)/members/$(request.auth.uid)));
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Household members can manage shopping lists
    match /shoppingLists/{listId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/households/$(get(/databases/$(database)/documents/mealCycles/$(resource.data.cycleId)).data.householdId)/members/$(request.auth.uid));
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/households/$(get(/databases/$(database)/documents/mealCycles/$(resource.data.cycleId)).data.householdId)/members/$(request.auth.uid));
    }
  }
}