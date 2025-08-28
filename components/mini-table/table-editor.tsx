"use client";

import { Filter, Loader2, MoreHorizontal, Plus, Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { columns } from "./columns";
import { DataTable } from "./data.table";

export interface CustomerRow {
  id: string;
  bio: string;
  name: string;
  language: string;
  version: "new customer" | "served" | "to contact" | "pause";
  state: string;
  createdDate: string;
  isNew?: boolean;
}

const RANDOM_STATES = [
  "CA",
  "NY",
  "TX",
  "FL",
  "IL",
  "PA",
  "OH",
  "GA",
  "NC",
  "MI",
];

const RANDOM_VERSIONS: CustomerRow["version"][] = [
  "new customer",
  "served",
  "to contact",
  "pause",
];

type RemoteRow = Record<string, any>;

type EditCache = Record<string, Partial<CustomerRow>>;

const mapRemoteToCustomer = (item: RemoteRow, idx: number): CustomerRow => {
  const id = (item.guid || item.id || item._id || String(idx)) as string;
  const name =
    item.name && typeof item.name === "string"
      ? item.name
      : item.name &&
        typeof item.name === "object" &&
        (item.name.first || item.name.last)
      ? `${item.name.first ?? ""} ${item.name.last ?? ""}`.trim()
      : item.username || item.email || `User ${idx}`;
  const bio = (item.bio || "") as string;
  const language = (item.company ||
    item.eyeColor ||
    item.favoriteFruit ||
    "") as string;
  const state = RANDOM_STATES[idx % RANDOM_STATES.length];
  const createdDate = new Date(Date.now() - (idx % 365) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const version = RANDOM_VERSIONS[idx % RANDOM_VERSIONS.length]; // ???

  return { id, name, bio, language, state, createdDate, version };
};

const PAGE_SIZE = 40;

export function TableEditor() {
  const [allRows, setAllRows] = useState<CustomerRow[]>([]);
  const [data, setData] = useState<CustomerRow[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [editCache, setEditCache] = useState<EditCache>(() => {
    if (typeof window === "undefined") return {};

    try {
      const raw = localStorage.getItem("mini-table:edits");
      return raw ? (JSON.parse(raw) as EditCache) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("mini-table:edits", JSON.stringify(editCache));
  }, [editCache]);

  const applyEdits = useCallback(
    (rows: CustomerRow[]): CustomerRow[] =>
      rows.map((r) => ({ ...r, ...(editCache[r.id] ?? {}) })),
    [editCache]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setIsError(null);

      try {
        const res = await fetch(
          "https://microsoftedge.github.io/Demos/json-dummy-data/5MB.json"
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as RemoteRow[];

        if (cancelled) return;

        const mapped = json.map(mapRemoteToCustomer);
        setAllRows(mapped);

        const first = mapped.slice(0, PAGE_SIZE);
        setData(applyEdits(first));
        setHasMore(mapped.length > PAGE_SIZE);
      } catch (e: any) {
        setIsError(e?.message ?? "Failed to load data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [applyEdits]);

  const loadMore = useCallback(async () => {
    setIsLoading(true);

    setData((prev) => {
      const nextIndex = prev.length;

      const nextSlice = allRows.slice(nextIndex, nextIndex + PAGE_SIZE);

      if (nextSlice.length === 0) return prev;

      const merged = [...prev, ...applyEdits(nextSlice)];

      if (merged.length >= allRows.length) setHasMore(false);

      return merged;
    });

    setIsLoading(false);
  }, [allRows, applyEdits]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && hasMore && !isLoading && !isError)
          loadMore();
      },
      { root: scrollContainerRef.current, threshold: 1 }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading, isError, loadMore]);

  const updateCell = useCallback(
    (rowId: string, key: keyof CustomerRow, value: string) => {
      // Update edit cache
      setEditCache((prev) => ({
        ...prev,
        [rowId]: { ...(prev[rowId] ?? {}), [key]: value },
      }));

      // Update data
      setData((prev) =>
        prev.map((r) =>
          r.id === rowId ? ({ ...r, [key]: value } as CustomerRow) : r
        )
      );

      // Call api update row ???
    },
    []
  );

  const addNewRow = () => {
    const id = `new-${Date.now()}`;
    const newRow: CustomerRow = {
      id,
      bio: "",
      name: "",
      language: "",
      version: "new customer",
      state: "",
      createdDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      isNew: true,
    };
    setData((prev) => [newRow, ...prev]);
  };

  return (
    <Card className="w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button onClick={addNewRow} size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            Add row
          </Button>
          <Button variant="outline" size="sm" className="h-8 bg-transparent">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-8 bg-transparent">
            <Settings className="h-4 w-4 mr-1" />
            Fields
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 bg-transparent">
            <MoreHorizontal className="h-4 w-4 mr-1" />
            Action
          </Button>
        </div>
      </div>

      {/* Data Table with scroll container */}
      <div className="p-4">
        {isError ? (
          <div className="text-sm text-red-500">Error: {isError}</div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="max-h-[60vh] overflow-auto rounded"
          >
            <DataTable columns={columns} data={data} meta={{ updateCell }} />

            <div ref={sentinelRef} className="h-8" />

            {isLoading && (
              <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </div>
            )}

            {!hasMore && allRows.length > 0 && (
              <div className="py-3 text-center text-xs text-muted-foreground">
                End of results
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom New row placeholder */}
      <div className="p-4 border-t">
        <Button
          onClick={addNewRow}
          variant="outline"
          className="bg-transparent"
        >
          + New row
        </Button>
      </div>
    </Card>
  );
}
