import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import { SavedListsProvider } from "./contexts/SavedListsContext";
import RequireAuth from "./components/RequireAuth";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Browse = lazy(() => import("./pages/Browse"));
const PublisherProfile = lazy(() => import("./pages/PublisherProfile"));
const ComparePublishers = lazy(() => import("./pages/ComparePublishers"));
const SavedLists = lazy(() => import("./pages/SavedLists"));
const Categories = lazy(() => import("./pages/Categories"));
const Suburbs = lazy(() => import("./pages/Suburbs"));
const AudienceFinder = lazy(() => import("./pages/AudienceFinder"));
const Pricing = lazy(() => import("./pages/Pricing"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const PublisherApply = lazy(() => import("./pages/PublisherApply"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EarningsDashboard = lazy(() => import("./pages/EarningsDashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const ChannelHub = lazy(() => import("./pages/ChannelHub"));
const ChannelPage = lazy(() => import("./pages/ChannelPage"));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ComparisonProvider>
          <SavedListsProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Suspense fallback={<div>Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/browse/:id" element={<PublisherProfile />} />
                    {/* Browse and Search merged into one page — old links still resolve */}
                    <Route path="/search" element={<Navigate to="/browse" replace />} />
                    <Route path="/compare" element={<ComparePublishers />} />
                    <Route path="/lists" element={<SavedLists />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/suburbs" element={<Suburbs />} />
                    <Route path="/audience-finder" element={<AudienceFinder />} />
                    {/* "AI Match" tab renamed to Audience Finder — old links still resolve */}
                    <Route path="/match" element={<Navigate to="/audience-finder" replace />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/apply" element={<RequireAuth role="publisher"><PublisherApply /></RequireAuth>} />
                    <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                    <Route path="/dashboard/earnings" element={<RequireAuth role="publisher"><EarningsDashboard /></RequireAuth>} />
                    <Route path="/admin" element={<RequireAuth role="admin"><Admin /></RequireAuth>} />
                    <Route path="/payment/return" element={<RequireAuth><PaymentResult status="return" /></RequireAuth>} />
                    <Route path="/payment/cancel" element={<RequireAuth><PaymentResult status="cancel" /></RequireAuth>} />
                    <Route path="/channels" element={<ChannelHub />} />
                    <Route path="/channels/:slug" element={<ChannelPage />} />
                    <Route path="*" element={<ComingSoon title="Page not found" />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </SavedListsProvider>
        </ComparisonProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
