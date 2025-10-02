import { useId, useState } from "react";
import type { FormEvent } from "react";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;   // gets called on submit
  className?: string;                   // extra classes if you need layout tweaks
  loading?: boolean;                    // show a spinner state
};

export default function SearchBar({
  placeholder = "Find your places to go",
  defaultValue = "",
  onSearch,
  className = "",
  loading = false,
}: Props) {
  const [q, setQ] = useState(defaultValue);
  const inputId = useId();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch?.(q.trim());
  }

  return (
    <form
      role="search"
      aria-labelledby={`${inputId}-label`}
      onSubmit={handleSubmit}
      className={[
        // container (pill)
        "flex items-center gap-3 rounded-full border border-black/5",
        "bg-amber-50 px-4 py-3 shadow-[0_2px_0_rgba(0,0,0,.08)]",
        "w-full h-[64px]",
        className,
      ].join(" ")}
    >
      {/* Search icon */}
      <span
        aria-hidden
        className="material-symbols-outlined text-slate-600 opacity-70"
      >
        search
      </span>

      {/* Visually-hidden label for screen readers */}
      <span id={`${inputId}-label`} className="sr-only">
        Search the site
      </span>

      {/* Input */}
      <input
        id={inputId}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={[
          "w-full bg-transparent outline-none",
          "text-slate-800 placeholder:text-slate-700/70",
          "text-[16px]",
        ].join(" ")}
      />

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className={[
          "min-w-[96px] rounded-full border-1 border-[#d8f9f9]",
          "bg-[#016B71] px-4 py-2 font-bold text-white",
          "shadow-[0_6px_0_rgba(0,0,0,.18)]",
          "transition hover:bg-teal-800 active:translate-y-[1px]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
        ].join(" ")}
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}