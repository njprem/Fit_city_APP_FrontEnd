import { useEffect, useRef, useState } from "react";
import SearchBar from "./searchBar";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo_fitcity.png";
import { type AuthUser, getToken, getUser, logout } from "../services/auth/authService";

export default function Navbar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Check login state when page loads and when localStorage changes
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
    window.addEventListener("authChanged", onStorage); // custom event for instant update
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", onStorage);
    };
  }, []);

  const handleProfileClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!user) {
      setIsMenuOpen(false);
    }
  }, [user]);

  const displayName =
    user?.firstName ??
    user?.name ??
    user?.email ??
    "Profile";

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <nav className="w-full h-30" aria-label="Primary">
        <div className="w-full grid [grid-template-columns:_auto_minmax(320px,1fr)_auto] items-center gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-6 lg:px-10 py-5">
          {/* Left: brand */}
          <Link to="/" className="flex items-center justify-center gap-3 shrink-0">
            <img
              src={Logo}
              alt="FitCity Logo"
              className="h-25 w-auto min-w-20"
            />
          </Link>
          {/* <div>kofjoejfoje</div> */}

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

              {user ? (
                <li>
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={handleProfileClick}
                      className="flex flex-col items-center leading-none text-[#016B71] hover:text-[#01585C] focus:outline-none"
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
                </li>
              ) : (
                <li>
                  <Link
                    to="/login"
                    className="rounded-full bg-[#016B71] px-5 py-2 font-bold text-white shadow-[0_6px_0_rgba(0,0,0,.18)] transition hover:bg-[#01585C] active:translate-y-[1px]"
                  >
                    Log In
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
