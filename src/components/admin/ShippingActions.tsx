import { Truck, Send } from "lucide-react";

/**
 * Shipping link-outs for the admin booking detail.
 *
 * Phase 4a: pre-fills NZ Post and GoSweetSpot search with the booking's
 * delivery address. Phase 4b will swap to direct API integrations for
 * one-click label printing.
 */
export function ShippingActions({
  reference,
  address,
  city,
}: {
  reference: string;
  address: string | null;
  city: string | null;
}) {
  const fullAddress = [address, city].filter(Boolean).join(", ");
  const nzPostUrl = `https://www.nzpost.co.nz/tools/sending-tool?destination=${encodeURIComponent(fullAddress)}`;
  const gssUrl = `https://app.gosweetspot.com/orders/new?reference=${encodeURIComponent(reference)}&deliveryAddress=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="card p-7">
      <p className="eyebrow text-clay-500 mb-4">Shipping</p>
      <p className="text-sm text-olive-700 leading-relaxed mb-5">
        Open a parcel for this booking in NZ Post or GoSweetSpot — we pre-fill the address.
        Direct label printing arrives in Phase 4b.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={nzPostUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary !py-2.5 !text-[12px]"
        >
          <Truck className="h-3.5 w-3.5" strokeWidth={1.5} />
          NZ Post
        </a>
        <a
          href={gssUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary !py-2.5 !text-[12px]"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          GoSweetSpot
        </a>
      </div>
    </div>
  );
}
