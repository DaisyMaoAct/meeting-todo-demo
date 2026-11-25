"use client";

import type { ReactNode } from "react";
import { SessionActions } from "@/domain/SessionActions";
import { HeaderBar } from "./HeaderBar";
import { SessionProvider, useSession } from "./SessionProvider";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ShellFrame>{children}</ShellFrame>
    </SessionProvider>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const { session, update } = useSession();
  if (!session) {
    return <div className="grid min-h-full place-items-center text-sm text-muted">正在恢复会话…</div>;
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <HeaderBar
        session={session}
        onRole={(role) => update((current) => SessionActions.setRole(current, role))}
        onActor={(actorId) => update((current) => SessionActions.setActor(current, actorId))}
        onDate={(simulatedDate) => update((current) => SessionActions.setSimulatedDate(current, simulatedDate))}
      />
      {children}
    </div>
  );
}
