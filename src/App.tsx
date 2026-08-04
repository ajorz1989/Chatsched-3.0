import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import { SavedListsProvider } from "./contexts/SavedListsContext";
import RequireAuth from "./components/RequireAuth";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import PublisherProfile from "./pages/PublisherProfile";
import ComparePublishers from "./pages/ComparePublishers";
import SavedLists from "./pages/SavedLists";
import Categories from "./pages/Categories";
import Suburbs from "./pages/Suburbs";
import AudienceFinder from "./pages/AudienceFinder";
import Pricing from "./pages/Pricing";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublisherApply from "./pages/PublisherApply";
import Dashboard from "./pages/Dashboard";
import EarningsDashboard from "./pages/EarningsDashboard";
import Admin from "./pages/Admin";
import PaymentResult from "./pages/PaymentResult";
import ComingSoon from "./pages/ComingSoon";
import ChannelHub from "./pages/ChannelHub";
import ChannelPage from "./pages/ChannelPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ComparisonProvider>
          <SavedListsProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
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
              </main>
              <Footer />
            </div>
          </SavedListsProvider>
        </ComparisonProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
