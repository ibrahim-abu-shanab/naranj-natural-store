"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "@/components/catalog-image";
import { ShoppingBag, MessageCircle, Trash2 } from "lucide-react";
import { useStore } from "./store";
import { Quantity } from "./product-controls";
import { dictionary, localized, money, type Locale } from "@/lib/i18n";
type Product = {
  id: string;
  slug: string;
  nameTr: string;
  nameAr: string;
  price: number;
  stock: number;
  size: string;
  images: { url: string }[];
};
export function Cart({
  products,
  locale,
  configured,
}: {
  products: Product[];
  locale: Locale;
  configured: boolean;
}) {
  const { items, setQuantity, clear, ready } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const d = dictionary[locale];
  const lines = items.map((item) => ({
    item,
    product: products.find((p) => p.id === item.id),
  }));
  const total = lines.reduce(
    (n, { item, product }) => n + (product ? product.price * item.quantity : 0),
    0,
  );
  async function checkout() {
    if (busy) return;
    const checkoutWindow = window.open("about:blank", "_blank");
    if (checkoutWindow) checkoutWindow.opener = null;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, items, expectedTotal: total }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.code === "STALE_CART"
            ? d.invalidCart
            : body.code === "NOT_CONFIGURED"
              ? d.notConfigured
              : d.error,
        );
      if (checkoutWindow) checkoutWindow.location.href = body.url;
      else window.location.assign(body.url);
    } catch (e) {
      checkoutWindow?.close();
      setError(e instanceof Error ? e.message : d.error);
    } finally {
      setBusy(false);
    }
  }
  if (!ready) return <div className="skeleton" />;
  if (!items.length)
    return (
      <div className="empty-state">
        <ShoppingBag size={52} />
        <h2>{d.emptyCart}</h2>
        <p>{d.emptyCartText}</p>
        <Link className="button" href={`/${locale}/products`}>
          {d.discover}
        </Link>
      </div>
    );
  return (
    <div className="cart-layout">
      <div>
        {lines.map(({ item, product: p }) => (
          <div className="cart-line" key={item.id}>
            {p && (
              <Image
                src={p.images[0]?.url || "/images/image-placeholder.svg"}
                alt={localized(p, "name", locale)}
                width={105}
                height={125}
              />
            )}
            <div className="cart-line-info">
              <h2>
                {p ? (
                  <Link href={`/${locale}/products/${p.slug}`}>
                    {localized(p, "name", locale)}
                  </Link>
                ) : (
                  d.unavailable
                )}
              </h2>
              {p && (
                <p>
                  {p.size} · {money(p.price, locale)}
                </p>
              )}
              {p && (
                <Quantity
                  value={item.quantity}
                  max={p.stock}
                  onChange={(n) => setQuantity(item.id, n, p.stock)}
                  label={d.quantity}
                />
              )}
              <span>
                {(!p || p.stock < item.quantity) && (
                  <p className="out-stock">{d.invalidCart}</p>
                )}
              </span>
            </div>
            <div className="cart-line-price">
              <strong>
                {p ? money(p.price * item.quantity, locale) : "—"}
              </strong>
              <button
                className="cart-remove"
                onClick={() => setQuantity(item.id, 0, 0)}
                aria-label={d.removeProduct}
                title={d.removeProduct}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        <button
          className="cart-clear"
          onClick={clear}
        >
          <Trash2 size={15} aria-hidden="true" />
          {d.clear}
        </button>
      </div>
      <aside className="order-summary">
        <h2>{d.cart}</h2>
        <dl>
          <div>
            <dt>{d.pieces}</dt>
            <dd>{items.reduce((n, p) => n + p.quantity, 0)}</dd>
          </div>
          <div>
            <dt>{d.subtotal}</dt>
            <dd>{money(total, locale)}</dd>
          </div>
          <div className="summary-total">
            <dt>{d.total}</dt>
            <dd>{money(total, locale)}</dd>
          </div>
        </dl>
        <button
          className="button"
          onClick={checkout}
          aria-disabled={busy}
        >
          <MessageCircle size={19} />
          {busy ? "…" : d.whatsapp}
        </button>
        {!configured && (
          <p>
            {d.notConfigured}{" "}
            <Link href={`/${locale}/contact`}>{d.contact}</Link>
          </p>
        )}
        <p>{d.orderNote}</p>
        {error && (
          <div role="alert" className="alert">
            {error}
            <button
              className="link-button"
              onClick={() => window.location.reload()}
            >
              {d.retry}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
