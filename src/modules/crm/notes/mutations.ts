"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notesApi } from "@/modules/crm/notes/api";
import { noteKeys } from "@/modules/crm/notes/queries";
import type { NoteUpdateRequest } from "@/modules/crm/notes/schemas";

async function invalidateNotes(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: noteKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });
  }
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notesApi.create,
    onSuccess: async () => {
      await invalidateNotes(queryClient);
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: NoteUpdateRequest }) =>
      notesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateNotes(queryClient, id);
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: async () => {
      await invalidateNotes(queryClient);
    },
  });
}
