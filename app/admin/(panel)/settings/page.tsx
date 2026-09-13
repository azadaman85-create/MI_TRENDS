"use client";

import { motion } from "framer-motion";
import { RotateCcw, Save, Store, Truck, UserRound } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Input, Select, Switch, Textarea } from "@/components/admin/ui/Field";
import { formatINR } from "@/lib/admin/format";
import { ConfirmDialog } from "@/components/admin/ui/Modal";
import { Tabs } from "@/components/admin/ui/Tabs";
import { useAdminAuth } from "@/lib/admin/auth";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";

const tabs = [
  { id: "store", label: "Store" },
  { id: "shipping", label: "Shipping & payments" },
  { id: "account", label: "Account" },
  { id: "data", label: "Demo data" },
];

export default function SettingsPage() {
  const { user } = useAdminAuth();
  const { notify, resetDemoData, products, orders, settings, updateSettings } = useAdminStore();
  const [tab, setTab] = useState("store");
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [store, setStore] = useState({
    name: "MI TRENDS",
    tagline: "Made to be noticed",
    email: "hello@mitrends.in",
    phone: "+91 98200 00000",
    address: "Unit 4, Design District, Mumbai 400001",
    description:
      "Original streetwear, graphic essentials and everyday statement pieces designed in India.",
    currency: "INR",
  });

  const save = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 420));
    setSaving(false);
    notify("Settings saved", "success", "Storefront copy and checkout rules updated.");
  };

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Storefront"
        title="Settings"
        description="Store identity, checkout rules and your own admin account."
        actions={
          <Button loading={saving} onClick={save}>
            <Save size={15} aria-hidden="true" />
            Save changes
          </Button>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Tabs items={tabs} active={tab} onChange={setTab} layoutId="settings-tabs" />
      </div>

      {tab === "store" ? (
        <div className="a-split">
          <Card title="Store identity" description="Used across the storefront, invoices and emails.">
            <div className="a-stack">
              <div className="a-grid a-grid--2">
                <Input label="Store name" value={store.name} onChange={(event) => setStore({ ...store, name: event.target.value })} />
                <Input label="Tagline" value={store.tagline} onChange={(event) => setStore({ ...store, tagline: event.target.value })} />
              </div>
              <Textarea
                label="Store description"
                rows={3}
                value={store.description}
                onChange={(event) => setStore({ ...store, description: event.target.value })}
              />
              <div className="a-grid a-grid--2">
                <Input label="Support email" type="email" value={store.email} onChange={(event) => setStore({ ...store, email: event.target.value })} />
                <Input label="Support phone" value={store.phone} onChange={(event) => setStore({ ...store, phone: event.target.value })} />
              </div>
              <Input label="Registered address" value={store.address} onChange={(event) => setStore({ ...store, address: event.target.value })} />
              <Select
                label="Currency"
                value={store.currency}
                onChange={(event) => setStore({ ...store, currency: event.target.value })}
                options={[{ value: "INR", label: "Indian Rupee (₹)" }]}
                hint="The storefront prices and admin reporting both use this currency."
              />
            </div>
          </Card>

          <Card title="Brand" className="a-sticky">
            <div className="a-stack">
              <div className="a-row" style={{ gap: 10 }}>
                <span className="admin-brand-mark" style={{ background: "var(--ink)", color: "var(--white)" }} aria-hidden="true">
                  MI
                </span>
                <span>
                  <strong style={{ fontFamily: "var(--display)", fontSize: "1.05rem", letterSpacing: "-0.05em" }}>
                    TRENDS
                  </strong>
                  <p className="a-muted" style={{ fontSize: "0.72rem" }}>
                    {store.tagline}
                  </p>
                </span>
              </div>
              <div>
                <span className="a-label">Palette</span>
                <div className="a-row" style={{ marginTop: 8, gap: 7 }}>
                  {["#131313", "#ef3f2f", "#ffd943", "#16764a", "#f3f0ea"].map((hex) => (
                    <span
                      key={hex}
                      title={hex}
                      style={{ width: 30, height: 30, borderRadius: 6, background: hex, border: "1px solid var(--line)" }}
                    />
                  ))}
                </div>
              </div>
              <p className="a-muted" style={{ fontSize: "0.74rem", lineHeight: 1.6 }}>
                <Store size={13} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
                The admin panel reads these tokens from the same stylesheet the storefront uses, so brand changes carry
                across both.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "shipping" ? (
        <div className="a-split">
          <Card title="Shipping rules" description="What the checkout charges and when.">
            <div className="a-stack">
              <div className="a-grid a-grid--2">
                <Input
                  label="Free shipping above"
                  type="number"
                  prefix="₹"
                  value={settings.freeShippingThreshold}
                  onChange={(event) => updateSettings({ freeShippingThreshold: Number(event.target.value) })}
                />
                <Input
                  label="Standard shipping"
                  type="number"
                  prefix="₹"
                  value={settings.standardShipping}
                  onChange={(event) => updateSettings({ standardShipping: Number(event.target.value) })}
                />
              </div>
              <p className="a-muted" style={{ fontSize: "0.76rem", lineHeight: 1.6 }}>
                <Truck size={13} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
                These apply at checkout the moment you change them — there is no separate publish step.
              </p>
            </div>
          </Card>

          <Card title="Payment methods" className="a-sticky">
            <div className="a-stack">
              <div
                className="a-row a-row--between"
                style={{ padding: "11px 12px", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}
              >
                <Switch checked disabled label="UPI" onChange={() => undefined} />
                <Badge tone="success" dot>
                  Always on
                </Badge>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  padding: "13px 14px",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  background: settings.codEnabled ? "var(--green-soft)" : "var(--surface)",
                }}
              >
                <div className="a-row a-row--between">
                  <Switch
                    checked={settings.codEnabled}
                    onChange={(codEnabled) => {
                      updateSettings({ codEnabled });
                      notify(
                        codEnabled ? "Cash on delivery is on" : "Cash on delivery is off",
                        codEnabled ? "success" : "info",
                        codEnabled ? "Shoppers can pick COD at checkout." : "Checkout now accepts UPI only.",
                      );
                    }}
                    label="Cash on delivery"
                  />
                  <Badge tone={settings.codEnabled ? "success" : "quiet"} dot>
                    {settings.codEnabled ? "Accepting" : "Off"}
                  </Badge>
                </div>

                <div className="a-grid a-grid--2">
                  <Input
                    label="Available above"
                    type="number"
                    prefix="₹"
                    value={settings.codMinimumOrder}
                    disabled={!settings.codEnabled}
                    onChange={(event) => updateSettings({ codMinimumOrder: Number(event.target.value) })}
                  />
                  <Input
                    label="UPI advance"
                    type="number"
                    prefix="%"
                    value={settings.codAdvancePercent}
                    disabled={!settings.codEnabled}
                    onChange={(event) =>
                      updateSettings({
                        codAdvancePercent: Math.max(0, Math.min(100, Number(event.target.value))),
                      })
                    }
                  />
                </div>

                <Input
                  label="COD handling fee"
                  type="number"
                  prefix="₹"
                  value={settings.codFee}
                  disabled={!settings.codEnabled}
                  onChange={(event) => updateSettings({ codFee: Number(event.target.value) })}
                />

                <p className="a-muted" style={{ fontSize: "0.74rem", lineHeight: 1.6 }}>
                  {settings.codEnabled
                    ? `Judged on product value, before delivery. On ${formatINR(settings.codMinimumOrder + 700)} of product the shopper pays about ${formatINR(Math.round(((settings.codMinimumOrder + 700 + settings.codFee) * settings.codAdvancePercent) / 100))} now by UPI and the balance to the courier.`
                    : "COD is hidden at checkout. Existing COD orders are unaffected."}
                </p>
              </div>

              <p className="a-muted" style={{ fontSize: "0.74rem", lineHeight: 1.6 }}>
                Cards and net banking were removed from checkout — MI TRENDS takes UPI and COD only.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "account" ? (
        <div className="a-split">
          <Card title="Your account" description="How you appear in the activity log.">
            <div className="a-stack">
              <div className="a-row" style={{ gap: 12 }}>
                <span className="admin-avatar" style={{ width: 46, height: 46, fontSize: "1rem" }}>
                  {user?.initials}
                </span>
                <span>
                  <strong style={{ fontSize: "0.92rem" }}>{user?.name}</strong>
                  <p className="a-muted" style={{ fontSize: "0.74rem" }}>
                    {user?.email}
                  </p>
                </span>
              </div>
              <div className="a-grid a-grid--2">
                <Input label="Display name" defaultValue={user?.name} />
                <Input label="Role" defaultValue={user?.role} disabled />
              </div>
              <Input label="Email" type="email" defaultValue={user?.email} />
              <p className="a-muted" style={{ fontSize: "0.74rem" }}>
                <UserRound size={13} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
                Password changes and two-factor setup need a real identity provider — wire this form to it when one exists.
              </p>
            </div>
          </Card>

          <Card title="Session" className="a-sticky">
            <div className="a-stack">
              <div className="a-row a-row--between">
                <span className="a-muted" style={{ fontSize: "0.78rem" }}>
                  Signed in as
                </span>
                <Badge tone="success" dot>
                  Active
                </Badge>
              </div>
              <p style={{ fontSize: "0.82rem" }}>{user?.email}</p>
              <p className="a-muted" style={{ fontSize: "0.73rem", lineHeight: 1.6 }}>
                Sessions are stored on this device only and clear when you sign out.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "data" ? (
        <Card title="Demo data" description="Everything in this panel is generated from the storefront catalogue.">
          <div className="a-stack">
            <dl className="a-meta-grid">
              <div>
                <dt>Products</dt>
                <dd>{products.length}</dd>
              </div>
              <div>
                <dt>Orders</dt>
                <dd>{orders.length}</dd>
              </div>
              <div>
                <dt>Storage</dt>
                <dd>This browser</dd>
              </div>
            </dl>
            <p className="a-muted" style={{ fontSize: "0.78rem", lineHeight: 1.65, maxWidth: "68ch" }}>
              Edits you make — products, stock, order statuses, coupons and banners — are saved to this browser so the
              panel behaves like a real back office. Resetting restores the generated data set and discards those edits.
            </p>
            <div>
              <Button variant="danger" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={14} aria-hidden="true" />
                Reset demo data
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data"
        message="Every edit you have made in this panel will be discarded and the generated data set restored."
        confirmLabel="Reset everything"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          notify("Demo data reset", "info");
          setConfirmReset(false);
        }}
      />
    </motion.div>
  );
}
