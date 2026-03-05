/**
 * Layout Component - Sidebar Navigation
 */

import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';

const navSections = [
  {
    title: 'Overview',
    items: [
      { path: '/', name: 'Dashboard', icon: '📊', exact: true },
      { path: '/agents', name: 'Agentes', icon: '👥' },
    ]
  },
  {
    title: 'Deals',
    items: [
      { path: '/deals', name: 'Deals', icon: '💰' },
    ]
  },
  {
    title: 'SMS/Text',
    items: [
      { path: '/sms', name: 'Campaigns', icon: '📱' },
      { path: '/sms/analytics', name: 'Analytics', icon: '📈' },
    ]
  },
  {
    title: 'Cold Calling',
    items: [
      { path: '/calls', name: 'Campaigns', icon: '📞' },
      { path: '/calls/analytics', name: 'Analytics', icon: '📈' },
    ]
  },
  {
    title: 'Direct Mail',
    items: [
      { path: '/mail', name: 'Campaigns', icon: '✉️' },
      { path: '/mail/analytics', name: 'Analytics', icon: '📊' },
    ]
  },
  {
    title: 'Finance',
    items: [
      { path: '/expenses', name: 'Expenses', icon: '💳' },
    ]
  },
];

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white flex flex-col transition-all duration-300 fixed h-full z-40`}>
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-white">
              📊 KPI Manager
            </h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!sidebarCollapsed && (
                <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h2>
              )}
              <div className="space-y-1 px-2">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) => `
                      flex items-center px-3 py-2.5 rounded-lg transition-all duration-150
                      ${isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              © {new Date().getFullYear()} KPI Manager
            </p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Data Management Dashboard
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
