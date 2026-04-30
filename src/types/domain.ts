/**
 * Hand-authored domain types.
 *
 * These mirror the database schema but live alongside the application as
 * the canonical app-side shape. Server / client code references these,
 * not the raw `Database` type — keeping query shape decoupled from rows.
 */

// ---------- Identity ----------
export type UserRole = "client" | "vendor" | "staff" | "admin";

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string | null;
  businessName: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export type VendorStatus = "applied" | "in_review" | "approved" | "suspended" | "rejected";

export interface VendorProfile {
  id: string;
  status: VendorStatus;
  vendorType: string | null;
  region: string | null;
  discountPct: number;
  discountTier: string | null;
  approvedAt: string | null;
}

// ---------- Catalogue ----------
export type ProductKind = "hire" | "retail" | "both";
export type ProductStatus = "draft" | "active" | "archived";

export interface Product {
  id: string;
  slug: string;
  kind: ProductKind;
  status: ProductStatus;
  name: string;
  category: string | null;
  fabric: string | null;
  colour: string | null;
  size: string | null;
  description: string | null;
  shortDescription: string | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  hirePriceCents: number | null;
  retailPriceCents: number | null;
  replacementCostCents: number | null;
  displayOrder: number;
}

export interface InventoryItem {
  productId: string;
  totalQty: number;
  damagedQty: number;
  lostQty: number;
  retiredQty: number;
  stocktakeAt: string | null;
  stocktakeNotes: string | null;
}

// ---------- Bookings ----------
export type BookingStatus =
  | "enquiry"
  | "quoted"
  | "deposit_pending"
  | "confirmed"
  | "final_pending"
  | "final_paid"
  | "packed"
  | "delivered"
  | "returned"
  | "completed"
  | "cancelled"
  | "archived";

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  clientId: string | null;
  vendorId: string | null;
  clientFullName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  eventDate: string;
  deliveryDate: string;
  returnDate: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryRegion: string | null;
  deliveryWindow: string | null;
  collectionWindow: string | null;
  onSiteContact: string | null;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  depositDueCents: number;
  depositPaidCents: number;
  finalDueCents: number;
  finalPaidCents: number;
  finalDueDate: string | null;
  cutoffLocked: boolean;
  adminOverride: boolean;
  notesInternal: string | null;
  notesClient: string | null;
  timelineUrl: string | null;
  source: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

export interface BookingItem {
  id: string;
  bookingId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  notes: string | null;
}

// ---------- Payments ----------
export type PaymentKind = "deposit" | "final" | "adjustment" | "refund";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Payment {
  id: string;
  bookingId: string | null;
  customOrderId: string | null;
  kind: PaymentKind;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  stripePaymentIntent: string | null;
  paidAt: string | null;
}

// ---------- Custom orders ----------
export type CustomOrderStatus =
  | "new_request"
  | "awaiting_quote"
  | "quote_sent"
  | "deposit_paid"
  | "in_production"
  | "ready"
  | "completed"
  | "cancelled";

export interface CustomOrder {
  id: string;
  reference: string;
  status: CustomOrderStatus;
  customerType: string | null;
  businessName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  fabric: string | null;
  edgeStyle: string | null;
  colour: string | null;
  quantityTier: string | null;
  quantity: number | null;
  preferredDeadline: string | null;
  brandNotes: string | null;
  logoUrl: string | null;
  inspirationUrls: string[];
  quoteTotalCents: number | null;
  paymentSetting: "quote_only" | "deposit" | "full_payment" | null;
  createdAt: string;
}

// ---------- Misc ----------
export interface Testimonial {
  id: string;
  quote: string;
  attribution: string;
  role: string | null;
  event: string | null;
  imageUrl: string | null;
}

export interface PortfolioItem {
  id: string;
  slug: string;
  title: string;
  venue: string | null;
  eventDate: string | null;
  coverUrl: string | null;
  galleryUrls: string[];
  shortDescription: string | null;
  bodyMd: string | null;
  vendors: string[];
  published: boolean;
}
