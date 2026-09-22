"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BreadcrumbRecordContextValue = {
  recordLabel: string | null;
  setRecordLabel: (label: string | null) => void;
};

const BreadcrumbRecordContext = createContext<BreadcrumbRecordContextValue>({
  recordLabel: null,
  setRecordLabel: () => {},
});

export function BreadcrumbRecordProvider({ children }: { children: ReactNode }) {
  const [recordLabel, setRecordLabel] = useState<string | null>(null);
  const value = useMemo(() => ({ recordLabel, setRecordLabel }), [recordLabel]);
  return (
    <BreadcrumbRecordContext.Provider value={value}>{children}</BreadcrumbRecordContext.Provider>
  );
}

export function useBreadcrumbRecordLabel() {
  return useContext(BreadcrumbRecordContext).recordLabel;
}

export function useSetBreadcrumbRecord(label?: string | null) {
  const { setRecordLabel } = useContext(BreadcrumbRecordContext);

  useLayoutEffect(() => {
    if (!label) {
      setRecordLabel(null);
      return;
    }
    setRecordLabel(label);
    return () => setRecordLabel(null);
  }, [label, setRecordLabel]);
}
