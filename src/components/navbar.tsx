import SearchBar from "./searchBar";
import { Link } from "react-router-dom";
import Logo from "../assets/Logo_fitcity.png";
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <nav
        className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-4 border-b border-slate-200"
        aria-label="Primary"
      >
        {/* Left: brand */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={Logo}
            alt="FitCity Logo"
            className="h-30 w-auto" // adjust size as needed
          />
        </Link>

        {/* Center: Search */}
        <div className="flex flex-1 px-6">
          <SearchBar
            onSearch={(q) => console.log("search:", q)}
            className="max-w-[700px] h-[50px]"   // inherits max width from the component
          />
        </div>

        {/* Right: actions */}
        <ul className="flex min-w-[700px] items-center justify-between text-[#016B71]">
          <li>
            <Link to="/favorite" className="flex flex-col items-center leading-none">
              <span className="material-symbols-outlined text-2xl" aria-hidden>favorite</span>
              <span className="text-xs mt-1">Favourite</span>
            </Link>
          </li>

          <li>
            <button type="button" className="flex flex-col items-center leading-none">
              <span className="material-symbols-outlined text-2xl" aria-hidden>language</span>
              <span className="text-xs mt-1">EN/TH</span>
            </button>
          </li>

          <li>
            <Link to="/help" className="flex flex-col items-center leading-none">
              <span className="material-symbols-outlined text-2xl" aria-hidden>help</span>
              <span className="text-xs mt-1">Help</span>
            </Link>
          </li>

          <li>
            <Link
              to="/signin"
              className="rounded-full bg-[#016B71] px-5 py-2 font-bold text-white shadow-[0_6px_0_rgba(0,0,0,.18)] transition hover:bg-[#01585C] active:translate-y-[1px]"
            >
              Sign in
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}