import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  PaginatedResponse,
  OverviewResponse,
  TimeSeriesResponse,
  RevenueTimeSeriesResponse,
  ByPhaseResponse,
  TopCustomersResponse,
  DeliveryPerformanceResponse,
  PaymentMethodsResponse,
  Customer,
  CustomerDetail,
  Shipment,
  TrackingEvent,
  PreAlert,
  Reception,
  Invoice,
  InvoiceDetail,
  Container,
  ContainerDetail,
  ContainerPackage,
  DgaLabel,
  DgaLabelItem,
  DgaStatsResponse,
  DeliveryOrder,
  DeliveryOrderDetail,
  Branch,
  Payment,
  CreditNote,
  PaymentListItem,
  CreditNoteItem,
  PostAlertItem,
  RateTable,
  RateTableDetail,
  RateTier,
  WebhookItem,
  NotificationTemplateItem,
  NotificationLogItem,
  EcommerceConnectionItem,
  BulkImportItem,
  BulkImportDetail,
  TenantSettings,
  ApiKeyItem,
} from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Analytics                                                         */
/* ------------------------------------------------------------------ */

export function useOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => api.get<OverviewResponse>("/v1/analytics/overview"),
  });
}

export function useShipmentTimeSeries(
  dateFrom: string,
  dateTo: string,
  period = "day",
) {
  return useQuery({
    queryKey: ["analytics", "shipments-ts", dateFrom, dateTo, period],
    queryFn: () =>
      api.get<TimeSeriesResponse>(
        `/v1/analytics/shipments/time-series?dateFrom=${dateFrom}&dateTo=${dateTo}&period=${period}`,
      ),
  });
}

export function useRevenueTimeSeries(
  dateFrom: string,
  dateTo: string,
  period = "day",
) {
  return useQuery({
    queryKey: ["analytics", "revenue-ts", dateFrom, dateTo, period],
    queryFn: () =>
      api.get<RevenueTimeSeriesResponse>(
        `/v1/analytics/revenue/time-series?dateFrom=${dateFrom}&dateTo=${dateTo}&period=${period}`,
      ),
  });
}

export function useShipmentsByPhase() {
  return useQuery({
    queryKey: ["analytics", "by-phase"],
    queryFn: () => api.get<ByPhaseResponse>("/v1/analytics/shipments/by-phase"),
  });
}

export function useTopCustomers(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["analytics", "top-customers", dateFrom, dateTo],
    queryFn: () =>
      api.get<TopCustomersResponse>(
        `/v1/analytics/customers/top?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      ),
  });
}

export function useDeliveryPerformance(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["analytics", "delivery-performance", dateFrom, dateTo],
    queryFn: async (): Promise<DeliveryPerformanceResponse> => {
      const raw = await api.get<{ data: { total: number; delivered: number; failed: number; successRate: number; avgDeliveryTimeHours: number } }>(
        `/v1/analytics/delivery-performance?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      );
      const d = raw.data;
      return {
        onTimeRate: d.successRate ?? 0,
        averageDeliveryDays: d.avgDeliveryTimeHours != null ? d.avgDeliveryTimeHours / 24 : 0,
        totalDelivered: d.delivered ?? 0,
        totalFailed: d.failed ?? 0,
      };
    },
  });
}

export function usePaymentMethods(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["analytics", "payment-methods", dateFrom, dateTo],
    queryFn: () =>
      api.get<PaymentMethodsResponse>(
        `/v1/analytics/payment-methods?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      ),
  });
}

/* ------------------------------------------------------------------ */
/*  Customers                                                         */
/* ------------------------------------------------------------------ */

export function useCustomers(page = 1, limit = 20, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["customers", page, limit, search],
    queryFn: () => api.get<PaginatedResponse<Customer>>(`/v1/customers?${params}`),
  });
}

export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => api.get<Customer>(`/v1/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) => api.post<Customer>("/v1/customers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Customer> & { id: string }) =>
      api.patch<Customer>(`/v1/customers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Shipments                                                         */
/* ------------------------------------------------------------------ */

export function useShipments(page = 1, limit = 20, search = "", phase = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (phase) params.set("phase", phase);
  return useQuery({
    queryKey: ["shipments", page, limit, search, phase],
    queryFn: () => api.get<PaginatedResponse<Shipment>>(`/v1/shipments?${params}`),
  });
}

export function useShipmentDetail(id: string) {
  return useQuery({
    queryKey: ["shipments", id],
    queryFn: () => api.get<Shipment>(`/v1/shipments/${id}`),
    enabled: !!id,
  });
}

export function useShipmentEvents(id: string) {
  return useQuery({
    queryKey: ["shipments", id, "events"],
    queryFn: () =>
      api.get<{ data: TrackingEvent[]; meta: unknown }>(`/v1/shipments/${id}/events`).then((r) => r.data),
    enabled: !!id,
  });
}

/* ------------------------------------------------------------------ */
/*  Pre-Alerts                                                        */
/* ------------------------------------------------------------------ */

export function usePreAlerts(page = 1, limit = 20, search = "", unlinkedOnly = false) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (unlinkedOnly) params.set("unlinked", "true");
  return useQuery({
    queryKey: ["pre-alerts", page, limit, search, unlinkedOnly],
    queryFn: () => api.get<PaginatedResponse<PreAlert>>(`/v1/pre-alerts?${params}`),
  });
}

export function useCreatePreAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PreAlert>) => api.post<PreAlert>("/v1/pre-alerts", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pre-alerts"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Receptions                                                        */
/* ------------------------------------------------------------------ */

export function useReceptions(page = 1, limit = 20, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["receptions", page, limit, search],
    queryFn: () => api.get<PaginatedResponse<Reception>>(`/v1/receptions?${params}`),
  });
}

export function useCreateReception() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Reception>) => api.post<Reception>("/v1/receptions", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receptions"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Invoices                                                          */
/* ------------------------------------------------------------------ */

export function useInvoices(page = 1, limit = 20, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["invoices", page, limit, search],
    queryFn: () => api.get<PaginatedResponse<Invoice>>(`/v1/invoices?${params}`),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Invoice>) => api.post<Invoice>("/v1/invoices", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Containers                                                        */
/* ------------------------------------------------------------------ */

export function useContainers(page = 1, limit = 20, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["containers", page, limit, search],
    queryFn: () => api.get<PaginatedResponse<Container>>(`/v1/containers?${params}`),
  });
}

export function useCreateContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Container>) => api.post<Container>("/v1/containers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["containers"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Delivery Orders                                                   */
/* ------------------------------------------------------------------ */

export function useDeliveryOrders(page = 1, limit = 20, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["delivery-orders", page, limit, search],
    queryFn: () => api.get<PaginatedResponse<DeliveryOrder>>(`/v1/delivery-orders?${params}`),
  });
}

export function useCreateDeliveryOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DeliveryOrder>) =>
      api.post<DeliveryOrder>("/v1/delivery-orders", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-orders"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Branches                                                          */
/* ------------------------------------------------------------------ */

export function useBranches(page = 1, limit = 20, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["branches", page, limit, search],
    queryFn: () => api.get<PaginatedResponse<Branch>>(`/v1/branches?${params}`),
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Branch>) => api.post<Branch>("/v1/branches", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Branch> & { id: string }) =>
      api.patch<Branch>(`/v1/branches/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/branches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Customer detail (extended)                                         */
/* ------------------------------------------------------------------ */

export function useCustomerDetailExtended(id: string) {
  return useQuery({
    queryKey: ["customers", id, "detail"],
    queryFn: () => api.get<CustomerDetail>(`/v1/customers/${id}`),
    enabled: !!id,
  });
}

export function useCustomerShipments(customerId: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), customerId });
  return useQuery({
    queryKey: ["shipments", "by-customer", customerId, page],
    queryFn: () => api.get<PaginatedResponse<Shipment>>(`/v1/shipments?${params}`),
    enabled: !!customerId,
  });
}

export function useCustomerPreAlerts(customerId: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), customerId });
  return useQuery({
    queryKey: ["pre-alerts", "by-customer", customerId, page],
    queryFn: () => api.get<PaginatedResponse<PreAlert>>(`/v1/pre-alerts?${params}`),
    enabled: !!customerId,
  });
}

export function useCustomerInvoices(customerId: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), customerId });
  return useQuery({
    queryKey: ["invoices", "by-customer", customerId, page],
    queryFn: () => api.get<PaginatedResponse<Invoice>>(`/v1/invoices?${params}`),
    enabled: !!customerId,
  });
}

export function useCustomerReceptions(customerId: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), customerId });
  return useQuery({
    queryKey: ["receptions", "by-customer", customerId, page],
    queryFn: () => api.get<PaginatedResponse<Reception>>(`/v1/receptions?${params}`),
    enabled: !!customerId,
  });
}

/* ------------------------------------------------------------------ */
/*  Invoice detail (extended)                                          */
/* ------------------------------------------------------------------ */

export function useInvoiceDetail(id: string) {
  return useQuery({
    queryKey: ["invoices", id, "detail"],
    queryFn: () => api.get<InvoiceDetail>(`/v1/invoices/${id}`),
    enabled: !!id,
  });
}

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: ["invoices", invoiceId, "payments"],
    queryFn: () => api.get<Payment[]>(`/v1/invoices/${invoiceId}/payments`),
    enabled: !!invoiceId,
  });
}

export function useInvoiceCreditNotes(invoiceId: string) {
  return useQuery({
    queryKey: ["invoices", invoiceId, "credit-notes"],
    queryFn: () => api.get<CreditNote[]>(`/v1/invoices/${invoiceId}/credit-notes`),
    enabled: !!invoiceId,
  });
}

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/v1/invoices/${id}/issue`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/v1/invoices/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Payments                                                           */
/* ------------------------------------------------------------------ */

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Payment> & { invoiceIds?: { invoiceId: string; amount: number }[] }) =>
      api.post<Payment>("/v1/payments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Container detail (extended)                                        */
/* ------------------------------------------------------------------ */

export function useContainerDetail(id: string) {
  return useQuery({
    queryKey: ["containers", id, "detail"],
    queryFn: () => api.get<ContainerDetail>(`/v1/containers/${id}`),
    enabled: !!id,
  });
}

export function useContainerPackages(containerId: string) {
  return useQuery({
    queryKey: ["containers", containerId, "packages"],
    queryFn: () => api.get<ContainerPackage[]>(`/v1/containers/${containerId}/packages`),
    enabled: !!containerId,
  });
}

export function useContainerDgaLabels(containerId: string) {
  return useQuery({
    queryKey: ["containers", containerId, "dga-labels"],
    queryFn: () => api.get<DgaLabel[]>(`/v1/containers/${containerId}/dga-labels`),
    enabled: !!containerId,
  });
}

export function useUpdateContainerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/v1/containers/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["containers"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Shipment creation + events                                         */
/* ------------------------------------------------------------------ */

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Shipment>) => api.post<Shipment>("/v1/shipments", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipments"] }),
  });
}

export function useAddShipmentEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      ...data
    }: {
      shipmentId: string;
      type: string;
      source: string;
      rawStatus?: string;
      location?: Record<string, any>;
      idempotencyKey?: string;
    }) => {
      const headers: Record<string, string> = {};
      if (data.idempotencyKey) {
        headers["Idempotency-Key"] = data.idempotencyKey;
      }
      return api.post<TrackingEvent>(`/v1/shipments/${shipmentId}/events`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipments"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Payments (list)                                                    */
/* ------------------------------------------------------------------ */

export function usePayments(page = 1, limit = 20, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  return useQuery({
    queryKey: ["payments", page, limit, dateFrom, dateTo],
    queryFn: () => api.get<PaginatedResponse<PaymentListItem>>(`/v1/payments?${params}`),
  });
}

/* ------------------------------------------------------------------ */
/*  Credit Notes (list)                                                */
/* ------------------------------------------------------------------ */

export function useCreditNotes(page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return useQuery({
    queryKey: ["credit-notes", page, limit],
    queryFn: () => api.get<PaginatedResponse<CreditNoteItem>>(`/v1/credit-notes?${params}`),
  });
}

/* ------------------------------------------------------------------ */
/*  Post-Alerts (list)                                                 */
/* ------------------------------------------------------------------ */

export function usePostAlerts(page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return useQuery({
    queryKey: ["post-alerts", page, limit],
    queryFn: () => api.get<PaginatedResponse<PostAlertItem>>(`/v1/post-alerts?${params}`),
  });
}

/* ------------------------------------------------------------------ */
/*  DGA Labels                                                         */
/* ------------------------------------------------------------------ */

export function useDgaLabels(page = 1, limit = 20, status?: string, containerId?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  if (containerId) params.set("containerId", containerId);
  return useQuery({
    queryKey: ["dga-labels", page, limit, status, containerId],
    queryFn: () => api.get<PaginatedResponse<DgaLabelItem>>(`/v1/dga/labels?${params}`),
  });
}

export function useDgaStats(containerId?: string) {
  const params = new URLSearchParams();
  if (containerId) params.set("containerId", containerId);
  return useQuery({
    queryKey: ["dga-stats", containerId],
    queryFn: () => api.get<DgaStatsResponse>(`/v1/dga/stats?${params}`),
  });
}

export function useGenerateDgaLabels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { containerId: string }) =>
      api.post("/v1/dga/labels/generate-for-container", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dga-labels"] });
      qc.invalidateQueries({ queryKey: ["dga-stats"] });
    },
  });
}

export function useBulkUpdateDgaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { labelIds: string[]; status: string }) =>
      api.post("/v1/dga/labels/bulk-status", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dga-labels"] });
      qc.invalidateQueries({ queryKey: ["dga-stats"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Rate Tables                                                        */
/* ------------------------------------------------------------------ */

export function useRateTables(page = 1, limit = 50) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return useQuery({
    queryKey: ["rate-tables", page, limit],
    queryFn: () => api.get<PaginatedResponse<RateTable>>(`/v1/rate-tables?${params}`),
  });
}

export function useRateTableDetail(id: string) {
  return useQuery({
    queryKey: ["rate-tables", id],
    queryFn: () => api.get<RateTableDetail>(`/v1/rate-tables/${id}`),
    enabled: !!id,
  });
}

export function useCreateRateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RateTable>) => api.post<RateTable>("/v1/rate-tables", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-tables"] }),
  });
}

export function useAddTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, ...data }: Partial<RateTier> & { tableId: string }) =>
      api.post<RateTier>(`/v1/rate-tables/${tableId}/tiers`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-tables"] }),
  });
}

export function useUpdateTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, tierId, ...data }: Partial<RateTier> & { tableId: string; tierId: string }) =>
      api.patch<RateTier>(`/v1/rate-tables/${tableId}/tiers/${tierId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-tables"] }),
  });
}

export function useDeleteTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, tierId }: { tableId: string; tierId: string }) =>
      api.delete(`/v1/rate-tables/${tableId}/tiers/${tierId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-tables"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Webhooks                                                           */
/* ------------------------------------------------------------------ */

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: () => api.get<WebhookItem[]>("/v1/webhooks"),
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string; events: string[] }) =>
      api.post<WebhookItem>("/v1/webhooks", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (id: string) => api.post<{ success: boolean }>(`/v1/webhooks/${id}/test`),
  });
}

export function useToggleWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/v1/webhooks/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/webhooks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Notification Templates                                             */
/* ------------------------------------------------------------------ */

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => api.get<NotificationTemplateItem[]>("/v1/notifications/templates"),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationTemplateItem>) =>
      api.post<NotificationTemplateItem>("/v1/notifications/templates", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-templates"] }),
  });
}

export function useToggleTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/v1/notifications/templates/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-templates"] }),
  });
}

export function useNotificationLogs(page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return useQuery({
    queryKey: ["notification-logs", page, limit],
    queryFn: () => api.get<PaginatedResponse<NotificationLogItem>>(`/v1/notifications/logs?${params}`),
  });
}

/* ------------------------------------------------------------------ */
/*  E-commerce Connections                                             */
/* ------------------------------------------------------------------ */

export function useEcommerceConnections() {
  return useQuery({
    queryKey: ["ecommerce"],
    queryFn: () => api.get<EcommerceConnectionItem[]>("/v1/ecommerce/connections"),
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { platform: string; shopDomain: string; webhookSecret?: string }) =>
      api.post<EcommerceConnectionItem>("/v1/ecommerce/connections", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ecommerce"] }),
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/ecommerce/connections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ecommerce"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Bulk Import                                                        */
/* ------------------------------------------------------------------ */

export function useBulkImports(page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return useQuery({
    queryKey: ["bulk-imports", page, limit],
    queryFn: () => api.get<PaginatedResponse<BulkImportItem>>(`/v1/bulk-import?${params}`),
  });
}

export function useBulkImportDetail(id: string) {
  return useQuery({
    queryKey: ["bulk-imports", id],
    queryFn: () => api.get<BulkImportDetail>(`/v1/bulk-import/${id}`),
    enabled: !!id,
  });
}

export function useStartImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; items: any[] }) =>
      api.post<BulkImportItem>(`/v1/bulk-import/${data.type.toLowerCase()}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bulk-imports"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Delivery Order detail + actions                                    */
/* ------------------------------------------------------------------ */

export function useDeliveryOrderDetail(id: string) {
  return useQuery({
    queryKey: ["delivery-orders", id, "detail"],
    queryFn: () => api.get<DeliveryOrderDetail>(`/v1/delivery-orders/${id}`),
    enabled: !!id,
  });
}

export function useAssignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; driverName: string; driverPhone?: string; driverVehicle?: string }) =>
      api.post(`/v1/delivery-orders/${id}/assign`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-orders"] }),
  });
}

export function useStartDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/v1/delivery-orders/${id}/start`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-orders"] }),
  });
}

export function useCompleteDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; signatureContact?: string; signatureIdType?: string; signatureId?: string; photoUrl?: string }) =>
      api.post(`/v1/delivery-orders/${id}/complete`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-orders"] }),
  });
}

export function useFailDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/v1/delivery-orders/${id}/fail`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-orders"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

export function useTenantSettings() {
  return useQuery({
    queryKey: ["settings", "tenant"],
    queryFn: () => api.get<TenantSettings>("/v1/settings/tenant"),
  });
}

export function useUpdateTenantSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TenantSettings>) =>
      api.patch<TenantSettings>("/v1/settings/tenant", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["settings", "api-keys"],
    queryFn: () => api.get<ApiKeyItem[]>("/v1/settings/api-keys"),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; role?: string }) =>
      api.post<ApiKeyItem>("/v1/settings/api-keys", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "api-keys"] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/v1/settings/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "api-keys"] }),
  });
}
