import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/marketing/PlaceholderPage";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your hire and shop selections.",
};

export default function CartPage() {
  return (
    <PlaceholderPage
      eyebrow="Cart · Phase 2"
      title={
        <>
          A quiet cart, <span className="italic font-light">for now.</span>
        </>
      }
      body={
        <>
          Once the booking flow and shop are wired through Stripe, your hire selections
          and retail items will live here together — with a clear path to deposit or
          full payment.
        </>
      }
      primaryCta={{ label: "Start a hire", href: "/hire" }}
      secondaryCta={{ label: "Browse the shop", href: "/shop" }}
      phase="Phase 2 · Booking flow & cart"
    />
  );
}
