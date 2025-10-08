import SearchBar from "./searchBar";
import { Link } from "react-router-dom";
import Logo from "../assets/Logo_fitcity.png";
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <nav className="w-full h-24" aria-label="Primary">
        <div className="w-full grid [grid-template-columns:_auto_minmax(320px,1fr)_auto] items-center gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-6 lg:px-10 py-5">
          {/* Left: brand */}
          <Link to="/" className="flex items-center justify-center gap-3 shrink-0">
            <img
              src={Logo}
              alt="FitCity Logo"
              className="h-25 w-auto min-w-20"
            />
          </Link>

          {/* Center: Search */}
          <div className="flex justify-center">
            <SearchBar
              onSearch={(q) => console.log("search:", q)}
              className="w-full h-[64px] max-w-[780px] lg:max-w-[880px] xl:max-w-[980px] 2xl:max-w-[1100px]"
            />
          </div>

          {/* Right: actions */}
          <div className="flex justify-end items-center text-[#016B71] shrink-0">
            <ul className="flex items-center gap-6 sm:gap-8 lg:gap-12 text-[#016B71] flex-nowrap">
              <li>
                <Link to="/favorite" className="flex flex-col items-center leading-none">
                  <span className="material-symbols-outlined text-2xl" aria-hidden>
                    favorite
                  </span>
                  <span className="text-xs mt-1">Favourite</span>
                </Link>
              </li>

              <li>
                <button type="button" className="flex flex-col items-center leading-none">
                  <span className="material-symbols-outlined text-2xl" aria-hidden>
                    language
                  </span>
                  <span className="text-xs mt-1">EN/TH</span>
                </button>
              </li>

              <li>
                <Link to="/help" className="flex flex-col items-center leading-none">
                  <span className="material-symbols-outlined text-2xl" aria-hidden>
                    help
                  </span>
                  <span className="text-xs mt-1">Help</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/login"
                  className="rounded-full bg-[#016B71] px-5 py-2 font-bold text-white shadow-[0_6px_0_rgba(0,0,0,.18)] transition hover:bg-[#01585C] active:translate-y-[1px]"
                >
                  Log In
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
