import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useComparison } from "../contexts/ComparisonContext";
import { whatsappLink } from "../lib/constants";

const WHATSAPP_LINK = whatsappLink("Hi, I'd like to know more");

const navCls = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-billboard-greenDeep" : "hover:text-billboard-greenDeep transition-colors";

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { count: compareCount } = useComparison();

  return (
    <header className="sticky top-0 z-50 bg-billboard-paper border-b-[3px] border-billboard-ink">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-lg shrink-0">
          <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
            <rect x="1" y="1" width="24" height="14" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="15" x2="8" y2="21" stroke="currentColor" strokeWidth="2" />
            <line x1="18" y1="15" x2="18" y2="21" stroke="currentColor" strokeWidth="2" />
          </svg>
          MICRO BILLBOARDS
        </Link>

        {/* Primary nav */}
        <nav className="hidden lg:flex items-center gap-5 font-semibold text-sm">
          <NavLink to="/browse" className={navCls}>Browse</NavLink>
          <NavLink to="/suburbs" className={navCls}>Suburbs</NavLink>
          <NavLink to="/channels" className={navCls}>Channels</NavLink>
          <NavLink to="/audience-finder" className={navCls}>Audience Finder</NavLink>
          <NavLink to="/categories" className={navCls}>Categories</NavLink>
          <NavLink to="/pricing" className={navCls}>Pricing</NavLink>
          <NavLink to="/how-it-works" className={navCls}>How it Works</NavLink>
          <NavLink to="/about" className={navCls}>About</NavLink>
          <NavLink to="/register?role=publisher" className={navCls}>Publisher Registration</NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Compare badge — only appears when there are publishers in the list */}
          {compareCount > 0 && (
            <Link
              to="/compare"
              className="hidden sm:inline-flex items-center gap-1.5 border-2 border-billboard-ink font-mono font-semibold text-xs px-2.5 py-1.5 rounded hover:-translate-y-0.5 transition bg-billboard-paperDim"
              title="View comparison"
            >
              ⊞ {compareCount}
            </Link>
          )}

          {/* Saved lists */}
          <NavLink
            to="/lists"
            className={({ isActive }) =>
              `hidden sm:inline text-sm font-semibold transition-colors ${isActive ? "text-billboard-greenDeep" : "text-billboard-inkSoft hover:text-billboard-ink"}`
            }
          >
            Lists
          </NavLink>

          {/* Auth links */}
          {user ? (
            <>
              <Link
                to={profile?.role === "admin" ? "/admin" : "/dashboard"}
                className="hidden sm:inline text-sm font-semibold hover:text-billboard-greenDeep transition-colors"
              >
                {profile?.role === "admin" ? "Admin" : "Dashboard"}
              </Link>
              <button
                onClick={() => signOut()}
                className="hidden sm:inline text-sm font-semibold text-billboard-inkSoft hover:text-billboard-red transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden sm:inline text-sm font-semibold hover:text-billboard-greenDeep transition-colors">
              Log in
            </Link>
          )}

          <a
            href={WHATSAPP_LINK}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-[3px] border-billboard-greenDeep bg-billboard-green text-white font-bold text-sm px-4 py-2.5 rounded hover:bg-billboard-greenDeep transition hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            WhatsApp us
          </a>
        </div>
      </div>
    </header>
  );
}
