"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { EmployeeAvatar } from "@/components/employees/employee-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  displayName: string;
  email: string;
}

export function UserMenu({ displayName, email }: UserMenuProps) {
  const router = useRouter();
  const [first, ...rest] = displayName.split(" ");
  const last = rest.join(" ");

  function toggleCoaching() {
    if (typeof window === "undefined") return;
    const cur = window.localStorage.getItem("casellaCoachingOptedOut") === "true";
    window.localStorage.setItem("casellaCoachingOptedOut", cur ? "false" : "true");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`Gebruikersmenu (${displayName})`}
      >
        <EmployeeAvatar firstName={first ?? null} lastName={last || null} size={28} />
        <span
          className="hidden text-sm md:inline"
          style={{ color: "var(--fg-secondary)" }}
        >
          {displayName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel
          className="truncate text-xs"
          style={{ color: "var(--fg-tertiary)" }}
        >
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/admin/profile" as Route)}>
          Mijn profiel
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggleCoaching}>
          Coaching-tips uit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
          Afmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
