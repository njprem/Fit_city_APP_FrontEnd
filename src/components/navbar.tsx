import { useEffect, useRef, useState } from "react";
import SearchBar from "./searchBar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/Logo_fitcity.png";
import {
  type AuthUser,
  getToken,
  getUser,
  logout,
} from "../services/auth/authService";

interface NavbarProps {
  showSearch?: boolean; // optional, default = true
  activePage?: string; // optional, e.g. "profile", "favorite", etc.
}

export default function Navbar({ showSearch = true }: NavbarProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeIcon, setActiveIcon] = useState<"favorite" | "language" | "help" | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Check login state
  useEffect(() => {
    const token = getToken();
    const u = getUser();
    setUser(token && u ? u : null);

    const onStorage = () => {
      const t = getToken();
      const uu = getUser();
      setUser(t && uu ? uu : null);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChanged", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", onStorage);
    };
  }, []);

  const handleProfileClick = () => setIsMenuOpen((prev) => !prev);
  const handleEditProfile = () => {
    setIsMenuOpen(false);
    navigate("/profile");
  };
  const handleLogout = () => {
    logout();
    setUser(null);
    setIsMenuOpen(false);
    navigate("/login");
  };

  // Click outside or ESC closes menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!user) setIsMenuOpen(false);
  }, [user]);

  useEffect(() => {
    if (location.pathname.startsWith("/favorite")) {
      setActiveIcon("favorite");
    } else if (location.pathname.startsWith("/help")) {
      setActiveIcon("help");
    } else {
      setActiveIcon((prev) => (prev === "language" ? prev : null));
    }
  }, [location.pathname]);

  const getActionClasses = (icon: "favorite" | "language" | "help") =>
    activeIcon === icon ? "text-[#000000]" : "text-[#016B71] hover:text-[#01585C]";

  const displayName = user?.firstName ?? user?.name ?? user?.email ?? "Profile";

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <nav className="w-full h-30" aria-label="Primary">
        <div className="w-full
          grid grid-cols-[max-content_minmax(0,1fr)_max-content] items-center
          gap-x-10 px-12 py-5">
            
          {/* Left: brand */}
          <div className="flex items-center justify-self-start">
            <Link to="/" className="flex items-center justify-center gap-3 shrink-0">
              <img src={Logo} alt="FitCity Logo" className="h-25 w-auto min-w-20" />
            </Link>
          </div>

          {/* Center: Search */}
          {showSearch && (
            <div className="min-w-0 w-full">
              <SearchBar
                onSearch={(q) => console.log("search:", q)}
                className="w-full"
              />
            </div>
          )}

          {/* Right: actions */}
          <div className="flex items-center justify-end gap-8 sm:gap-10 text-[#016B71] justify-self-end">
            
              <Link
                to="/favorite"
                onClick={() => setActiveIcon("favorite")}
                className={`inline-flex h-12 w-[5.5rem] flex-col items-center justify-center text-center leading-none transition-colors ${getActionClasses("favorite")}`}
                >
                <span className="material-symbols-outlined text-2xl" aria-hidden>
                  favorite
                </span>
                <span className="text-xs mt-1">Favourite</span>
              </Link>

              <Link
                to="/help"
                onClick={() => setActiveIcon("help")}
                className={`inline-flex h-12 w-[5.5rem] flex-col items-center leading-none transition-colors ${getActionClasses("help")}`}
              >
                <span className="material-symbols-outlined text-2xl" aria-hidden>
                  help
                </span>
                <span className="text-xs mt-1">Help</span>
              </Link>
            

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="inline-flex h-12 w-[5.5rem] flex-col items-center leading-none text-[#016B71] hover:text-[#01585C] focus:outline-none"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                >
                  <span className="material-symbols-outlined text-2xl" aria-hidden>
                    account_circle
                  </span>
                  <span className="text-xs mt-1 truncate max-w-[6rem]" title={displayName}>
                    {displayName}
                  </span>
                </button>

                {isMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleEditProfile}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Edit Profile
                    </button>
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-[#016B71] px-5 py-2 font-bold text-white shadow-[0_6px_0_rgba(0,0,0,.18)] transition hover:bg-[#01585C] active:translate-y-[1px]"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
