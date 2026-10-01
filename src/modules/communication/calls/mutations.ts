"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { callsApi } from "@/modules/communication/calls/api";
import { callKeys } from "@/modules/communication/calls/queries";
import type { CallCreateRequest, CallMediaUpdateRequest } from "@/modules/communication/calls/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

function useInvalidateCalls() {
  const queryClient = useQueryClient();
  const baseKey = useTenantQueryKey(callKeys.all);
  return () => queryClient.invalidateQueries({ queryKey: baseKey });
}

export function useCreateCall() {
  const invalidate = useInvalidateCalls();
  return useMutation({
    mutationFn: (values: CallCreateRequest) => callsApi.create(values),
    onSuccess: () => invalidate(),
  });
}

export function useAcceptCall() {
  const invalidate = useInvalidateCalls();
  return useMutation({
    mutationFn: (id: string) => callsApi.accept(id),
    onSuccess: () => invalidate(),
  });
}

export function useRejectCall() {
  const invalidate = useInvalidateCalls();
  return useMutation({
    mutationFn: (id: string) => callsApi.reject(id),
    onSuccess: () => invalidate(),
  });
}

export function useJoinCall() {
  const invalidate = useInvalidateCalls();
  return useMutation({
    mutationFn: (id: string) => callsApi.join(id),
    onSuccess: () => invalidate(),
  });
}

export function useLeaveCall() {
  const invalidate = useInvalidateCalls();
  return useMutation({
    mutationFn: (id: string) => callsApi.leave(id),
    onSuccess: () => invalidate(),
  });
}

export function useEndCall() {
  const invalidate = useInvalidateCalls();
  return useMutation({
    mutationFn: (id: string) => callsApi.end(id),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateCallMedia() {
  const invalidate = useInvalidateCalls();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CallMediaUpdateRequest }) =>
      callsApi.updateMedia(id, values),
    onSuccess: () => invalidate(),
  });
}
