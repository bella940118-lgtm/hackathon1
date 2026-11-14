"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Member } from "@/types";
import { useAuth } from "@/components/groups/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { deleteCloudExpense, loadCloudExpenses, saveCloudExpense } from "@/lib/expenses/cloud";
import { deleteLocalExpense, EXPENSES_UPDATED_EVENT, getSavedExpenses, saveExpense } from "@/lib/expenses/storage";
import type { ExpenseRecord } from "@/lib/expenses/types";

export type ExpenseStorageMode = "cloud" | "guest" | "offline";

export function useGroupExpenses(groupId: string, members: Member[]) {
  const { user, loading: authLoading } = useAuth();
  const client = useMemo(() => createClient(), []);
  const memberIdsKey = members.map((member) => member.id).join("|");
  const memberIds = useMemo(() => memberIdsKey ? memberIdsKey.split("|") : [], [memberIdsKey]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [offlineExpenses, setOfflineExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ExpenseStorageMode>("guest");

  const refresh = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const local = getSavedExpenses(groupId);
      if (user) {
        setMode("cloud");
        setOfflineExpenses(local);
        const remote = await loadCloudExpenses(client, groupId, memberIds);
        setExpenses(remote);
        setError(null);
      } else {
        setMode("guest");
        setExpenses(local);
        setOfflineExpenses([]);
        setError(null);
      }
    } catch (cause) {
      if (user) {
        setMode("cloud");
        try { setOfflineExpenses(getSavedExpenses(groupId)); } catch { setOfflineExpenses([]); }
        setExpenses([]);
      } else {
        setExpenses([]);
        setOfflineExpenses([]);
      }
      setError(cause instanceof Error ? cause.message : "Could not load expenses.");
    } finally { setLoading(false); }
  }, [authLoading, client, groupId, memberIds, user]);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(EXPENSES_UPDATED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EXPENSES_UPDATED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const save = useCallback(async (expense: ExpenseRecord, target: ExpenseStorageMode = user ? "cloud" : "guest", allowUpdate = true) => {
    if (target === "cloud") {
      if (!user) throw new Error("Sign in before saving to Supabase.");
      await saveCloudExpense(client, expense, memberIds, allowUpdate);
      await refresh();
      return;
    }
    saveExpense(expense);
    await refresh();
  }, [client, memberIds, refresh, user]);

  const remove = useCallback(async (expenseId: string, target: ExpenseStorageMode) => {
    if (target === "cloud") {
      if (!user) throw new Error("Sign in before deleting a cloud expense.");
      await deleteCloudExpense(client, expenseId, groupId);
    } else deleteLocalExpense(expenseId);
    await refresh();
  }, [client, groupId, refresh, user]);

  const importOffline = useCallback(async (expenseId: string) => {
    if (!user) throw new Error("Sign in before importing browser expenses.");
    const offline = getSavedExpenses(groupId).find((expense) => expense.id === expenseId);
    if (!offline) throw new Error("That browser copy is no longer available.");
    const remote = await loadCloudExpenses(client, groupId, memberIds);
    if (remote.some((expense) => expense.id === expenseId)) throw new Error("A cloud expense already uses this ID. The cloud record was left unchanged; review both copies before resolving the conflict.");
    await saveCloudExpense(client, offline, memberIds, false);
    const verified = await loadCloudExpenses(client, groupId, memberIds);
    if (!verified.some((expense) => expense.id === expenseId)) throw new Error("Cloud save returned, but the expense could not be verified. The browser copy is preserved.");
    deleteLocalExpense(expenseId);
    await refresh();
  }, [client, groupId, memberIds, refresh, user]);

  return { expenses, offlineExpenses, loading: loading || authLoading, error, mode, signedIn: Boolean(user), refresh, save, remove, importOffline };
}
