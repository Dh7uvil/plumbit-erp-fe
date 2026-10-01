import {
  GroupCreateRequestSchema,
  GroupMembersAddRequestSchema,
  GroupSchema,
  GroupUpdateRequestSchema,
  type Group,
  type GroupCreateRequest,
  type GroupMembersAddRequest,
  type GroupUpdateRequest,
} from "@/modules/communication/groups/schemas";
import { apiClient } from "@/shared/api/client";

const BASE = "/communication/groups";

export const groupsApi = {
  create: async (values: GroupCreateRequest): Promise<Group> =>
    GroupSchema.parse(await apiClient.post(BASE, GroupCreateRequestSchema.parse(values))),
  update: async (groupId: string, values: GroupUpdateRequest): Promise<Group> =>
    GroupSchema.parse(
      await apiClient.patch(`${BASE}/${groupId}`, GroupUpdateRequestSchema.parse(values)),
    ),
  addMembers: async (groupId: string, values: GroupMembersAddRequest): Promise<Group> =>
    GroupSchema.parse(
      await apiClient.post(`${BASE}/${groupId}/members`, GroupMembersAddRequestSchema.parse(values)),
    ),
  removeMember: async (groupId: string, userId: string): Promise<Group> =>
    GroupSchema.parse(await apiClient.delete(`${BASE}/${groupId}/members/${userId}`)),
  promoteAdmin: async (groupId: string, userId: string): Promise<Group> =>
    GroupSchema.parse(await apiClient.post(`${BASE}/${groupId}/admins/${userId}`, {})),
  demoteAdmin: async (groupId: string, userId: string): Promise<Group> =>
    GroupSchema.parse(await apiClient.delete(`${BASE}/${groupId}/admins/${userId}`)),
  leave: async (groupId: string): Promise<void> => {
    await apiClient.post(`${BASE}/${groupId}/leave`, {});
  },
};
