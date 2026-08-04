import { Link } from "react-router-dom";
import { CONTACT_EMAIL } from "../lib/constants";

export default function Footer() {
  return (
    <footer className="bg-billboard-ink text-billboard-paperDim pt-14 pb-8">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex flex-wrap justify-between gap-10 pb-12">
          <div>
            <div className="flex items-center gap-2 font-display text-lg text-billboard-paper mb-2">
              <svg width="24" height="20" viewBox="0 0 26 22" fill="none">
                <rect x="1" y="1" width="24" height="14" stroke="currentColor" strokeWidth="2" />
                <line x1="8" y1="15" x2="8" y2="21" stroke="currentColor" strokeWidth="2" />
                <line x1="18" y1="15" x2="18" y2="21" stroke="currentColor" strokeWidth="2" />
              </svg>
              MICRO BILLBOARDS
            </div>
            <p className="text-sm max-w-[32ch]">Small businesses. Real audiences. Fair pricing.</p>
          </div>
          <div className="flex gap-14 flex-wrap">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#8A8272] mb-2.5">Site</h4>
              <Link to="/browse" className="block text-sm mb-2 hover:text-billboard-yellow">Browse Publishers</Link>
              <Link to="/suburbs" className="block text-sm mb-2 hover:text-billboard-yellow">Suburbs</Link>
              <Link to="/categories" className="block text-sm mb-2 hover:text-billboard-yellow">Categories</Link>
              <Link to="/pricing" className="block text-sm mb-2 hover:text-billboard-yellow">Pricing</Link>
              <Link to="/how-it-works" className="block text-sm mb-2 hover:text-billboard-yellow">How it Works</Link>
              <Link to="/about" className="block text-sm mb-2 hover:text-billboard-yellow">About</Link>
              <Link to="/contact" className="block text-sm mb-2 hover:text-billboard-yellow">Contact</Link>
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#8A8272] mb-2.5">Channels</h4>
              <Link to="/channels/influencer" className="block text-sm mb-2 hover:text-billboard-yellow">Influencer Campaigns</Link>
              <Link to="/channels/website" className="block text-sm mb-2 hover:text-billboard-yellow">Website Advertising</Link>
              <Link to="/channels/podcast" className="block text-sm mb-2 hover:text-billboard-yellow">Podcast Sponsorships</Link>
              <Link to="/channels/radio" className="block text-sm mb-2 hover:text-billboard-yellow">Radio Advertising</Link>
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#8A8272] mb-2.5">Account</h4>
              <Link to="/login" className="block text-sm mb-2 hover:text-billboard-yellow">Log in</Link>
              <Link to="/register" className="block text-sm mb-2 hover:text-billboard-yellow">Register</Link>
              <Link to="/register?role=publisher" className="block text-sm mb-2 hover:text-billboard-yellow">Publisher Registration</Link>
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#8A8272] mb-2.5">Contact</h4>
              <p className="text-sm leading-relaxed">{CONTACT_EMAIL}<br />Cape Town, South Africa</p>
            </div>
          </div>
        </div>
        <div className="border-t border-[#3A342B] pt-5 text-xs text-[#8A8272] flex flex-wrap justify-between gap-2">
          <span>© 2026 Micro Billboards</span>
          <span>Currently piloting in Cape Town — more regions coming soon.</span>
        </div>
      </div>
    </footer>
  );
}
