import SearchBar from "./searchBar";
import { Link } from "react-router-dom";
import Logo from "../assets/Logo_fitcity.png";
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 px-3 py-2 bg-transparent">
      <nav
        className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md bg-[#ffffff] px-5 py-4"
        aria-label="Primary"
      >
        {/* Left: brand */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={Logo}
            alt="FitCity Logo"
            className="h-10 w-auto" // adjust size as needed
          />
        </Link>

        {/* Center: Search */}
        <div className="flex justify-center">
          <SearchBar
            onSearch={(q) => console.log("search:", q)}
            className="w-full"   // inherits max width from the component
          />
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-7 text-teal-700">
          <Link to="/favorite" className="flex flex-col items-center">
            <span className="material-symbols-outlined mb-1 text-xl" aria-hidden>
            favorite
            </span>
            <span className="text-[12px]">Favourite</span>
          </Link>
          <button  type = "button" className="flex flex-col items-center">
            <span className="material-symbols-outlined">
            language
            </span>
            <span className="text-[12px]">EN/TH</span>
          </button>
          <Link to="/help" className="flex flex-col items-center">
            <span className="material-symbols-outlined">
            help
            </span>
            <span className="text-[12px]">Help</span>
          </Link>
          <Link
            to="/signin"
            className="rounded-full border-1 bg-teal-700 px-4 py-2 font-bold text-white shadow-[0_6px_0_rgba(0,0,0,.18)] transition hover:bg-teal-800 active:translate-y-[1px]"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}