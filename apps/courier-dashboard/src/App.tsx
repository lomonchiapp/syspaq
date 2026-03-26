import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ToastProvider } from "@/components/ui/toast";

const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const DemoPage = lazy(() => import("@/pages/demo"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const CustomersPage = lazy(() => import("@/pages/customers"));
const CustomerDetailPage = lazy(() => import("@/pages/customers/[id]"));
const ShipmentsPage = lazy(() => import("@/pages/shipments"));
const ShipmentDetailPage = lazy(() => import("@/pages/shipments/[id]"));
const PreAlertsPage = lazy(() => import("@/pages/pre-alerts"));
const ReceptionsPage = lazy(() => import("@/pages/receptions"));
const PostAlertsPage = lazy(() => import("@/pages/post-alerts"));
const ContainersPage = lazy(() => import("@/pages/containers"));
const ContainerDetailPage = lazy(() => import("@/pages/containers/[id]"));
const DgaPage = lazy(() => import("@/pages/dga"));
const DeliveryOrdersPage = lazy(() => import("@/pages/delivery-orders"));
const InvoicesPage = lazy(() => import("@/pages/invoices"));
const InvoiceDetailPage = lazy(() => import("@/pages/invoices/[id]"));
const PaymentsPage = lazy(() => import("@/pages/payments"));
const CreditNotesPage = lazy(() => import("@/pages/credit-notes"));
const BranchesPage = lazy(() => import("@/pages/branches"));
const RateTablesPage = lazy(() => import("@/pages/rate-tables"));
const RateTableDetailPage = lazy(() => import("@/pages/rate-tables/[id]"));
const DeliveryOrderDetailPage = lazy(() => import("@/pages/delivery-orders/[id]"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));
const WebhooksPage = lazy(() => import("@/pages/webhooks"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const EcommercePage = lazy(() => import("@/pages/ecommerce"));
const BulkImportPage = lazy(() => import("@/pages/bulk-import"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const CajaChicaPage = lazy(() => import("@/pages/caja-chica"));
const CajaChicaDetailPage = lazy(() => import("@/pages/caja-chica/[id]"));
const AdminPage = lazy(() => import("@/pages/admin"));
const AdminTenantDetailPage = lazy(() => import("@/pages/admin/tenants/[id]"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="shipments" element={<ShipmentsPage />} />
              <Route path="shipments/:id" element={<ShipmentDetailPage />} />
              <Route path="pre-alerts" element={<PreAlertsPage />} />
              <Route path="receptions" element={<ReceptionsPage />} />
              <Route path="post-alerts" element={<PostAlertsPage />} />
              <Route path="containers" element={<ContainersPage />} />
              <Route path="containers/:id" element={<ContainerDetailPage />} />
              <Route path="dga" element={<DgaPage />} />
              <Route path="delivery-orders" element={<DeliveryOrdersPage />} />
              <Route path="delivery-orders/:id" element={<DeliveryOrderDetailPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="credit-notes" element={<CreditNotesPage />} />
              <Route path="caja-chica" element={<CajaChicaPage />} />
              <Route path="caja-chica/:id" element={<CajaChicaDetailPage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="rate-tables" element={<RateTablesPage />} />
              <Route path="rate-tables/:id" element={<RateTableDetailPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="webhooks" element={<WebhooksPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="ecommerce" element={<EcommercePage />} />
              <Route path="bulk-import" element={<BulkImportPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/tenants/:id" element={<AdminTenantDetailPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
