import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCustomOrderForCurrentUser } from "@/services/custom-orders-read";
import { CustomOrderPay } from "@/components/account/CustomOrderPay";
import { formatMoney } from "@/lib/format";

type Params = { reference: string };
type Search = { mode?: string };

/**
 * Custom-order payment page — deposit-vs-full picker, then Stripe.
 *
 * Server entry: validates the order belongs to the viewer, hands the
 * relevant fields to a client `CustomOrderPay` component which manages the
 * mode toggle + intent open + Stripe Element mount.
 *
 * `?mode=deposit|full` lets us deep-link from the builder outcome screen
 * straight into a pre-selected option, so a customer who tapped "Pay
 * deposit" on the builder lands on this page with the right tile lit and
 * goes straight into Stripe on confirm.
 */
export default async function CustomOrderPayPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ reference }, sp] = await Promise.all([params, searchParams]);
  const order = await getCustomOrderForCurrentUser(reference);
  if (!order) notFound();

  const initialMode: "deposit" | "full" | undefined =
    sp.mode === "deposit" ? "deposit" : sp.mode === "full" ? "full" : undefined;

  const quote = order.quoteTotalCents ?? 0;
  const totalPaid = order.totalPaidCents ?? 0;
  const outstanding = Math.max(0, quote - totalPaid);

  // The detail page guards entry to this route, but render a graceful
  // fallback for direct navigations to nonsensical states.
  if (quote <= 0) {
    return (
      <UnpayableShell reference={reference}>
        We haven't sent your written quote yet. Once it lands, you'll be able
        to approve it and pay from this screen.
      </UnpayableShell>
    );
  }
  if (outstanding <= 0) {
    return (
      <UnpayableShell reference={reference}>
        This order is fully paid — thank you. We'll be in touch the week
        before despatch.
      </UnpayableShell>
    );
  }
  if (["cancelled", "completed"].includes(order.status)) {
    return (
      <UnpayableShell reference={reference}>
        This order is no longer accepting payments.
      </UnpayableShell>
    );
  }

  // The deposit mode is meaningful only when the customer hasn't already
  // hit the deposit threshold (50% of the quote). Otherwise collapse to
  // full-balance mode in the picker.
  const depositTarget = Math.round(quote * 0.5);
  const depositRemaining = Math.max(0, depositTarget - (order.depositPaidCents ?? 0));
  const depositAvailable = depositRemaining > 0 && depositRemaining < outstanding;

  return (
    <div className="space-y-10 max-w-3xl">
      <Link
        href={`/account/custom-orders/${order.reference}`}
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Order detail
      </Link>

      <header>
        <p className="eyebrow mb-3">Custom order · {order.reference}</p>
        <h1 className="font-display text-display-lg text-olive-900 leading-[1]">
          Approve & <span className="italic font-light">pay.</span>
        </h1>
        <p className="mt-4 text-olive-800/80 text-lg max-w-xl">
          Quote total <span className="tabular text-olive-900">{formatMoney(quote)}</span>
          {totalPaid > 0 && (
            <>
              {" "}· paid{" "}
              <span className="tabular text-olive-900">{formatMoney(totalPaid)}</span>
            </>
          )}
          {" "}· outstanding{" "}
          <span className="tabular text-clay-600">{formatMoney(outstanding)}</span>.
        </p>
      </header>

      <CustomOrderPay
        reference={order.reference}
        outstandingCents={outstanding}
        depositRemainingCents={depositRemaining}
        depositAvailable={depositAvailable}
        initialMode={initialMode}
      />
    </div>
  );
}

function UnpayableShell({
  reference,
  children,
}: {
  reference: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8 max-w-2xl">
      <Link
        href={`/account/custom-orders/${reference}`}
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Order detail
      </Link>
      <div className="card p-10 text-center">
        <p className="font-display text-2xl text-olive-900 italic font-light leading-snug">
          {children}
        </p>
      </div>
    </div>
  );
}
