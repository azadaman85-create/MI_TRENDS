import { getProductsCollection } from "@/lib/db/models";
import type { OrderLine } from "@/lib/admin/types";

/**
 * Stock movement.
 *
 * Availability was checked when an order was priced, but nothing ever reduced the count —
 * so ten units could be sold a hundred times over and the panel would still read ten.
 *
 * **When stock moves.** It comes off when an order becomes real: a COD order at the
 * moment it is placed, a prepaid order at the moment its payment verifies. Deliberately
 * not at `create-order` for prepaid — that row is an abandoned checkout until it is paid,
 * and holding stock for every abandoned cart would starve the shop. It goes back when an
 * order is cancelled or a return is completed.
 *
 * **Why it can't oversell.** Each line is decremented with a condition that the units are
 * actually there, so two simultaneous orders for the last item cannot both succeed —
 * whichever write lands second matches nothing and is rejected.
 */

export type StockLine = Pick<OrderLine, "productId" | "size" | "quantity"> & { name?: string };

export type StockResult = { ok: true } | { ok: false; error: string };

/**
 * Takes stock for an order, all lines or none.
 *
 * MongoDB can only make one document's update atomic, and an order spans several
 * products. Rather than reach for a transaction, each line is decremented in turn and
 * any that succeeded are put back if a later one fails — the order is rejected either
 * way, so the only state that matters is that stock ends up where it started.
 */
export async function takeStock(lines: StockLine[]): Promise<StockResult> {
  const products = await getProductsCollection();
  const taken: StockLine[] = [];

  for (const line of lines) {
    const field = `stock.${line.size}`;
    const result = await products.updateOne(
      // The condition is the whole mechanism: it only matches while the units exist.
      { _id: Number(line.productId), [field]: { $gte: line.quantity } } as never,
      { $inc: { [field]: -line.quantity } } as never,
    );

    if (result.matchedCount === 0) {
      await giveBackStock(taken);
      const product = await products.findOne({ _id: Number(line.productId) } as never);
      const left = product?.stock?.[line.size] ?? 0;
      const name = line.name ?? product?.name ?? "That item";
      return {
        ok: false,
        error: left > 0
          ? `Only ${left} left of ${name} in size ${line.size}.`
          : `${name} (${line.size}) just sold out.`,
      };
    }
    taken.push(line);
  }

  await syncOutOfStock(lines);
  return { ok: true };
}

/** Puts stock back — a cancelled order, a completed return, or a rolled-back take. */
export async function giveBackStock(lines: StockLine[]): Promise<void> {
  if (lines.length === 0) return;
  const products = await getProductsCollection();
  for (const line of lines) {
    await products.updateOne(
      { _id: Number(line.productId) } as never,
      { $inc: { [`stock.${line.size}`]: line.quantity } } as never,
    );
  }
  await syncOutOfStock(lines);
}

/**
 * Keeps `outOfStock` agreeing with the counts.
 *
 * The storefront reads `outOfStock` to decide what can be bought, so a size that has just
 * hit zero has to appear there or it stays purchasable.
 */
async function syncOutOfStock(lines: StockLine[]): Promise<void> {
  const products = await getProductsCollection();
  const ids = [...new Set(lines.map((line) => Number(line.productId)))];

  for (const id of ids) {
    const product = await products.findOne({ _id: id } as never);
    if (!product) continue;
    const sold = product.sizes.filter((size) => (product.stock?.[size] ?? 0) <= 0);
    const current = [...product.outOfStock].sort().join(",");
    if (current !== [...sold].sort().join(",")) {
      await products.updateOne({ _id: id } as never, { $set: { outOfStock: sold } } as never);
    }
  }
}
