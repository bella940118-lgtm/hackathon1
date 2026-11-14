import type { Group, Member } from "@/types";

export const GROUPS_STORAGE_KEY = "splitzy.groups.v1";

export interface SavedGroup {
  group: Group;
  members: Member[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMember(value: unknown): value is Member {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
}

function isSavedGroup(value: unknown): value is SavedGroup {
  if (!isRecord(value) || !isRecord(value.group) || !Array.isArray(value.members)) return false;

  const { group, members } = value;
  return (
    typeof group.id === "string" &&
    typeof group.name === "string" &&
    typeof group.createdAt === "string" &&
    Array.isArray(group.memberIds) &&
    group.memberIds.every((id) => typeof id === "string") &&
    members.every(isMember)
  );
}

/** Safely turns persisted JSON into the app's group records. */
export function parseSavedGroups(serialized: string | null): SavedGroup[] {
  if (!serialized) return [];

  try {
    const value: unknown = JSON.parse(serialized);
    return Array.isArray(value) ? value.filter(isSavedGroup) : [];
  } catch {
    return [];
  }
}

export function serializeSavedGroups(groups: SavedGroup[]): string {
  return JSON.stringify(groups);
}
