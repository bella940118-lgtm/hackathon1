"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/groups/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { GROUPS_STORAGE_KEY, parseSavedGroups, serializeSavedGroups, type SavedGroup } from "@/lib/groups/storage";

const GROUPS_UPDATED_EVENT = "splitzy:groups-updated";

export function useSavedGroups() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [hasLocalGroups, setHasLocalGroups] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    let local: SavedGroup[] = [];
    try {
      local = parseSavedGroups(window.localStorage.getItem(GROUPS_STORAGE_KEY));
      setHasLocalGroups(local.length > 0);
      if (user) {
        try {
          const { data: groupRows, error: groupError } = await supabase.from("groups").select("id,name,created_at").order("created_at", { ascending: false });
          if (groupError) throw groupError;
          const { data: memberRows, error: memberError } = await supabase.from("group_members").select("id,group_id,name,sort_order").order("sort_order");
          if (memberError) throw memberError;
          const loaded = (groupRows ?? []).map((row) => {
            const members = (memberRows ?? []).filter((member) => member.group_id === row.id).map((member) => ({ id: member.id, name: member.name }));
            return { group: { id: row.id, name: row.name, memberIds: members.map((member) => member.id), createdAt: row.created_at }, members } satisfies SavedGroup;
          });
          setGroups(loaded);
          setStorageError(null);
        } catch {
          setGroups(local);
          setStorageError("Supabase is unavailable. Showing groups saved in this browser until cloud access returns.");
        }
      } else setGroups(local);
      if (!user) setStorageError(null);
    } catch {
      setGroups([]);
      setStorageError("Splitzy could not read saved groups in this browser.");
    } finally { setLoading(false); }
  }, [authLoading, supabase, user]);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("storage", refresh);
    window.addEventListener(GROUPS_UPDATED_EVENT, refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener(GROUPS_UPDATED_EVENT, refresh); };
  }, [load]);

  const saveGroups = useCallback(async (nextGroups: SavedGroup[]) => {
    try {
      if (user) {
        try {
          for (const { group, members } of nextGroups) {
            const { error: groupError } = await supabase.from("groups").upsert({ id: group.id, name: group.name, created_at: group.createdAt, owner_id: user.id });
            if (groupError) throw groupError;
            const memberRows = members.map((member, sort_order) => ({ id: member.id, group_id: group.id, name: member.name, sort_order }));
            if (memberRows.length) { const { error } = await supabase.from("group_members").upsert(memberRows); if (error) throw error; }
            const keepIds = memberRows.map((member) => member.id);
            let query = supabase.from("group_members").delete().eq("group_id", group.id);
            if (keepIds.length) query = query.not("id", "in", `(${keepIds.join(",")})`);
            const { error: deleteError } = await query;
            if (deleteError) throw deleteError;
          }
          setGroups(nextGroups);
          setStorageError(null);
          window.dispatchEvent(new Event(GROUPS_UPDATED_EVENT));
          return true;
        } catch {
          window.localStorage.setItem(GROUPS_STORAGE_KEY, serializeSavedGroups(nextGroups));
          setGroups(nextGroups);
          setHasLocalGroups(nextGroups.length > 0);
          setStorageError("Supabase is unavailable. Changes are saved in this browser and will stay available locally.");
          window.dispatchEvent(new Event(GROUPS_UPDATED_EVENT));
          return true;
        }
      } else {
        window.localStorage.setItem(GROUPS_STORAGE_KEY, serializeSavedGroups(nextGroups));
        setGroups(nextGroups);
        setHasLocalGroups(nextGroups.length > 0);
        window.dispatchEvent(new Event(GROUPS_UPDATED_EVENT));
      }
      setStorageError(null);
      return true;
    } catch {
      setStorageError(user ? "Your group could not be saved to Supabase. Your existing browser data is still available." : "Your changes could not be saved. Check your browser storage settings and try again.");
      return false;
    }
  }, [supabase, user]);

  const importLocalGroups = useCallback(async () => {
    if (!user) return false;
    try {
      const local = parseSavedGroups(window.localStorage.getItem(GROUPS_STORAGE_KEY));
      const { data: existing, error } = await supabase.from("groups").select("id");
      if (error) throw error;
      const existingIds = new Set((existing ?? []).map((row) => row.id));
      const additions = local.filter((entry) => !existingIds.has(entry.group.id));
      for (const entry of additions) {
        const { error: groupError } = await supabase.from("groups").insert({ id: entry.group.id, name: entry.group.name, created_at: entry.group.createdAt, owner_id: user.id });
        if (groupError) throw groupError;
        if (entry.members.length) {
          const { error: membersError } = await supabase.from("group_members").insert(entry.members.map((member, sort_order) => ({ id: member.id, group_id: entry.group.id, name: member.name, sort_order })));
          if (membersError) throw membersError;
        }
      }
      await load();
      setStorageError(null);
      return true;
    } catch {
      setStorageError("Some browser groups could not be imported. Your local copy is preserved; retry after checking cloud storage.");
      return false;
    }
  }, [load, supabase, user]);

  return { groups, loading: loading || authLoading, storageError, saveGroups, hasLocalGroups, importLocalGroups };
}
