// src/components/SubNav.tsx
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

type Item = { label: string; href: string };

function Menu({ label, items }: { label: string; items: Item[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-2 text-[#016B71] hover:text-[#014A4E]"
      >
        <span className="font-semibold">{label}</span>
        <span className="material-symbols-outlined text-base" aria-hidden>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-md ring-1 ring-black/5">
          <ul className="py-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-slate-700 hover:bg-teal-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SubNav() {
  return (
    <div className="sticky top-[96px] z-40 
        bg-white border-slate-200 shadow-sm">
      <div className="ml-[8%] py-3 flex items-center gap-10">
        <Menu
          label="Places"
          items={[
            { label: "Parks", href: "/places/parks" },
            { label: "Gyms", href: "/places/gyms" },
            { label: "Beaches", href: "/places/beaches" },
          ]}
        />
        <Menu
          label="Activities"
          items={[
            { label: "Running", href: "/activities/running" },
            { label: "Cycling", href: "/activities/cycling" },
            { label: "Yoga", href: "/activities/yoga" },
          ]}
        />
      </div>
    </div>
  );
}