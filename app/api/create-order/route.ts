import { NextResponse } from "next/server";
import { razorpayClient } from "@/lib/razorpay";

const MIN_AMOUNT_PAISE = 100;

export async function POST(request: Request) {
  let body: { amount?: unknown; currency?: unknown; receipt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const amount = Number(body.amount);
  const currency = typeof body.currency === "string" && body.currency ? body.currency : "INR";
  const receipt = typeof body.receipt === "string" && body.receipt ? body.receipt : `receipt_${Date.now()}`;

  if (!Number.isFinite(amount) || amount < MIN_AMOUNT_PAISE) {
    return NextResponse.json({ error: `Amount must be at least ${MIN_AMOUNT_PAISE} paise.` }, { status: 400 });
  }

  try {
    const razorpay = razorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
    });
    return NextResponse.json({ order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 401) {
      return NextResponse.json({ error: "Razorpay authentication failed." }, { status: 401 });
    }
    return NextResponse.json({ error: "Could not create the Razorpay order." }, { status: 500 });
  }
}
