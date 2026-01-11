import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import { analyticsService } from './services/analyticsService';
import { StoreSettingsProvider } from './context/StoreSettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import SmoothScroll from './components/SmoothScroll';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy Load Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const ReturnsPolicyPage = lazy(() => import('./pages/ReturnsPolicyPage'));
const SizeGuidePage = lazy(() => import('./pages/SizeGuidePage'));
const DynamicPage = lazy(() => import('./pages/DynamicPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AddProductPage = lazy(() => import('./pages/admin/AddProductPage'));
const EditProductPage = lazy(() => import('./pages/admin/EditProductPage'));
const OrderManagementPage = lazy(() => import('./pages/admin/OrderManagementPage'));
const CustomerManagementPage = lazy(() => import('./pages/admin/CustomerManagementPage'));
const CategoryManagementPage = lazy(() => import('./pages/admin/CategoryManagementPage'));
const StoreSettingsPage = lazy(() => import('./pages/admin/StoreSettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));
const ArticleManagementPage = lazy(() => import('./pages/admin/ArticleManagementPage'));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="size-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
  </div>
);

// Page View Tracker Component
const PageTrackingWrapper = () => {
  const location = useLocation();

  useEffect(() => {
    analyticsService.trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    analyticsService.startHeartbeat();

    // Global click listener for elements with data-track and auto-link tracking
    const handleGlobalClick = (e) => {
      // 1. Check for manual data-track
      const trackElement = e.target.closest('[data-track]');
      if (trackElement) {
        const name = trackElement.getAttribute('data-track');
        const metadata = trackElement.getAttribute('data-track-meta');
        analyticsService.trackClick(name, metadata ? JSON.parse(metadata) : {});
        return;
      }

      // 2. Auto-track links
      const linkElement = e.target.closest('a');
      if (linkElement && linkElement.href && !linkElement.href.startsWith('javascript:')) {
        const label = linkElement.innerText || linkElement.title || linkElement.ariaLabel || linkElement.hostname || 'Link';
        analyticsService.trackLinkClick(label.trim().substring(0, 50) || 'Link', linkElement.href);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      analyticsService.stopHeartbeat();
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return null;
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <PageTrackingWrapper />
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              <StoreSettingsProvider>
                <ScrollToTop />
                <SmoothScroll />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Admin Routes - No Main Layout */}
                    <Route path="/admin" element={<ProtectedRoute adminOnly><ErrorBoundary><AdminDashboard /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminProductsPage /></ProtectedRoute>} />
                    <Route path="/admin/products/new" element={<ProtectedRoute adminOnly><AddProductPage /></ProtectedRoute>} />
                    <Route path="/admin/products/edit/:id" element={<ProtectedRoute adminOnly><EditProductPage /></ProtectedRoute>} />
                    <Route path="/admin/orders" element={<ProtectedRoute adminOnly><OrderManagementPage /></ProtectedRoute>} />
                    <Route path="/admin/customers" element={<ProtectedRoute adminOnly><CustomerManagementPage /></ProtectedRoute>} />
                    <Route path="/admin/categories" element={<ProtectedRoute adminOnly><CategoryManagementPage /></ProtectedRoute>} />
                    <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AnalyticsPage /></ProtectedRoute>} />
                    <Route path="/admin/articles" element={<ProtectedRoute adminOnly><ArticleManagementPage /></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute adminOnly><StoreSettingsPage /></ProtectedRoute>} />

                    {/* Public Routes - With Main Layout */}
                    <Route path="/*" element={
                      <Layout>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/shop" element={<ShopPage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/contact" element={<ContactPage />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/confirmation" element={<ConfirmationPage />} />
                          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

                          <Route path="/category/:slug" element={<CategoryPage />} />
                          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                          <Route path="/returns-policy" element={<ReturnsPolicyPage />} />
                          <Route path="/size-guide" element={<SizeGuidePage />} />
                          <Route path="/product/:id" element={<ProductPage />} />
                          <Route path="/product/:id/:slug" element={<ProductPage />} />
                          <Route path="/accessories" element={<HomePage />} />
                          <Route path="/community" element={<CommunityPage />} />
                          <Route path="/community/:slug" element={<ArticleDetailPage />} />
                          <Route path="/new-arrivals" element={<HomePage />} />
                          <Route path="/:slug" element={<DynamicPage />} />
                        </Routes>
                      </Layout>
                    } />
                  </Routes>
                </Suspense>
              </StoreSettingsProvider>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </Router >
    </HelmetProvider>
  );
}

export default App;
