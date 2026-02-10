import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { OrderHealthChart } from '@/components/dashboard/OrderHealthChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { NeedsAttentionTable } from '@/components/dashboard/NeedsAttentionTable';
import { LabelsNeedingAttentionTable } from '@/components/dashboard/LabelsNeedingAttentionTable';
import { WebProjectsTable } from '@/components/dashboard/WebProjectsTable';
import { CommissionsTable } from '@/components/dashboard/CommissionsTable';
import { TopCustomers } from '@/components/dashboard/TopCustomers';
import { OutstandingDetailsDialog } from '@/components/dashboard/OutstandingDetailsDialog';
import { ActiveOrdersDialog } from '@/components/dashboard/ActiveOrdersDialog';
import { ActiveCustomersDialog } from '@/components/dashboard/ActiveCustomersDialog';
import { RevenueDetailsDialog } from '@/components/dashboard/RevenueDetailsDialog';
import { CommissionsDetailsDialog } from '@/components/dashboard/CommissionsDetailsDialog';
import { ActiveProjectsDialog } from '@/components/dashboard/ActiveProjectsDialog';
import { ExpectedCashFlowDialog } from '@/components/dashboard/ExpectedCashFlowDialog';
import { OrderHealthDialog } from '@/components/dashboard/OrderHealthDialog';
import { OnHoldOrdersDialog } from '@/components/dashboard/OnHoldOrdersDialog';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  CreditCard,
  PauseCircle,
  FolderKanban,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useJiraData } from '@/hooks/useJiraData';
import type { Order } from '@/types/dashboard';
import {
  mockExecutiveSummary,
  mockOrders,
  mockWebProjects,
  mockCashFlowProjections,
  mockTopCustomers,
} from '@/data/mockData';
import { Button } from '@/components/ui/button';

// Helper to convert dateRange to date range object (start and end dates)
function getDateRangeFromSelection(range: string): { start: string; end: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  switch (range) {
    case 'all-time':
      return { start: '2000-01-01', end: today };
    case 'last-6-months': {
      const date = new Date(now);
      date.setMonth(date.getMonth() - 6);
      return { start: date.toISOString().split('T')[0], end: today };
    }
    case 'last-60-days':
      return { 
        start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: today 
      };
    case 'last-30-days':
      return { 
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: today 
      };
    case 'this-month':
      return { 
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], 
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      };
    case 'nov-2025':
      return { start: '2025-11-01', end: '2025-11-30' };
    case 'dec-2025':
      return { start: '2025-12-01', end: '2025-12-31' };
    default:
      const defaultDate = new Date(now);
      defaultDate.setMonth(defaultDate.getMonth() - 6);
      return { start: defaultDate.toISOString().split('T')[0], end: today };
  }
}

function getDateFromRange(range: string): string {
  return getDateRangeFromSelection(range).start;
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    const element = document.getElementById(`section-${section}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState('All Customers');
  const [selectedAgent, setSelectedAgent] = useState('All Agents');
  const [selectedAccountManager, setSelectedAccountManager] = useState('All Account Managers');
  const [dateRange, setDateRange] = useState('all-time');
  
  // Dialog states
  const [outstandingDialogOpen, setOutstandingDialogOpen] = useState(false);
  const [activeOrdersDialogOpen, setActiveOrdersDialogOpen] = useState(false);
  const [activeOrdersInitialSearch, setActiveOrdersInitialSearch] = useState('');
  const [activeCustomersDialogOpen, setActiveCustomersDialogOpen] = useState(false);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [commissionsDialogOpen, setCommissionsDialogOpen] = useState(false);
  const [activeProjectsDialogOpen, setActiveProjectsDialogOpen] = useState(false);
  const [cashFlowDialogOpen, setCashFlowDialogOpen] = useState(false);
  const [orderHealthDialogOpen, setOrderHealthDialogOpen] = useState(false);
  const [onHoldDialogOpen, setOnHoldDialogOpen] = useState(false);

  const openActiveOrdersDialog = (customerName?: string) => {
    setActiveOrdersInitialSearch(customerName || '');
    setActiveOrdersDialogOpen(true);
  };

  const {
    summary,
    orders,
    orderHealthOrders,
    activeCustomers,
    allTimeOutstandingOrders,
    webProjects,
    labelOrders,
    agentPayments,
    customers,
    agents,
    accountManagers,
    lastSynced,
    isLoading,
    error,
    fetchDashboardData,
    refresh,
  } = useJiraData();

  useEffect(() => {
    const dateFrom = getDateFromRange(dateRange);
    fetchDashboardData({ dateFrom });
  }, [fetchDashboardData, dateRange]);

  const displayOrders = orders.length > 0 ? orders : mockOrders;
  const displayOrderHealthOrders = orderHealthOrders.length > 0 ? orderHealthOrders : mockOrders;
  const displayWebProjects = webProjects.length > 0 ? webProjects : mockWebProjects;
  const displayCustomers = customers.length > 1 ? customers : ['All Customers', ...mockOrders.map(o => o.customer)];
  const displayAgents = agents.length > 1 ? agents : ['All Agents'];
  const displayAccountManagers = accountManagers.length > 1 ? accountManagers : ['All Account Managers'];

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRangeFromSelection(dateRange);
    
    return displayOrders.filter(order => {
      if (selectedCustomer !== 'All Customers' && order.customer !== selectedCustomer) return false;
      if (selectedAgent !== 'All Agents' && order.agent !== selectedAgent) return false;
      if (selectedAccountManager !== 'All Account Managers' && order.accountManager !== selectedAccountManager) return false;
      
      const orderDate = order.startDate || order.dueDate;
      if (orderDate) {
        const orderDateStr = orderDate.substring(0, 10);
        if (orderDateStr < start || orderDateStr > end) return false;
      }
      
      return true;
    });
  }, [displayOrders, selectedCustomer, selectedAgent, selectedAccountManager, dateRange]);

  const hasFiltersApplied = selectedCustomer !== 'All Customers' || 
    selectedAgent !== 'All Agents' || 
    selectedAccountManager !== 'All Account Managers' ||
    dateRange !== 'all-time';

  const resetAllFilters = () => {
    setSelectedCustomer('All Customers');
    setSelectedAgent('All Agents');
    setSelectedAccountManager('All Account Managers');
    setDateRange('all-time');
  };

  const filteredOrderHealthOrders = useMemo(() => {
    if (!hasFiltersApplied) {
      return displayOrderHealthOrders;
    }
    
    return displayOrderHealthOrders.filter(order => {
      if (selectedCustomer !== 'All Customers' && order.customer !== selectedCustomer) return false;
      if (selectedAgent !== 'All Agents' && order.agent !== selectedAgent) return false;
      if (selectedAccountManager !== 'All Account Managers' && order.accountManager !== selectedAccountManager) return false;
      return true;
    });
  }, [displayOrderHealthOrders, selectedCustomer, selectedAgent, selectedAccountManager, hasFiltersApplied]);

  const filteredActiveOrders = useMemo(() => {
    if (!hasFiltersApplied) {
      return displayOrders;
    }
    
    return displayOrders.filter(order => {
      if (selectedCustomer !== 'All Customers' && order.customer !== selectedCustomer) return false;
      if (selectedAgent !== 'All Agents' && order.agent !== selectedAgent) return false;
      if (selectedAccountManager !== 'All Account Managers' && order.accountManager !== selectedAccountManager) return false;
      return true;
    });
  }, [displayOrders, selectedCustomer, selectedAgent, selectedAccountManager, hasFiltersApplied]);

  const reactiveMetrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const isInCurrentMonth = (dateStr: string | undefined | null): boolean => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= currentMonthStart && date <= currentMonthEnd;
    };
    
    const totalActiveCustomers = activeCustomers.filter(c => c.hasActiveOrder || c.hasRecentOrder).length;
    const activeOrdersCount = filteredActiveOrders.length;
    
    const monthlyRevenue = displayOrderHealthOrders.reduce((sum, order) => {
      let amount = 0;
      if (isInCurrentMonth(order.depositReceivedDate)) {
        amount += order.depositAmount || 0;
      }
      if (isInCurrentMonth(order.finalPaymentReceivedDate)) {
        amount += order.finalPayment || 0;
      }
      return sum + amount;
    }, 0);
    
    const onHoldTotal = allTimeOutstandingOrders
      .filter(order => order.currentStatus === 'On Hold')
      .reduce((sum, o) => sum + (o.remainingDue || 0), 0);
    const outstandingPayments = (summary?.allTimeOutstandingPayments ?? 
      filteredOrders.reduce((sum, order) => sum + (order.remainingDue || 0), 0)) - onHoldTotal;
    
    const commissionsDue = agentPayments.reduce((sum, p) => sum + (p.commissionDue || 0), 0);
    
    const ACTIVE_STATUSES = ['Technical Discovery', 'In Technical Discovery', 'In Design', 'In Website Development', 'In Final QA Testing', 'Continuous Development', 'Customer Handover'];
    const activeProjects = displayWebProjects.filter(p => ACTIVE_STATUSES.includes(p.status)).length;
    
    const orderHealthBreakdown = {
      onTrack: filteredOrderHealthOrders.filter(o => o.orderHealth === 'on-track').length,
      atRisk: filteredOrderHealthOrders.filter(o => o.orderHealth === 'at-risk').length,
      offTrack: filteredOrderHealthOrders.filter(o => o.orderHealth === 'off-track').length,
      complete: filteredOrderHealthOrders.filter(o => o.orderHealth === 'complete').length,
      pendingDeposit: filteredOrderHealthOrders.filter(o => o.orderHealth === 'pending-deposit').length,
      onHold: filteredOrderHealthOrders.filter(o => o.orderHealth === 'on-hold').length,
      whiteLabel: filteredOrderHealthOrders.filter(o => o.orderHealth === 'white-label').length,
    };

    return {
      totalActiveCustomers,
      totalActiveOrders: activeOrdersCount,
      totalMonthlyRevenue: monthlyRevenue,
      totalOutstandingPayments: outstandingPayments,
      totalCommissionsDue: commissionsDue,
      totalActiveProjects: activeProjects,
      orderHealthBreakdown,
    };
  }, [displayWebProjects, displayOrders, filteredActiveOrders, filteredOrderHealthOrders, activeCustomers, summary, allTimeOutstandingOrders, filteredOrders, agentPayments]);

  const ordersReceivedThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const isInCurrentMonth = (dateStr: string | undefined | null): boolean => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= currentMonthStart && date <= currentMonthEnd;
    };
    
    return displayOrderHealthOrders.filter(order => 
      isInCurrentMonth(order.depositReceivedDate) || isInCurrentMonth(order.finalPaymentReceivedDate)
    );
  }, [displayOrderHealthOrders]);

  const cashFlowProjections = useMemo(() => {
    const getStatusNumber = (order: Order): number | null => {
      const raw = (order.currentStatus || '').trim();
      if (!raw) return null;
      const m = raw.match(/^\s*(\d+)\s*-/);
      if (m?.[1]) return Number(m[1]);
      const normalized = raw.toLowerCase();
      if (normalized.includes('finished goods testing')) return 12;
      if (normalized.includes('quote requirements')) return 0;
      return null;
    };

    const isStatus0to11 = (order: Order): boolean => {
      const statusNum = getStatusNumber(order);
      return statusNum != null && statusNum >= 0 && statusNum <= 11;
    };

    const isStatus12 = (order: Order): boolean => {
      const statusNum = getStatusNumber(order);
      return statusNum === 12;
    };

    const getEffectiveRemainingDue = (order: Order): number => {
      if (isStatus0to11(order)) return order.remainingDue || 0;
      if (isStatus12(order)) {
        const anyOrder = order as any;
        return (anyOrder.finalPaymentDue ?? order.finalPayment ?? 0) as number;
      }
      return 0;
    };

    const excludedKeywords = ['partial shipment', 'final product shipped', 'canceled', 'on hold'];

    const projectionMap = new Map<string, { 
      amount: number; 
      customers: Set<string>; 
      orderCount: number;
      orders: { id: string; customer: string; productName: string; remainingDue: number; status: string }[];
    }>();
    
    displayOrderHealthOrders.forEach(order => {
      if (order.orderHealth === 'on-hold') return;
      
      const currentStatusLower = (order.currentStatus || '').toLowerCase();
      const isExcluded = excludedKeywords.some(keyword => currentStatusLower.includes(keyword));
      if (isExcluded) return;
      
      const shipDate = order.estShipDate || order.dueDate;
      if (!shipDate) return;
      
      const effectiveRemainingDue = getEffectiveRemainingDue(order);
      if (effectiveRemainingDue <= 0) return;
      
      const dateKey = shipDate.substring(0, 10);
      
      const orderInfo = {
        id: order.id,
        customer: order.customer,
        productName: order.productName,
        remainingDue: effectiveRemainingDue,
        status: order.currentStatus,
      };
      
      if (projectionMap.has(dateKey)) {
        const existing = projectionMap.get(dateKey)!;
        existing.amount += effectiveRemainingDue;
        existing.customers.add(order.customer);
        existing.orderCount += 1;
        existing.orders.push(orderInfo);
      } else {
        projectionMap.set(dateKey, {
          amount: effectiveRemainingDue,
          customers: new Set([order.customer]),
          orderCount: 1,
          orders: [orderInfo],
        });
      }
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    return Array.from(projectionMap.entries())
      .filter(([date]) => date >= todayStr)
      .map(([date, data]) => ({
        date,
        expectedAmount: data.amount,
        customer: data.customers.size === 1 ? Array.from(data.customers)[0] : `${data.customers.size} customers`,
        orderCount: data.orderCount,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12);
  }, [displayOrderHealthOrders]);



  const realTopCustomers = useMemo(() => {
    const customerMap = new Map<string, { totalOrders: number; orderCount: number }>();
    
    filteredOrders.forEach(order => {
      const customer = order.customer;
      if (!customer || customer === 'Unknown') return;
      
      if (!customerMap.has(customer)) {
        customerMap.set(customer, { totalOrders: 0, orderCount: 0 });
      }
      const data = customerMap.get(customer)!;
      data.totalOrders += order.orderTotal || 0;
      data.orderCount += 1;
    });

    return Array.from(customerMap.entries())
      .map(([name, data]) => ({
        name,
        totalOrders: data.totalOrders,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }, [filteredOrders]);

  const onHoldOrders = useMemo(() => {
    return displayOrderHealthOrders.filter(order => {
      const status = (order.currentStatus || '').toLowerCase();
      return status.includes('on hold');
    });
  }, [displayOrderHealthOrders]);

  const activeOutstandingOrders = useMemo(() => {
    return allTimeOutstandingOrders.filter(order => order.currentStatus !== 'On Hold');
  }, [allTimeOutstandingOrders]);

  const onHoldTotal = useMemo(() => {
    return onHoldOrders.reduce((sum, o) => sum + (o.remainingDue || 0), 0);
  }, [onHoldOrders]);

  const handleExport = () => {
    const headers = [
      'Order ID',
      'Sales Order Number',
      'Customer',
      'Product',
      'Agent',
      'Account Manager',
      'Status',
      'Order Total',
      'Remaining Due',
      'Commission Due',
      'Start Date',
      'Due Date',
    ];

    const rows = filteredOrders.map((order) => [
      order.id || '',
      order.salesOrderNumber || '',
      order.customer || '',
      order.productName || '',
      order.agent || '',
      order.accountManager || '',
      order.currentStatus || '',
      order.orderTotal?.toString() || '0',
      order.remainingDue?.toString() || '0',
      order.commissionDue?.toString() || '0',
      order.startDate || '',
      order.dueDate || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
      />
      
      <main className={cn(
        "transition-all duration-300 p-8",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <Header 
          lastSynced={lastSynced} 
          onRefresh={refresh} 
          onExport={handleExport}
          isLoading={isLoading} 
        />
        
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/30 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger" />
            <div className="flex-1">
              <p className="font-medium text-danger">Failed to sync with JIRA</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Retry'}
            </Button>
          </div>
        )}

        {isLoading && !summary && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 ml-64">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto mb-4" />
                <div className="absolute inset-0 h-14 w-14 mx-auto rounded-full bg-primary/20 blur-xl" />
              </div>
              <p className="text-lg font-semibold text-foreground">Syncing with JIRA...</p>
              <p className="text-sm text-muted-foreground mt-1">Fetching orders and projects</p>
            </div>
          </div>
        )}
        
        <FilterBar
          customers={displayCustomers}
          agents={displayAgents}
          accountManagers={displayAccountManagers}
          selectedCustomer={selectedCustomer}
          selectedAgent={selectedAgent}
          selectedAccountManager={selectedAccountManager}
          dateRange={dateRange}
          onCustomerChange={setSelectedCustomer}
          onAgentChange={setSelectedAgent}
          onAccountManagerChange={setSelectedAccountManager}
          onDateRangeChange={setDateRange}
        />

        {hasFiltersApplied && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Button
              onClick={resetAllFilters}
              variant="default"
              size="sm"
              className="shadow-lg flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {summary || orders.length > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>Live Data • {filteredActiveOrders.length} orders displayed</span>
                {hasFiltersApplied && (
                  <span className="text-primary font-medium">(filtered from {displayOrders.length} total)</span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning" />
                Showing demo data • Connect to JIRA for live data
              </span>
            )}
          </div>
        </div>

        <section id="section-overview" className="mb-8 scroll-mt-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div onClick={() => setActiveCustomersDialogOpen(true)} className="cursor-pointer">
              <MetricCard
                title="Active Contract Manufacturing Customers"
                value={reactiveMetrics.totalActiveCustomers}
                icon={Users}
                iconColor="text-primary"
                delay={100}
              />
            </div>

            <div onClick={() => setActiveOrdersDialogOpen(true)} className="cursor-pointer">
              <MetricCard
                title="Active Contract Manufacturing Orders"
                value={reactiveMetrics.totalActiveOrders}
                icon={Package}
                iconColor="text-secondary"
                delay={150}
              />
            </div>

            <div onClick={() => setRevenueDialogOpen(true)} className="cursor-pointer">
              <MetricCard
                title="Collected $$ this month"
                value={`$${reactiveMetrics.totalMonthlyRevenue > 0 ? (reactiveMetrics.totalMonthlyRevenue / 1000).toFixed(0) + 'k' : '0'}`}
                icon={TrendingUp}
                iconColor="text-primary"
                delay={200}
              />
            </div>

            <div onClick={() => setOutstandingDialogOpen(true)} className="cursor-pointer">
              <MetricCard
                title="Cash Receivables"
                value={`$${reactiveMetrics.totalOutstandingPayments > 0 ? (reactiveMetrics.totalOutstandingPayments / 1000).toFixed(0) + 'k' : '0'}`}
                icon={CreditCard}
                iconColor="text-secondary"
                delay={250}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div onClick={() => setOnHoldDialogOpen(true)} className="cursor-pointer">
              <MetricCard
                title={`Contract Manufacturing ON HOLD Orders (${onHoldOrders.length})`}
                value={`$${onHoldTotal > 0 ? (onHoldTotal / 1000).toFixed(0) + 'k' : '0'}`}
                icon={PauseCircle}
                iconColor="text-muted-foreground"
                delay={275}
              />
            </div>

            <div onClick={() => setCommissionsDialogOpen(true)} className="cursor-pointer">
              <MetricCard
                title="Agent Commissions Due"
                value={`$${reactiveMetrics.totalCommissionsDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={DollarSign}
                iconColor="text-primary"
                delay={300}
              />
            </div>

            <div onClick={() => setActiveProjectsDialogOpen(true)} className="cursor-pointer">
              <MetricCard
                title="Active Development Projects"
                value={reactiveMetrics.totalActiveProjects}
                icon={FolderKanban}
                iconColor="text-secondary"
                delay={350}
              />
            </div>
          </div>
        </section>

        <section id="section-financial" className="mb-8 scroll-mt-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Financial Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div onClick={() => setCashFlowDialogOpen(true)} className="cursor-pointer h-full">
              <CashFlowChart data={cashFlowProjections} />
            </div>
            <div onClick={() => setOrderHealthDialogOpen(true)} className="cursor-pointer h-full">
              <OrderHealthChart
                onTrack={reactiveMetrics.orderHealthBreakdown.onTrack}
                atRisk={reactiveMetrics.orderHealthBreakdown.atRisk}
                offTrack={reactiveMetrics.orderHealthBreakdown.offTrack}
                complete={reactiveMetrics.orderHealthBreakdown.complete}
                pendingDeposit={reactiveMetrics.orderHealthBreakdown.pendingDeposit}
                onHold={reactiveMetrics.orderHealthBreakdown.onHold}
                whiteLabel={reactiveMetrics.orderHealthBreakdown.whiteLabel}
              />
            </div>
          </div>
        </section>

        <section id="section-operations" className="mb-8 scroll-mt-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Operations (Orders)</h2>
          <TopCustomers 
            customers={realTopCustomers.length > 0 ? realTopCustomers : mockTopCustomers} 
            onCustomerSelect={(customerName) => openActiveOrdersDialog(customerName)}
            onTotalOrdersClick={() => openActiveOrdersDialog()}
          />
        </section>

        <section id="section-attention" className="mb-8 scroll-mt-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Needs Attention</h2>
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="labels">Labels</TabsTrigger>
            </TabsList>
            <TabsContent value="orders">
              <NeedsAttentionTable orders={filteredOrderHealthOrders} />
            </TabsContent>
            <TabsContent value="labels">
              <LabelsNeedingAttentionTable labelOrders={labelOrders} />
            </TabsContent>
          </Tabs>
        </section>

        <section id="section-web-dev" className="mb-8 scroll-mt-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Web Development</h2>
          <WebProjectsTable projects={displayWebProjects} />
        </section>

        <section id="section-commissions" className="mb-8 scroll-mt-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Agent Commissions</h2>
          <CommissionsTable agentPayments={agentPayments} />
        </section>
      </main>
      
      <OutstandingDetailsDialog
        open={outstandingDialogOpen}
        onOpenChange={setOutstandingDialogOpen}
        orders={activeOutstandingOrders}
      />
      
      <OnHoldOrdersDialog
        open={onHoldDialogOpen}
        onOpenChange={setOnHoldDialogOpen}
        orders={onHoldOrders}
      />
      
      <ActiveOrdersDialog
        open={activeOrdersDialogOpen}
        onOpenChange={(open) => {
          setActiveOrdersDialogOpen(open);
          if (!open) setActiveOrdersInitialSearch('');
        }}
        orders={filteredActiveOrders}
        initialSearchQuery={activeOrdersInitialSearch}
      />
      
      <ActiveCustomersDialog
        open={activeCustomersDialogOpen}
        onOpenChange={setActiveCustomersDialogOpen}
        customers={activeCustomers}
      />
      
      <RevenueDetailsDialog
        open={revenueDialogOpen}
        onOpenChange={setRevenueDialogOpen}
        orders={ordersReceivedThisMonth}
      />
      
      <CommissionsDetailsDialog
        open={commissionsDialogOpen}
        onOpenChange={setCommissionsDialogOpen}
        agentPayments={agentPayments}
      />
      
      <ActiveProjectsDialog
        open={activeProjectsDialogOpen}
        onOpenChange={setActiveProjectsDialogOpen}
        projects={displayWebProjects}
        activeCount={reactiveMetrics.totalActiveProjects}
      />
      
      <ExpectedCashFlowDialog
        open={cashFlowDialogOpen}
        onOpenChange={setCashFlowDialogOpen}
        orders={displayOrderHealthOrders}
        customers={displayCustomers}
      />
      
      <OrderHealthDialog
        open={orderHealthDialogOpen}
        onOpenChange={setOrderHealthDialogOpen}
        orders={filteredOrderHealthOrders}
      />
    </div>
  );
}
