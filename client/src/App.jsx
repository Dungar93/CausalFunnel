import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import FunnelPage from './pages/FunnelPage';
import LiveFeedPage from './pages/LiveFeedPage';
import SessionsPage from './pages/SessionsPage';
import HeatmapPage from './pages/HeatmapPage';
import DemoEmbedPage from './pages/DemoEmbedPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="funnel" element={<FunnelPage />} />
          <Route path="live" element={<LiveFeedPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="heatmap" element={<HeatmapPage />} />
          <Route path="demo-store" element={<DemoEmbedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
