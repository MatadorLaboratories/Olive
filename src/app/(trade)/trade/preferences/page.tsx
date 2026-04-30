import { AddressBook } from "@/components/portal/AddressBook";
import { getVendorAddresses, getVendorContext } from "@/services/vendor";

export default async function TradePreferences() {
  const ctx = await getVendorContext();
  if (!ctx) return null;
  const addresses = await getVendorAddresses(ctx.id);

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-3">Saved details</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Venues and <span className="italic font-light">favourite people.</span>
        </h1>
        <p className="mt-3 text-olive-700/85 max-w-xl">
          Save the addresses, contacts and notes you reach for the most. They populate the
          delivery details when you start a new booking.
        </p>
      </header>

      <AddressBook initial={addresses} />
    </div>
  );
}
