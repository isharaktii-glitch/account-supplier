"use client";

import { useState, useRef, useEffect } from "react";
import { COUNTRIES } from "@/lib/countries";

export default function CountrySelect({
  name,
  defaultValue,
  required
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue || "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === selected);

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected} required={required} />
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="glass-input flex w-full items-center justify-between text-left"
      >
        <span className={selectedCountry ? "text-slate-100" : "text-slate-400"}>
          {selectedCountry ? selectedCountry.name : "Select your country..."}
        </span>
        <span className="text-slate-400">▾</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-hidden rounded-xl border border-white/10 bg-galaxy-surface shadow-glass">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country..."
            className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-slate-100 outline-none placeholder-slate-500"
          />
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-slate-500">No countries found.</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelected(c.code);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/10 ${
                    selected === c.code ? "bg-galaxy-accent2/10 text-galaxy-accent2" : "text-slate-200"
                  }`}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
