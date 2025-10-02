import SearchBar from "./searchBar";
import { Link } from "react-router-dom";
import Logo from "../assets/Logo_fitcity.png";
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <nav className="w-full border-b border-slate-200" aria-label="Primary">
        <div className="w-full grid [grid-template-columns:_auto_minmax(480px,1fr)_auto] items-center gap-12 px-10 py-5">
          {/* Left: brand */}
          <Link to="/" className="flex items-center justify-center gap-3">
            <img
              src={Logo}
              alt="FitCity Logo"
              className="h-20 w-auto"
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
          <div className="flex justify-end items-center text-[#016B71]">
              <ul className="flex items-center gap-12 text-[#016B71]">
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
                  <Link to="/profile" className="flex flex-col items-center leading-none">
                      <span className="material-symbols-outlined text-2xl" aria-hidden>person</span>
                      <span className="text-xs mt-1">Profile</span>
                  </Link>
                  </li>
              </ul>
              </div>
        </div>
      </nav>
    </header>
  );
}