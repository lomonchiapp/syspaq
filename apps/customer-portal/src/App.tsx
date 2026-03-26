import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ShipmentDetail = lazy(() => import("@/pages/ShipmentDetail"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
        <Routes>
          <Route path="/:slug/login" element={<Login />} />
          <Route path="/:slug/dashboard" element={<Dashboard />} />
          <Route path="/:slug/shipments/:id" element={<ShipmentDetail />} />
          <Route path="/:slug" element={<Navigate to="login" replace />} />
          <Route path="/" element={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-sm opacity-40">portal.syspaq.com</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
