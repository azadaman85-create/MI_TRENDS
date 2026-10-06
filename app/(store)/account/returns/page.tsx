"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, PackageCheck, RotateCcw, TriangleAlert } from "lucide-react";

import "@/components/account/account.css";
import { useCustomer } from "@/lib/account/auth";
import { money } from "@/lib/format";
import {
  RETURN_REASONS,
  refundPolicyFor,
  returnStatusCopy,
  isPrepaid,
  RETURN_STATUS_LABEL,
  RETURN_WINDOW_DAYS,
  type ReturnBlockReason,
  type ReturnStatus,
} from "@/lib/returns";

type Line = {
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
};

type Eligibility =
  | { eligible: true; deadline: string; daysLeft: number }
  | { eligible: false; reason: ReturnBlockReason; deadline?: string };

type MyOrder = {
  reference: string;
  placedAt: string;
  deliveredAt: string | null;
  status: string;
  total: number;
  lines: Line[];
  payment: string;
  returnRequest: { status: ReturnStatus; requestedAt: string; reason: string } | null;
  returns: Eligibility;
};

const dateOf = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/** Why an order can't be returned, phrased for the person reading it. */
const BLOCKED_COPY: Record<ReturnBlockReason, string> = {
  "not-delivered": "You can start a return once this order has been delivered.",
  "window-closed": `The ${RETURN_WINDOW_DAYS}-day return window has closed for this order.`,
  "already-requested": "A return is already in progress for this order.",
  "order-closed": "This order was cancelled or has already been returned.",
};

export default function ReturnsPage() {
  const router = useRouter();
  const { customer, ready } = useCustomer();

  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !customer) router.replace("/account/login?next=/account/returns");
  }, [ready, customer, router]);

  // Bumped after a return is raised, to pull the list again with the new state.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!customer) return;
    // Guards against a reply landing after the page has moved on.
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/orders/mine");
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body?.error ?? "Could not load your orders.");
          return;
        }
        setOrders(body.orders ?? []);
        setError(null);
      } catch {
        if (!cancelled) setError("Could not reach the server. Check your connection and try again.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, reloadToken]);

  if (!ready || !customer) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "#77716a" }}>
        <span className="eyebrow">{ready ? "Taking you to sign in…" : "Loading…"}</span>
      </div>
    );
  }

  return (
    <div className="acct-home">
      <header className="acct-home__head">
        <div>
          <p className="eyebrow">Your account</p>
          <h1>Returns</h1>
          <p style={{ margin: "10px 0 0", maxWidth: "52ch", color: "#6f6962", fontSize: "0.88rem", lineHeight: 1.6 }}>
            You have <strong>{RETURN_WINDOW_DAYS} days from delivery</strong> to send something back,
            unworn and with its tags on. Pick the order below and tell us what&rsquo;s coming back.
          </p>
        </div>
      </header>

      {error ? (
        <p className="ret__error" role="alert">
          <TriangleAlert size={15} aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {orders === null && !error ? <p className="ret__muted">Loading your orders…</p> : null}

      {orders !== null && orders.length === 0 ? (
        <div className="ret__empty">
          <PackageCheck size={26} aria-hidden="true" />
          <p>No orders yet — once something arrives, it will show up here.</p>
          <Link className="button button-primary" href="/shop">
            Start shopping
          </Link>
        </div>
      ) : null}

      <div className="ret__list">
        {(orders ?? []).map((order) => (
          <OrderCard
            key={order.reference}
            order={order}
            open={openFor === order.reference}
            onToggle={() => setOpenFor(openFor === order.reference ? null : order.reference)}
            onDone={() => {
              setOpenFor(null);
              setReloadToken((t) => t + 1);
            }}
          />
        ))}
      </div>

      <p className="ret__policy">
        Full terms are in our <Link href="/info/returns">Return &amp; Refund Policy</Link>.
      </p>
    </div>
  );
}

function OrderCard({
  order,
  open,
  onToggle,
  onDone,
}: {
  order: MyOrder;
  open: boolean;
  onToggle: () => void;
  onDone: () => void;
}) {
  const canReturn = order.returns.eligible;

  return (
    <article className="ret__card">
      <header className="ret__card-head">
        <div>
          <strong>{order.reference}</strong>
          <span className="ret__meta">
            Placed {dateOf(order.placedAt)}
            {order.deliveredAt ? ` · Delivered ${dateOf(order.deliveredAt)}` : ""} · {money(order.total)}
          </span>
        </div>

        {order.returnRequest ? (
          <span
            className={`ret__badge ${order.returnRequest.status === "completed" ? "ret__badge--ok" : order.returnRequest.status === "rejected" ? "ret__badge--bad" : "ret__badge--info"}`}
          >
            {RETURN_STATUS_LABEL[order.returnRequest.status]}
          </span>
        ) : canReturn ? (
          <span className="ret__badge ret__badge--ok">
            <Clock size={13} aria-hidden="true" />
            {order.returns.daysLeft} day{order.returns.daysLeft === 1 ? "" : "s"} left
          </span>
        ) : (
          <span className="ret__badge">{order.status}</span>
        )}
      </header>

      <ul className="ret__items">
        {order.lines.map((line, index) => (
          <li key={`${line.sku}-${index}`}>
            {line.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={line.imageUrl} alt="" />
            ) : (
              <span className="ret__thumb-fallback" aria-hidden="true" />
            )}
            <span>
              <strong>{line.name}</strong>
              <small>
                {line.color} · Size {line.size} · Qty {line.quantity}
              </small>
            </span>
            <span className="ret__price">{money(line.price * line.quantity)}</span>
          </li>
        ))}
      </ul>

      {order.returnRequest ? (
        <p className="ret__note">
          Requested on {dateOf(order.returnRequest.requestedAt)} — {order.returnRequest.reason}.
          <br />
          {returnStatusCopy(order.returnRequest.status, order.payment)}
        </p>
      ) : canReturn ? (
        <>
          <button className="button button--outline ret__start" type="button" onClick={onToggle}>
            <RotateCcw size={15} aria-hidden="true" />
            {open ? "Cancel" : "Return items"}
          </button>
          {open ? <ReturnForm order={order} onDone={onDone} /> : null}
        </>
      ) : (
        <p className="ret__note ret__note--muted">{BLOCKED_COPY[order.returns.reason]}</p>
      )}
    </article>
  );
}

function ReturnForm({ order, onDone }: { order: MyOrder; onDone: () => void }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [refundUpi, setRefundUpi] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (index: number, max: number) =>
    setPicked((current) => {
      const next = { ...current };
      if (next[index]) delete next[index];
      else next[index] = max;
      return next;
    });

  const submit = async () => {
    setError(null);
    const items = Object.entries(picked).map(([lineIndex, quantity]) => ({
      lineIndex: Number(lineIndex),
      quantity,
    }));
    if (items.length === 0) return setError("Choose at least one item.");
    if (!reason) return setError("Choose a reason.");
    // Cash on delivery left no card or UPI behind, so we have to be told where to send it.
    if (!isPrepaid(order.payment) && !/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(refundUpi.trim())) {
      return setError("Enter the UPI ID for your refund, for example name@bank.");
    }

    setBusy(true);
    try {
      const res = await fetch("/api/orders/return", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference: order.reference, reason, note, items, refundUpi: refundUpi.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Could not raise the return.");
        return;
      }
      onDone();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ret__form">
      <fieldset>
        <legend>What are you sending back?</legend>
        {order.lines.map((line, index) => (
          <label className="ret__pick" key={`${line.sku}-pick-${index}`}>
            <input type="checkbox" checked={Boolean(picked[index])} onChange={() => toggle(index, line.quantity)} />
            <span>
              {line.name} <small>({line.color}, {line.size})</small>
            </span>
            {picked[index] && line.quantity > 1 ? (
              <select
                value={picked[index]}
                onChange={(event) => setPicked((c) => ({ ...c, [index]: Number(event.target.value) }))}
                aria-label={`Quantity of ${line.name} to return`}
              >
                {Array.from({ length: line.quantity }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} of {line.quantity}
                  </option>
                ))}
              </select>
            ) : null}
          </label>
        ))}
      </fieldset>

      <label className="ret__field">
        <span>Reason</span>
        <select value={reason} onChange={(event) => setReason(event.target.value)}>
          <option value="">Choose a reason…</option>
          {RETURN_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      {!isPrepaid(order.payment) ? (
        <label className="ret__field">
          <span>UPI ID for your refund</span>
          <input
            className="ret__input"
            value={refundUpi}
            onChange={(event) => setRefundUpi(event.target.value)}
            placeholder="name@bank"
            autoComplete="off"
            inputMode="email"
          />
          <small className="ret__hint">
            You paid cash on delivery, so there&rsquo;s no card or UPI for us to send it back to.
          </small>
        </label>
      ) : null}

      <label className="ret__field">
        <span>Anything else? (optional)</span>
        <textarea
          rows={3}
          value={note}
          maxLength={500}
          placeholder="Tell us a bit more, if it helps."
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {error ? (
        <p className="ret__error" role="alert">
          <TriangleAlert size={15} aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <p className="ret__policy-note">{refundPolicyFor(order.payment)}</p>

      <button className="button button-primary" type="button" onClick={submit} disabled={busy}>
        {busy ? "Sending…" : "Request return"}
      </button>
    </div>
  );
}
