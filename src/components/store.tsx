"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cartSchema, type CartItem } from "@/lib/order";
type Snapshot = { items: CartItem[]; favorites: string[]; ready: boolean };
const empty: Snapshot = { items: [], favorites: [], ready: false };
let snapshot = empty;
const listeners = new Set<() => void>();
function read() {
  try {
    const parsed = cartSchema.safeParse(
      JSON.parse(localStorage.getItem("naranj-cart-v1") || "[]"),
    );
    const f: unknown = JSON.parse(
      localStorage.getItem("naranj-favorites-v1") || "[]",
    );
    snapshot = {
      items: parsed.success ? parsed.data : [],
      favorites: Array.isArray(f)
        ? f.filter((v): v is string => typeof v === "string").slice(0, 200)
        : [],
      ready: true,
    };
  } catch {
    snapshot = { items: [], favorites: [], ready: true };
  }
}
function subscribe(callback: () => void) {
  listeners.add(callback);
  const handle = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith("naranj-")) {
      read();
      listeners.forEach((fn) => fn());
    }
  };
  window.addEventListener("storage", handle);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handle);
  };
}
function getSnapshot() {
  if (!snapshot.ready) read();
  return snapshot;
}
function save(next: Snapshot) {
  snapshot = next;
  try {
    localStorage.setItem("naranj-cart-v1", JSON.stringify(next.items));
    localStorage.setItem("naranj-favorites-v1", JSON.stringify(next.favorites));
  } catch {}
  listeners.forEach((fn) => fn());
}
type Store = Snapshot & {
  notice: string;
  add: (id: string, quantity: number, max: number) => void;
  setQuantity: (id: string, n: number, max: number) => void;
  clear: () => void;
  favorite: (id: string) => void;
  announce: (text: string) => void;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (notice) {
      const timeout = setTimeout(() => setNotice(""), 2600);
      return () => clearTimeout(timeout);
    }
  }, [notice]);
  const setQuantity = (id: string, n: number, max: number) =>
    save({
      ...snapshot,
      items: snapshot.items.flatMap((p) =>
        p.id === id
          ? n > 0 && max > 0
            ? [{ id, quantity: Math.min(99, max, n) }]
            : []
          : [p],
      ),
    });
  return (
    <Context.Provider
      value={{
        ...current,
        notice,
        add: (id, quantity, max) => {
          if (max < 1) return;
          save({
            ...snapshot,
            items: snapshot.items.some((p) => p.id === id)
              ? snapshot.items.map((p) =>
                  p.id === id
                    ? { id, quantity: Math.min(99, max, p.quantity + quantity) }
                    : p,
                )
              : [
                  ...snapshot.items,
                  { id, quantity: Math.min(99, max, quantity) },
                ].slice(0, 100),
          });
        },
        setQuantity,
        clear: () => save({ ...snapshot, items: [] }),
        favorite: (id) =>
          save({
            ...snapshot,
            favorites: snapshot.favorites.includes(id)
              ? snapshot.favorites.filter((v) => v !== id)
              : [...snapshot.favorites, id].slice(0, 200),
          }),
        announce: setNotice,
      }}
    >
      {children}
      <div
        className={`toast ${notice ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice}
      </div>
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider is missing");
  return store;
}
