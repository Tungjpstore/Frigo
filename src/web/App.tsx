import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/useAuthStore';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { InventoryPage } from './pages/InventoryPage';
import { IngredientDetailPage } from './pages/IngredientDetailPage';
import { ScanPage } from './pages/ScanPage';
import { ScanResultPage } from './pages/ScanResultPage';
import { ReceiptReviewPage } from './pages/ReceiptReviewPage';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { CookingModePage } from './pages/CookingModePage';
import { CookingCompletePage } from './pages/CookingCompletePage';
import { ShoppingPage } from './pages/ShoppingPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FamilySharingPage } from './pages/FamilySharingPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlusPaywallPage } from './pages/PlusPaywallPage';
import { WeekDashboardPage } from './pages/WeekDashboardPage';
import { WeekSetupPage } from './pages/WeekSetupPage';
import { WeekGeneratingPage } from './pages/WeekGeneratingPage';
import { MealDetailPage } from './pages/MealDetailPage';
import { WeekShoppingPage } from './pages/WeekShoppingPage';
import { WeekSettingsPage } from './pages/WeekSettingsPage';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const { isOnboarded } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public / Intro Routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Core App Shell */}
          <Route element={<AppLayout />}>
            <Route path="/" element={isOnboarded ? <HomePage /> : <Navigate to="/landing" replace />} />
            
            {/* Fridge / Inventory */}
            <Route path="/fridge" element={<InventoryPage />} />
            <Route path="/inventory" element={<Navigate to="/fridge" replace />} />
            <Route path="/ingredients/:id" element={<IngredientDetailPage />} />
            <Route path="/inventory/:id" element={<IngredientDetailPage />} />

            {/* AI Scan & Review */}
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/scan/:id/review" element={<ScanResultPage />} />
            <Route path="/scan/receipt-review" element={<ReceiptReviewPage />} />
            <Route path="/scan/result" element={<ScanResultPage />} />

            {/* Recipes & Cooking */}
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
            <Route path="/recipes/id/:id" element={<RecipeDetailPage />} />
            <Route path="/cook/:slug" element={<CookingModePage />} />
            <Route path="/cooking/:id" element={<CookingModePage />} />
            <Route path="/cooking/complete" element={<CookingCompletePage />} />

            {/* Frigo Week / Thực đơn tuần */}
            <Route path="/week" element={<WeekDashboardPage />} />
            <Route path="/week/setup" element={<WeekSetupPage />} />
            <Route path="/week/generating" element={<WeekGeneratingPage />} />
            <Route path="/week/:planId" element={<WeekDashboardPage />} />
            <Route path="/week/:planId/meal/:mealId" element={<MealDetailPage />} />
            <Route path="/week/:planId/shopping" element={<WeekShoppingPage />} />
            <Route path="/week/:planId/settings" element={<WeekSettingsPage />} />

            {/* Shopping, Profile, Settings, Notifications, Plus, Family */}
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/family" element={<FamilySharingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/plus" element={<PlusPaywallPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
