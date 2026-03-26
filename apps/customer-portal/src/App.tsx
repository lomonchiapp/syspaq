import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ShipmentDetail = lazy(() => import("@/pages/ShipmentDetail"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
        <Routes>
          {/* Subdomain-based (new): cargord.portal.syspaq.com/login */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipments/:id" element={<ShipmentDetail />} />

          {/* Path-based (legacy): portal.syspaq.com/cargord/login */}
          <Route path="/:slug/login" element={<Login />} />
          <Route path="/:slug/register" element={<Register />} />
          <Route path="/:slug/dashboard" element={<Dashboard />} />
          <Route path="/:slug/shipments/:id" element={<ShipmentDetail />} />
          <Route path="/:slug" element={<Navigate to="login" replace />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
