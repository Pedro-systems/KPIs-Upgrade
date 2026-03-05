/**
 * Main App Component with React Router
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import {
  SummaryDashboard,
  AgentPerformance,
  DealsPage,
  CampaignsPage,
  CallCampaignsPage,
  CallAnalyticsPage,
  MailCampaignsPage,
  MailAnalyticsPage,
  TextAnalyticsPage,
  ExpensesPage
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Dashboard - Index Route */}
          <Route index element={<SummaryDashboard />} />
          
          {/* Agents Performance */}
          <Route path="agents" element={<AgentPerformance />} />
          
          {/* Deals */}
          <Route path="deals" element={<DealsPage />} />
          
          {/* SMS/Text Campaigns */}
          <Route path="sms" element={<CampaignsPage />} />
          <Route path="sms/analytics" element={<TextAnalyticsPage />} />
          
          {/* Cold Calling */}
          <Route path="calls" element={<CallCampaignsPage />} />
          <Route path="calls/analytics" element={<CallAnalyticsPage />} />
          
          {/* Direct Mail */}
          <Route path="mail" element={<MailCampaignsPage />} />
          <Route path="mail/analytics" element={<MailAnalyticsPage />} />
          
          {/* Expenses */}
          <Route path="expenses" element={<ExpensesPage />} />
          
          {/* 404 - Redirect to Dashboard */}
          <Route path="*" element={<SummaryDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
