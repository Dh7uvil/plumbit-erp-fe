"use client";

export const groupKeys = {
  all: ["communication", "groups"] as const,
  detail: (groupId: string) => [...groupKeys.all, groupId] as const,
};
