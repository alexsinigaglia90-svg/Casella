"use client";

import type { PdokAddress, PdokSuggestion } from "@casella/maps";
import type { ApiError } from "@casella/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";


import { useDebounce } from "./use-debounce";

import { mapAddressError } from "@/features/address-input/error-mapper";
import { cn } from "@/lib/utils";

interface Props {
  value: PdokAddress | null;
  onChange: (v: PdokAddress | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressInput({
  value,
  onChange,
  placeholder = "Zoek een adres…",
  disabled = false,
}: Props) {
  const [query, setQuery] = useState(value?.fullDisplay ?? "");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PdokSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const skipNextFetchRef = useRef(false);
  const debouncedQuery = useDebounce(query, 300);

  // Sync display value when controlled value changes externally
  useEffect(() => {
    skipNextFetchRef.current = true;
    setQuery(value?.fullDisplay ?? "");
  }, [value]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setErrorMessage(null);
      return;
    }

    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setLoading(true);

    fetch(`/api/pdok/suggest?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: ctl.signal,
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => ({}))) as Partial<ApiError>;
          const mapped = body.error && body.message
            ? mapAddressError(body as ApiError)
            : "Er ging iets mis bij het zoeken";
          throw new Error(mapped);
        }
        return r.json() as Promise<{ results: PdokSuggestion[] }>;
      })
      .then((json) => {
        if (ctl.signal.aborted) return;
        setSuggestions(json.results ?? []);
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (
          (err instanceof Error && err.name === "AbortError") ||
          ctl.signal.aborted
        )
          return;
        setSuggestions([]);
        setErrorMessage(err instanceof Error ? err.message : "Er ging iets mis bij het zoeken");
      })
      .finally(() => {
        if (!ctl.signal.aborted) setLoading(false);
      });

    return () => {
      ctl.abort();
    };
  }, [debouncedQuery]);

  async function handleSelect(suggestion: PdokSuggestion) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const r = await fetch(`/api/pdok/lookup/${encodeURIComponent(suggestion.id)}`);
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as Partial<ApiError>;
        const mapped = body.error && body.message
          ? mapAddressError(body as ApiError)
          : "Er ging iets mis bij het zoeken";
        throw new Error(mapped);
      }
      const json = (await r.json().catch(() => ({}))) as { address?: PdokAddress };
      if (json.address) {
        skipNextFetchRef.current = true;
        onChange(json.address);
        setQuery(json.address.fullDisplay);
        setOpen(false);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Er ging iets mis bij het zoeken");
      onChange(null);
    } finally {
      setLoading(false);
    }
    setSuggestions([]);
  }

  function handleClear() {
    setQuery("");
    setSuggestions([]);
    setErrorMessage(null);
    onChange(null);
  }

  const showEmpty = !loading && suggestions.length === 0 && debouncedQuery.length >= 2 && !errorMessage;

  return (
    <div className="relative w-full">
      <Command
        shouldFilter={false}
        className={cn(
          "overflow-visible rounded-md border border-border bg-surface-base",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <div className="flex items-center gap-2 px-3">
          <MapPin
            aria-hidden
            className="h-4 w-4 shrink-0 text-fg-tertiary"
          />
          <CommandInput
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              setOpen(true);
              if (v === "" && value) onChange(null);
              if (v === "") setSuggestions([]);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-fg-tertiary"
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-fg-tertiary hover:text-fg-secondary"
            >
              Wissen
            </button>
          )}
        </div>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-border bg-surface-base shadow-md">
            <CommandList>
              {loading && (
                <div className="px-4 py-2 text-sm text-fg-tertiary">
                  Laden…
                </div>
              )}

              {showEmpty && (
                <CommandEmpty className="px-4 py-2 text-sm text-fg-tertiary">
                  {debouncedQuery.length < 2
                    ? "Typ minimaal 2 tekens"
                    : "Geen resultaten"}
                </CommandEmpty>
              )}

              {!loading && debouncedQuery.length < 2 && (
                <div className="px-4 py-2 text-sm text-fg-tertiary">
                  Typ minimaal 2 tekens
                </div>
              )}

              {errorMessage && (
                <div className="px-4 py-2 text-sm text-status-warning">
                  {errorMessage}
                </div>
              )}

              {!loading && suggestions.length > 0 && (
                <CommandGroup>
                  {suggestions.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={s.id}
                      onSelect={() => handleSelect(s)}
                      className={cn(
                        "cursor-pointer px-4 py-2 text-sm",
                        "hover:bg-surface-deep aria-selected:bg-surface-deep"
                      )}
                    >
                      {s.weergavenaam}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
