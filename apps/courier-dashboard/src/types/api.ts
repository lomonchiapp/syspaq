/* ------------------------------------------------------------------ */
/*  Shared API response types                                         */
/* ------------------------------------------------------------------ */

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/overview                                        */
/* ------------------------------------------------------------------ */

export interface OverviewResponse {
  shipments: {
    total: number;
    byPhase: Record<string, number>;
    createdToday: number;
    deliveredToday: number;
  };
  customers: {
    total: number;
    active: number;
    newThisPeriod: number;
  };
  financial: {
    totalInvoiced: number;
    totalCollected: number;
    outstandingBalance: number;
    overdueCount: number;
  };
  receptions: {
    totalToday: number;
    pendingPickup: number;
  };
  preAlerts: {
    pending: number;
    unmatched: number;
  };
  containers: {
    open: number;
    inTransit: number;
    inCustoms: number;
  };
  deliveryOrders: {
    pendingToday: number;
    inTransitNow: number;
    deliveredToday: number;
    failedToday: number;
  };
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/shipments/time-series                           */
/* ------------------------------------------------------------------ */

export interface TimeSeriesResponse {
  data: Array<{ date: string; created: number; delivered: number }>;
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/revenue/time-series                             */
/* ------------------------------------------------------------------ */

export interface RevenueTimeSeriesResponse {
  data: Array<{ date: string; invoiced: number; collected: number }>;
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/shipments/by-phase                              */
/* ------------------------------------------------------------------ */

export interface ByPhaseResponse {
  data: Array<{ phase: string; count: number }>;
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/customers/top                                   */
/* ------------------------------------------------------------------ */

export interface TopCustomersResponse {
  data: Array<{
    customerId: string;
    customerName: string;
    casillero: string;
    shipmentCount: number;
    totalSpent: number;
  }>;
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/delivery-performance                            */
/* ------------------------------------------------------------------ */

export interface DeliveryPerformanceResponse {
  onTimeRate: number;
  averageDeliveryDays: number;
  totalDelivered: number;
  totalFailed: number;
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/payments/by-method                              */
/* ------------------------------------------------------------------ */

export interface PaymentMethodsResponse {
  data: Array<{ method: string; total: number; count: number }>;
}

/* ------------------------------------------------------------------ */
/*  Core domain models                                                */
/* ------------------------------------------------------------------ */

export interface Customer {
  id: string;
  casillero: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  idType?: string;
  idNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  reference?: string;
  currentPhase: string;
  customerId?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  eventCount?: number;
}

export interface TrackingEvent {
  id: string;
  type: string;
  source: string;
  rawStatus?: string;
  location?: Record<string, any>;
  occurredAt: string;
  payload: Record<string, any>;
}

export interface PreAlert {
  id: string;
  trackingNumber: string;
  carrier?: string;
  store?: string;
  description?: string;
  estimatedValue?: number;
  currency: string;
  status: string;
  shipmentId?: string;
  customerId: string;
  createdAt: string;
}

export interface Reception {
  id: string;
  shipmentId: string;
  branchId: string;
  customerId?: string;
  weightLbs?: number;
  volumetricWeight?: number;
  totalCharge: number;
  currency: string;
  status: string;
  receivedAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  status: string;
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balance: number;
  issuedAt?: string;
  dueAt?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
}

export interface Container {
  id: string;
  number: string;
  type: string;
  mode: string;
  status: string;
  carrier?: string;
  totalPieces: number;
  totalWeightLbs?: number;
  createdAt: string;
}

export interface DeliveryOrder {
  id: string;
  number: string;
  shipmentId: string;
  customerId?: string;
  deliveryType: string;
  status: string;
  driverName?: string;
  scheduledAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Invoice line item                                                  */
/* ------------------------------------------------------------------ */

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
  total: number;
}

/* ------------------------------------------------------------------ */
/*  Invoice detail (extended)                                          */
/* ------------------------------------------------------------------ */

export interface InvoiceDetail extends Invoice {
  lineItems: InvoiceLineItem[];
  fiscalType?: string;
  customerName?: string;
  customerCasillero?: string;
}

/* ------------------------------------------------------------------ */
/*  Payment                                                            */
/* ------------------------------------------------------------------ */

export interface Payment {
  id: string;
  method: string;
  amount: number;
  currency: string;
  reference?: string;
  bankName?: string;
  notes?: string;
  invoiceId?: string;
  customerId?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Credit Note                                                        */
/* ------------------------------------------------------------------ */

export interface CreditNote {
  id: string;
  number: string;
  invoiceId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Container detail (extended)                                        */
/* ------------------------------------------------------------------ */

export interface ContainerDetail extends Container {
  vessel?: string;
  voyage?: string;
  blNumber?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  closedAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Container package (shipment inside a container)                    */
/* ------------------------------------------------------------------ */

export interface ContainerPackage {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  customerName?: string;
  customerId?: string;
  weightLbs?: number;
  description?: string;
}

/* ------------------------------------------------------------------ */
/*  DGA Label                                                          */
/* ------------------------------------------------------------------ */

export interface DgaLabel {
  id: string;
  containerId: string;
  status: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  DGA Label (extended for list)                                      */
/* ------------------------------------------------------------------ */

export interface DgaLabelItem {
  id!: string;
  trackingNumber!: string;
  consigneeName!: string;
  description!: string;
  weightLbs!: number;
  fobValue!: number;
  totalTaxes?: number;
  taxExempt!: boolean;
  status!: string;
  containerId?: string;
}

/* ------------------------------------------------------------------ */
/*  DGA Stats                                                          */
/* ------------------------------------------------------------------ */

export interface DgaStatsResponse {
  data: {
    totalLabels: number;
    byStatus: Record<string, number>;
    totalFobValue: number;
    totalTaxes: number;
    taxExemptCount: number;
    avgProcessingDays: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Payment list item                                                  */
/* ------------------------------------------------------------------ */

export interface PaymentListItem {
  id!: string;
  method!: string;
  amount!: number;
  currency!: string;
  reference?: string;
  customerId?: string;
  customerName?: string;
  paidAt!: string;
}

/* ------------------------------------------------------------------ */
/*  Credit Note item                                                   */
/* ------------------------------------------------------------------ */

export interface CreditNoteItem {
  id!: string;
  number!: string;
  invoiceId!: string;
  reason!: string;
  amount!: number;
  status!: string;
  createdAt!: string;
}

/* ------------------------------------------------------------------ */
/*  Post-Alert item                                                    */
/* ------------------------------------------------------------------ */

export interface PostAlertItem {
  id!: string;
  trackingNumber!: string;
  recipientName?: string;
  senderName?: string;
  carrier?: string;
  fob?: number;
  currency!: string;
  content?: string;
  createdAt!: string;
}

/* ------------------------------------------------------------------ */
/*  Rate Tables                                                        */
/* ------------------------------------------------------------------ */

export interface RateTable {
  id!: string;
  name!: string;
  originZone?: string;
  destZone?: string;
  isDefault!: boolean;
  isActive!: boolean;
}

export interface RateTier {
  id!: string;
  minWeight!: number;
  maxWeight!: number;
  pricePerLb!: number;
  flatFee!: number;
  currency!: string;
}

export interface RateTableDetail extends RateTable {
  tiers!: RateTier[];
}

/* ------------------------------------------------------------------ */
/*  Webhooks                                                           */
/* ------------------------------------------------------------------ */

export interface WebhookItem {
  id!: string;
  url!: string;
  events!: string[];
  secret!: string;
  isActive!: boolean;
  createdAt!: string;
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                      */
/* ------------------------------------------------------------------ */

export interface NotificationTemplateItem {
  id!: string;
  event!: string;
  channel!: string;
  subject?: string;
  body!: string;
  isActive!: boolean;
}

export interface NotificationLogItem {
  id!: string;
  channel!: string;
  recipient!: string;
  event!: string;
  subject?: string;
  status!: string;
  sentAt?: string;
  createdAt!: string;
}

/* ------------------------------------------------------------------ */
/*  E-commerce                                                         */
/* ------------------------------------------------------------------ */

export interface EcommerceConnectionItem {
  id!: string;
  platform!: string;
  shopDomain!: string;
  isActive!: boolean;
  createdAt!: string;
}

/* ------------------------------------------------------------------ */
/*  Bulk Import                                                        */
/* ------------------------------------------------------------------ */

export interface BulkImportItem {
  id!: string;
  type!: string;
  status!: string;
  totalRows!: number;
  processed!: number;
  succeeded!: number;
  failed!: number;
  createdAt!: string;
}

export interface BulkImportDetail extends BulkImportItem {
  errors!: Array<{ row: number; error: string }>;
  fileName?: string;
  startedAt?: string;
  completedAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Delivery Order detail                                              */
/* ------------------------------------------------------------------ */

export interface DeliveryOrderDetail {
  id!: string;
  number!: string;
  shipmentId!: string;
  customerId?: string;
  deliveryType!: string;
  status!: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  deliveryAddress?: Record<string, any>;
  deliveryCoords?: Record<string, any>;
  scheduledAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  signatureUrl?: string;
  signatureContact?: string;
  signatureIdType?: string;
  signatureId?: string;
  photoUrl?: string;
  failReason?: string;
  notes?: string;
  createdAt!: string;
}

/* ------------------------------------------------------------------ */
/*  Tenant Settings                                                    */
/* ------------------------------------------------------------------ */

export interface TenantSettings {
  tenantName: string;
  slug: string;
  casilleroPrefix: string;
  casilleroCounter: number;
  stripeConfigured: boolean;
  paypalConfigured: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  portalCompanyName?: string | null;
  portalLogo?: string | null;
  portalPrimaryColor?: string | null;
  portalBgImage?: string | null;
  portalWelcomeText?: string | null;
}

export interface ApiKeyItem {
  id: string;
  prefix: string;
  name: string;
  role: string;
  lastUsedAt?: string;
  createdAt: string;
  rawKey?: string; // only present immediately after creation
}

/* ------------------------------------------------------------------ */
/*  Customer detail (extended)                                         */
/* ------------------------------------------------------------------ */

export interface CustomerDetail extends Customer {
  address?: string;
  balance?: number;
  shipmentCount?: number;
  preAlertCount?: number;
  invoiceCount?: number;
  receptionCount?: number;
}
