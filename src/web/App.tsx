import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/useAuthStore';
import { AppLayout } from './components/layout/AppLayout';
import { RouteFallback } from './components/common/RouteFallback';
import { ApiError } from './services/api';

// Route-level code splitting: each page loads on demand.
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const IngredientDetailPage = lazy(() => import('./pages/IngredientDetailPage').then((m) => ({ default: m.IngredientDetailPage })));
const ScanPage = lazy(() => import('./pages/ScanPage').then((m) => ({ default: m.ScanPage })));
const ScanResultPage = lazy(() => import('./pages/ScanResultPage').then((m) => ({ default: m.ScanResultPage })));
const ReceiptReviewPage = lazy(() => import('./pages/ReceiptReviewPage').then((m) => ({ default: m.ReceiptReviewPage })));
const RecipesPage = lazy(() => import('./pages/RecipesPage').then((m) => ({ default: m.RecipesPage })));
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage })));
const CookingModePage = lazy(() => import('./pages/CookingModePage').then((m) => ({ default: m.CookingModePage })));
const CookingCompletePage = lazy(() => import('./pages/CookingCompletePage').then((m) => ({ default: m.CookingCompletePage })));
const ShoppingPage = lazy(() => import('./pages/ShoppingPage').then((m) => ({ default: m.ShoppingPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const FamilySharingPage = lazy(() => import('./pages/FamilySharingPage').then((m) => ({ default: m.FamilySharingPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const PlusPaywallPage = lazy(() => import('./pages/PlusPaywallPage').then((m) => ({ default: m.PlusPaywallPage })));
const WeekDashboardPage = lazy(() => import('./pages/WeekDashboardPage').then((m) => ({ default: m.WeekDashboardPage })));
const WeekSetupPage = lazy(() => import('./pages/WeekSetupPage').then((m) => ({ default: m.WeekSetupPage })));
const WeekGeneratingPage = lazy(() => import('./pages/WeekGeneratingPage').then((m) => ({ default: m.WeekGeneratingPage })));
const MealDetailPage = lazy(() => import('./pages/MealDetailPage').then((m) => ({ default: m.MealDetailPage })));
const WeekShoppingPage = lazy(() => import('./pages/WeekShoppingPage').then((m) => ({ default: m.WeekShoppingPage })));
const WeekSettingsPage = lazy(() => import('./pages/WeekSettingsPage').then((m) => ({ default: m.WeekSettingsPage })));

// Never retry authoritative rejections (auth failures, 4xx); retry transient
// failures once. Service modules already provide offline projections.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.kind === 'auth' || error.kind === 'http')) {
          return false;
        }
        return failureCount < 1;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const { isOnboarded } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
