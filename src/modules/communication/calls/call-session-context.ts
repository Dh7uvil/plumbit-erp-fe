"use client";

import { createContext, useContext } from "react";

import type { Call } from "@/modules/communication/calls/schemas";

type CallSessionContextValue = {
  beginCall: (call: Call) => void;
  activeCall: Call | null;
};

export const CallSessionContext = createContext<CallSessionContextValue | null>(null);

export function useBeginCall(): ((call: Call) => void) | null {
  return useContext(CallSessionContext)?.beginCall ?? null;
}

export function useActiveCallSession(): Call | null {
  return useContext(CallSessionContext)?.activeCall ?? null;
}
