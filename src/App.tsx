import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Overview } from './pages/Overview';
import { Prediction } from './pages/Prediction';
import { Comparison } from './pages/Comparison';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { ApiStatus, HistoryRecord, PredictionFormValues } from './types';
import { checkApiHealth } from './services/api';
import { getPredictionHistory } from './services/history';

export function DashboardApp() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loadedInspectionValues, setLoadedInspectionValues] = useState<PredictionFormValues | null>(null);

  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    online: false,
    checking: true,
  });

  // Load history from localStorage
  const refreshHistory = useCallback(() => {
    const records = getPredictionHistory();
    setHistory(records);
  }, []);

  // Check API health
  const refreshApi = useCallback(async () => {
    setApiStatus((prev) => ({ ...prev, checking: true }));
    try {
      const { data, latencyMs } = await checkApiHealth();
      setApiStatus({
        online: true,
        checking: false,
        latencyMs,
        data,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setApiStatus({
        online: false,
        checking: false,
        error: err.message || 'Failed to connect to backend',
        lastChecked: new Date().toLocaleTimeString(),
      });
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshHistory();
    refreshApi();

    // Check backend health periodically (every 30 seconds)
    const interval = setInterval(refreshApi, 30000);
    return () => clearInterval(interval);
  }, [refreshHistory, refreshApi]);

  // Handler when user clicks "Reload" on a past record
  const handleSelectRecordForInspection = (record: HistoryRecord) => {
    setLoadedInspectionValues({
      modelChoice: record.result.model_choice,
      machineType: record.inputs.Type,
      rotationalSpeed: record.inputs['Rotational speed [rpm]'],
      airTemperature: record.inputs['Air temperature [K]'],
      processTemperature: record.inputs['Process temperature [K]'],
      torque: record.inputs['Torque [Nm]'],
      toolWear: record.inputs['Tool wear [min]'],
    });
    setCurrentTab('prediction');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#060913] text-slate-900 dark:text-slate-100 antialiased font-sans cyber-grid transition-colors duration-200">
      {/* Desktop / Collapsible Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          apiStatus={apiStatus}
        />
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85%] flex flex-col bg-white dark:bg-[#080d19] z-50 shadow-2xl">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              isCollapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              apiStatus={apiStatus}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          apiStatus={apiStatus}
          onRefreshApi={refreshApi}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {currentTab === 'overview' && (
            <Overview
              apiStatus={apiStatus}
              history={history}
              onNavigate={(tab) => setCurrentTab(tab)}
              onSelectRecordForInspection={handleSelectRecordForInspection}
            />
          )}

          {currentTab === 'prediction' && (
            <Prediction
              onPredictionCompleted={refreshHistory}
              initialValues={loadedInspectionValues}
            />
          )}

          {currentTab === 'benchmark' && <Comparison history={history} />}

          {currentTab === 'history' && (
            <History
              history={history}
              onRefreshHistory={refreshHistory}
              onNavigate={(tab) => setCurrentTab(tab)}
              onSelectRecordForInspection={handleSelectRecordForInspection}
            />
          )}

          {currentTab === 'settings' && (
            <Settings apiStatus={apiStatus} onRefreshApi={refreshApi} />
          )}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <DashboardApp />
    </ThemeProvider>
  );
}

export default App;
