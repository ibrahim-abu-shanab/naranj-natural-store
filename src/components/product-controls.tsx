"use client";
import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { dictionary, type Locale } from "@/lib/i18n";
import { useStore } from "./store";
export function Quantity({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label={`${label} −`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} />
      </button>
      <output aria-label={label}>{value}</output>
      <button
        type="button"
        aria-label={`${label} +`}
        disabled={value >= Math.min(99, max)}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function Favorite({ id, locale }: { id: string; locale: Locale }) {
  const { favorites, favorite } = useStore();
  return (
    <button
      type="button"
      className={`icon favorite ${favorites.includes(id) ? "selected" : ""}`}
      aria-label={dictionary[locale].favorites}
      aria-pressed={favorites.includes(id)}
      onClick={() => favorite(id)}
    >
      <Heart
        size={19}
        fill={favorites.includes(id) ? "currentColor" : "none"}
      />
    </button>
  );
}
export function ProductControls({
  id,
  stock,
  locale,
}: {
  id: string;
  stock: number;
  locale: Locale;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { add, announce } = useStore();
  const d = dictionary[locale];
  return (
    <div className="product-controls">
      <Quantity
        value={quantity}
        max={stock}
        onChange={setQuantity}
        label={d.quantity}
      />
      <button
        className="button add-button"
        disabled={stock < 1}
        onClick={() => {
          add(id, quantity, stock);
          setAdded(true);
          announce(d.added);
          setTimeout(() => setAdded(false), 2000);
        }}
      >
        {added ? <Check size={17} /> : <ShoppingBag size={17} />}
        <span>{stock < 1 ? d.unavailable : added ? d.added : d.add}</span>
      </button>
    </div>
  );
}
