import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { OrderHealthChart } from '@/components/dashboard/OrderHealthChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { NeedsAttentionTable } from '@/components/dashboard/NeedsAttentionTable';
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
import { cn } from '@/lib/utils';
import {
  Users,
  Package,
  DollarSign,
  CreditCard,
  Percent,
  FolderKanban,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useJiraData } from '@/hooks/useJiraData';
import {
  mockExecutiveSummary,
  mockOrders,
  mockWebProjects,
  mockCommissions,
  mockCashFlowProjections,
  mockTopCustomers,
} from '@/data/mockData';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Helper to convert dateRange to date range object (start and end dates)
function getDateRangeFromSelection(range: string): { start: string; end: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  switch (range) {
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
      // Default to 6 months ago
      const defaultDate = new Date(now);
      defaultDate.setMonth(defaultDate.getMonth() - 6);
      return { start: defaultDate.toISOString().split('T')[0], end: today };
  }
}

// Helper to get just dateFrom for API call
function getDateFromRange(range: string): string {
  return getDateRangeFromSelection(range).start;
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Handle section navigation - scroll to section
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
  const [dateRange, setDateRange] = useState('this-month'); // Default to current month for fast load
  
  // Dialog states
  const [outstandingDialogOpen, setOutstandingDialogOpen] = useState(false);
  const [activeOrdersDialogOpen, setActiveOrdersDialogOpen] = useState(false);
  const [activeCustomersDialogOpen, setActiveCustomersDialogOpen] = useState(false);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [commissionsDialogOpen, setCommissionsDialogOpen] = useState(false);
  const [activeProjectsDialogOpen, setActiveProjectsDialogOpen] = useState(false);
  const [cashFlowDialogOpen, setCashFlowDialogOpen] = useState(false);
  const [orderHealthDialogOpen, setOrderHealthDialogOpen] = useState(false);

  // JIRA data hook
  const {
    summary,
    orders,
    orderHealthOrders,
    activeCustomers,
    allTimeOutstandingOrders,
    webProjects,
    customers,
    agents,
    accountManagers,
    lastSynced,
    isLoading,
    error,
    fetchDashboardData,
    refresh,
  } = useJiraData();

  // Fetch data when date range changes
  useEffect(() => {
    const dateFrom = getDateFromRange(dateRange);
    fetchDashboardData({ dateFrom });
  }, [fetchDashboardData, dateRange]);

  // Use JIRA data if available, otherwise fall back to mock data
  const displayOrders = orders.length > 0 ? orders : mockOrders;
  const displayOrderHealthOrders = orderHealthOrders.length > 0 ? orderHealthOrders : mockOrders;
  const displayWebProjects = webProjects.length > 0 ? webProjects : mockWebProjects;
  const displayCustomers = customers.length > 1 ? customers : ['All Customers', ...mockOrders.map(o => o.customer)];
  const displayAgents = agents.length > 1 ? agents : ['All Agents'];
  const displayAccountManagers = accountManagers.length > 1 ? accountManagers : ['All Account Managers'];

  // Filter orders based on selections - ALL STATS ARE DERIVED FROM THIS
  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRangeFromSelection(dateRange);
    
    return displayOrders.filter(order => {
      // Filter by customer
      if (selectedCustomer !== 'All Customers' && order.customer !== selectedCustomer) return false;
      // Filter by agent
      if (selectedAgent !== 'All Agents' && order.agent !== selectedAgent) return false;
      // Filter by account manager
      if (selectedAccountManager !== 'All Account Managers' && order.accountManager !== selectedAccountManager) return false;
      
      // Filter by date range - use startDate or dueDate
      const orderDate = order.startDate || order.dueDate;
      if (orderDate) {
        const orderDateStr = orderDate.substring(0, 10);
        if (orderDateStr < start || orderDateStr > end) return false;
      }
      
      return true;
    });
  }, [displayOrders, selectedCustomer, selectedAgent, selectedAccountManager, dateRange]);

  // Check if any filters are applied
  const hasFiltersApplied = selectedCustomer !== 'All Customers' || 
    selectedAgent !== 'All Agents' || 
    selectedAccountManager !== 'All Account Managers';

  // Filter order health orders when filters are applied
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

  // Filter active orders when filters are applied
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

  // REACTIVE METRICS - Use proper data sources
  const reactiveMetrics = useMemo(() => {
    // Active Customers: Count from CUS project (activeCustomers from API)
    const totalActiveCustomers = activeCustomers.length;
    
    // Active Orders: Use filtered when filters applied, all when default
    const activeOrdersCount = filteredActiveOrders.length;
    
    // Monthly Revenue: Sum of orderTotal from filtered orders
    const monthlyRevenue = filteredOrders.reduce((sum, order) => sum + (order.orderTotal || 0), 0);
    
    // Outstanding Payments: Use all-time outstanding from summary, fallback to filtered orders
    const outstandingPayments = summary?.allTimeOutstandingPayments ?? 
      filteredOrders.reduce((sum, order) => sum + (order.remainingDue || 0), 0);
    
    // Commissions Due: Sum of commissionDue field from ALL orders (not just active)
    const commissionsDue = displayOrders.reduce((sum, order) => sum + (order.commissionDue || 0), 0);
    
    // Active Projects: Count from web projects (not filtered by order filters)
    // Exclude "Open" status from count - they're in queue, not yet active until "In Requirements"
    const activeProjects = displayWebProjects.filter(p => !['Done', 'Canceled', 'On Hold', 'Open'].includes(p.status)).length;
    
    // Order Health Breakdown: Use filtered order health orders when filters applied
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
  }, [filteredOrders, displayWebProjects, displayOrders, filteredActiveOrders, filteredOrderHealthOrders, activeCustomers, summary]);

  // Calculate cash flow projections from ALL active orders (not filtered by date)
  const cashFlowProjections = useMemo(() => {
    // Group orders by EST Ship Date and sum remainingDue
    const projectionMap = new Map<string, { 
      amount: number; 
      customers: Set<string>; 
      orderCount: number;
      orders: { id: string; customer: string; productName: string; remainingDue: number; status: string }[];
    }>();
    
    // Use displayOrderHealthOrders (all active non-cancelled orders) instead of filteredOrders
    displayOrderHealthOrders.forEach(order => {
      // Use estShipDate, fallback to dueDate if not available
      const shipDate = order.estShipDate || order.dueDate;
      if (!shipDate || !order.remainingDue || order.remainingDue <= 0) return;
      
      const dateKey = shipDate.substring(0, 10); // Get YYYY-MM-DD
      
      const orderInfo = {
        id: order.id,
        customer: order.customer,
        productName: order.productName,
        remainingDue: order.remainingDue,
        status: order.currentStatus,
      };
      
      if (projectionMap.has(dateKey)) {
        const existing = projectionMap.get(dateKey)!;
        existing.amount += order.remainingDue;
        existing.customers.add(order.customer);
        existing.orderCount += 1;
        existing.orders.push(orderInfo);
      } else {
        projectionMap.set(dateKey, {
          amount: order.remainingDue,
          customers: new Set([order.customer]),
          orderCount: 1,
          orders: [orderInfo],
        });
      }
    });

    // Convert to array and sort by date, then get next 12 dates from today onwards
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    return Array.from(projectionMap.entries())
      .filter(([date]) => date >= todayStr) // Only show future/today dates
      .map(([date, data]) => ({
        date,
        expectedAmount: data.amount,
        customer: data.customers.size === 1 ? Array.from(data.customers)[0] : `${data.customers.size} customers`,
        orderCount: data.orderCount,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12); // Show next 12 dates for readability
  }, [displayOrderHealthOrders]);

  // Calculate commissions from real order data - ACCURATE from JIRA
  const realCommissions = useMemo(() => {
    // Group by agent and aggregate commission data from filtered orders
    const agentMap = new Map<string, { 
      orders: { customer: string; orderTotal: number; commissionDue: number; orderId: string }[];
      totalCommission: number;
    }>();
    
    filteredOrders.forEach(order => {
      const agent = order.agent || 'Unassigned';
      if (!agentMap.has(agent)) {
        agentMap.set(agent, { orders: [], totalCommission: 0 });
      }
      const data = agentMap.get(agent)!;
      data.orders.push({
        customer: order.customer,
        orderTotal: order.orderTotal || 0,
        commissionDue: order.commissionDue || 0,
        orderId: order.id,
      });
      data.totalCommission += order.commissionDue || 0;
    });

    // Convert to commission records - include ALL with commissions
    return Array.from(agentMap.entries())
      .filter(([agent]) => agent !== 'Unassigned')
      .flatMap(([agent, data]) => 
        data.orders
          .filter(order => order.commissionDue > 0)
          .map((order) => ({
            id: order.orderId,
            agent,
            customer: order.customer,
            orderTotal: order.orderTotal,
            commissionPercent: order.orderTotal > 0 ? (order.commissionDue / order.orderTotal) * 100 : 0,
            commissionDue: order.commissionDue,
            commissionPaid: 0, // JIRA doesn't track paid status yet
          }))
      );
  }, [filteredOrders]);

  // Calculate top customers from filtered orders - ACCURATE from JIRA
  const realTopCustomers = useMemo(() => {
    const customerMap = new Map<string, { totalOrders: number; orderCount: number }>();
    
    // Use filtered orders for consistency with other metrics
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

    // Return ALL customers sorted by revenue (no limit)
    return Array.from(customerMap.entries())
      .map(([name, data]) => ({
        name,
        totalOrders: data.totalOrders,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }, [filteredOrders]);

  // Metric explanations for tooltips
  const metricExplanations = {
    activeCustomers: `Unique customers with on-track orders matching current filters.\n\nSource: JIRA CM Project → Customer field (customfield_10038)\n\nCalculation: COUNT(DISTINCT customer) from on-track orders\n\nExcludes: Customers with only at-risk/off-track orders`,
    activeOrders: `On-track orders matching current filters.\n\nSource: JIRA CM Project → All CM issues\n\nCalculation: COUNT(*) from filtered orders WHERE orderHealth = 'on-track'\n\nExcludes: Cancelled, Done, Shipped, Complete statuses AND at-risk/off-track orders`,
    monthlyRevenue: `Sum of all order totals matching current filters.\n\nSource: JIRA CM Project → Order Total field (customfield_11567)\n\nCalculation: SUM(orderTotal) from filtered orders`,
    outstanding: `Total remaining payments due on filtered orders.\n\nSource: JIRA CM Project → Remaining Amount field (customfield_11569)\n\nCalculation: SUM(remainingDue) from filtered orders`,
    commissions: `Total commissions due from JIRA.\n\nSource: JIRA CM Project → Commission Due field (customfield_11577)\n\nCalculation: SUM(commissionDue) from filtered orders`,
    activeProjects: `Web development projects currently in progress.\n\nSource: JIRA WEB Project → Epic issues\n\nCalculation: COUNT(*) where status = 'active'`,
  };

  return (
    <TooltipProvider>
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
            isLoading={isLoading} 
          />
          
          {/* Error Banner */}
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

          {/* Loading Overlay */}
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

          {/* Data Source Indicator */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {summary || orders.length > 0 ? (
                <span className="inline-flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span>Live JIRA Data • {filteredActiveOrders.length} orders displayed</span>
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

          {/* Executive Summary Section */}
          <section id="section-overview" className="mb-8 scroll-mt-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Executive Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div onClick={() => setActiveCustomersDialogOpen(true)} className="cursor-pointer">
                    <MetricCard
                      title="Active Customers"
                      value={reactiveMetrics.totalActiveCustomers}
                      icon={Users}
                      iconColor="text-primary"
                      delay={100}
                      showInfo
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs whitespace-pre-line">
                  {metricExplanations.activeCustomers}
                  <br /><br />
                  <span className="text-primary">Click to view details</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div onClick={() => setActiveOrdersDialogOpen(true)} className="cursor-pointer">
                    <MetricCard
                      title="Active Orders"
                      value={reactiveMetrics.totalActiveOrders}
                      icon={Package}
                      iconColor="text-secondary"
                      delay={150}
                      showInfo
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs whitespace-pre-line">
                  {metricExplanations.activeOrders}
                  <br /><br />
                  <span className="text-primary">Click to view details</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div onClick={() => setRevenueDialogOpen(true)} className="cursor-pointer">
                    <MetricCard
                      title="This Month's Revenue"
                      value={`$${reactiveMetrics.totalMonthlyRevenue > 0 ? (reactiveMetrics.totalMonthlyRevenue / 1000).toFixed(0) + 'k' : '0'}`}
                      icon={DollarSign}
                      iconColor="text-primary"
                      delay={200}
                      showInfo
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs whitespace-pre-line">
                  {metricExplanations.monthlyRevenue}
                  <br /><br />
                  <span className="text-primary">Click to view details</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div onClick={() => setOutstandingDialogOpen(true)} className="cursor-pointer">
                    <MetricCard
                      title="Outstanding"
                      value={`$${reactiveMetrics.totalOutstandingPayments > 0 ? (reactiveMetrics.totalOutstandingPayments / 1000).toFixed(0) + 'k' : '0'}`}
                      icon={CreditCard}
                      iconColor="text-secondary"
                      delay={250}
                      showInfo
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs whitespace-pre-line">
                  {metricExplanations.outstanding}
                  <br /><br />
                  <span className="text-primary">Click to view details</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div onClick={() => setCommissionsDialogOpen(true)} className="cursor-pointer">
                    <MetricCard
                      title="Commissions Due"
                      value={`$${reactiveMetrics.totalCommissionsDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      icon={Percent}
                      iconColor="text-primary"
                      delay={300}
                      showInfo
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs whitespace-pre-line">
                  {metricExplanations.commissions}
                  <br /><br />
                  <span className="text-primary">Click to view details</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div onClick={() => setActiveProjectsDialogOpen(true)} className="cursor-pointer">
                    <MetricCard
                      title="Active Projects"
                      value={reactiveMetrics.totalActiveProjects}
                      icon={FolderKanban}
                      iconColor="text-secondary"
                      delay={350}
                      showInfo
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs whitespace-pre-line">
                  {metricExplanations.activeProjects}
                  <br /><br />
                  <span className="text-primary">Click to view details</span>
                </TooltipContent>
              </Tooltip>
            </div>
          </section>

          {/* Charts Section - Financial Overview */}
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

          {/* Operations (Orders) Section */}
          <section id="section-operations" className="mb-8 scroll-mt-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Operations (Orders)</h2>
            <TopCustomers customers={realTopCustomers.length > 0 ? realTopCustomers : mockTopCustomers} />
          </section>

          {/* Needs Attention Section */}
          <section id="section-attention" className="mb-8 scroll-mt-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Needs Attention</h2>
            <NeedsAttentionTable orders={filteredOrderHealthOrders} />
          </section>

          {/* Web Development Section */}
          <section id="section-web-dev" className="mb-8 scroll-mt-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Web Development</h2>
            <WebProjectsTable projects={displayWebProjects} />
          </section>

          {/* Agent Commissions Section */}
          <section id="section-commissions" className="mb-8 scroll-mt-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Agent Commissions</h2>
            <CommissionsTable commissions={realCommissions} />
          </section>
        </main>
        
        {/* Detail Dialogs */}
        <OutstandingDetailsDialog
          open={outstandingDialogOpen}
          onOpenChange={setOutstandingDialogOpen}
          orders={allTimeOutstandingOrders}
        />
        
        <ActiveOrdersDialog
          open={activeOrdersDialogOpen}
          onOpenChange={setActiveOrdersDialogOpen}
          orders={filteredActiveOrders}
        />
        
        <ActiveCustomersDialog
          open={activeCustomersDialogOpen}
          onOpenChange={setActiveCustomersDialogOpen}
          customers={activeCustomers}
        />
        
        <RevenueDetailsDialog
          open={revenueDialogOpen}
          onOpenChange={setRevenueDialogOpen}
          orders={filteredOrders}
        />
        
        <CommissionsDetailsDialog
          open={commissionsDialogOpen}
          onOpenChange={setCommissionsDialogOpen}
          orders={displayOrders}
        />
        
        <ActiveProjectsDialog
          open={activeProjectsDialogOpen}
          onOpenChange={setActiveProjectsDialogOpen}
          projects={displayWebProjects}
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
    </TooltipProvider>
  );
}
