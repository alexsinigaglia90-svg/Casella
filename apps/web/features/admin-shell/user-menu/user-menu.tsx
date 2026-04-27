"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import { EmployeeAvatar } from "@/components/employees/employee-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isOptedOut, setOptedOut } from "@/features/admin-shell/coaching/tracker";

interface UserMenuProps {
  displayName: string;
  email: string;
}

export function UserMenu({ displayName, email }: UserMenuProps) {
  const router = useRouter();
  const [first, ...rest] = displayName.split(" ");
  const last = rest.join(" ");

  const [optedOut, setOptedOutState] = useState(false);
  useEffect(() => {
    setOptedOutState(isOptedOut());
  }, []);

  function toggleCoaching() {
    const newVal = !optedOut;
    setOptedOut(newVal);
    setOptedOutState(newVal);
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
          {optedOut ? "Coaching-tips aan" : "Coaching-tips uit"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
          Afmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
