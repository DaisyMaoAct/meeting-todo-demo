"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { SessionStore } from "@/domain/SessionStore";
import type { SessionState } from "@/domain/types";

type SessionApi = {
  session: SessionState | null;
  update: (recipe: (state: SessionState) => SessionState) => void;
};

const SessionContext = createContext<SessionApi | null>(null);

function subscribeToClient() {
  return () => {};
}

function readClient() {
  return true;
}

function readServer() {
  return false;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(subscribeToClient, readClient, readServer);
  const [session, setSession] = useState<SessionState | null>(null);

  if (isClient && session === null) {
    setSession(SessionStore.load() ?? SessionStore.empty());
  }

  useEffect(() => {
    if (!session) return;
    SessionStore.save(session);
  }, [session]);

  const update = useCallback((recipe: (state: SessionState) => SessionState) => {
    setSession((current) => (current ? recipe(current) : current));
  }, []);

  const value = useMemo(() => ({ session, update }), [session, update]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("会话还没有准备好");
  }
  return value;
}
