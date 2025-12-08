import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { OrderHealthChart } from '@/components/dashboard/OrderHealthChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { NeedsAttentionTable } from '@/components/dashboard/NeedsAttentionTable';
import { WebProjectsTable } from '@/components/dashboard/WebProjectsTable';
import { TeamWorkload } from '@/components/dashboard/TeamWorkload';
import { CommissionsTable } from '@/components/dashboard/CommissionsTable';
import { TopCustomers } from '@/components/dashboard/TopCustomers';
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
  mockTeamMembers,
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

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState('All Customers');
  const [selectedAgent, setSelectedAgent] = useState('All Agents');
  const [selectedAccountManager, setSelectedAccountManager] = useState('All Account Managers');
  const [dateRange, setDateRange] = useState('nov-2025');

  // JIRA data hook
  const {
    summary,
    orders,
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

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Use JIRA data if available, otherwise fall back to mock data
  const displayOrders = orders.length > 0 ? orders : mockOrders;
  const displayWebProjects = webProjects.length > 0 ? webProjects : mockWebProjects;
  const displayCustomers = customers.length > 1 ? customers : ['All Customers', ...mockOrders.map(o => o.customer)];
  const displayAgents = agents.length > 1 ? agents : ['All Agents'];
  const displayAccountManagers = accountManagers.length > 1 ? accountManagers : ['All Account Managers'];

  // Filter orders based on selections - ALL STATS ARE DERIVED FROM THIS
  const filteredOrders = useMemo(() => {
    return displayOrders.filter(order => {
      if (selectedCustomer !== 'All Customers' && order.customer !== selectedCustomer) return false;
      if (selectedAgent !== 'All Agents' && order.agent !== selectedAgent) return false;
      if (selectedAccountManager !== 'All Account Managers' && order.accountManager !== selectedAccountManager) return false;
      return true;
    });
  }, [displayOrders, selectedCustomer, selectedAgent, selectedAccountManager]);

  // REACTIVE METRICS - Revenue/Commissions from ALL orders, active counts from filtered
  const reactiveMetrics = useMemo(() => {
    // Active Customers: Count of unique customer names in filtered orders
    const uniqueCustomers = new Set(
      filteredOrders
        .map(o => o.customer)
        .filter(c => c && c !== 'Unknown')
    );
    
    // Active Orders: Total count of filtered orders (excludes cancelled/completed)
    const activeOrders = filteredOrders.length;
    
    // Monthly Revenue: Sum of orderTotal from ALL orders (not just active)
    const monthlyRevenue = displayOrders.reduce((sum, order) => sum + (order.orderTotal || 0), 0);
    
    // Outstanding Payments: Sum of remainingDue from filtered orders
    const outstandingPayments = filteredOrders.reduce((sum, order) => sum + (order.remainingDue || 0), 0);
    
    // Commissions Due: Sum of commissionDue field from ALL orders (not just active)
    const commissionsDue = displayOrders.reduce((sum, order) => sum + (order.commissionDue || 0), 0);
    
    // Active Projects: Count from web projects (not filtered by order filters)
    const activeProjects = displayWebProjects.filter(p => p.status === 'active').length;
    
    // Order Health Breakdown: Calculated from filtered orders
    const orderHealthBreakdown = {
      onTrack: filteredOrders.filter(o => o.orderHealth === 'on-track').length,
      atRisk: filteredOrders.filter(o => o.orderHealth === 'at-risk').length,
      offTrack: filteredOrders.filter(o => o.orderHealth === 'off-track').length,
    };

    return {
      totalActiveCustomers: uniqueCustomers.size,
      totalActiveOrders: activeOrders,
      totalMonthlyRevenue: monthlyRevenue,
      totalOutstandingPayments: outstandingPayments,
      totalCommissionsDue: commissionsDue,
      totalActiveProjects: activeProjects,
      orderHealthBreakdown,
    };
  }, [filteredOrders, displayWebProjects, displayOrders]);

  // Calculate cash flow projections from filtered orders
  const cashFlowProjections = useMemo(() => {
    // Group orders by EST Ship Date and sum remainingDue
    const projectionMap = new Map<string, { amount: number; customers: Set<string>; orderCount: number }>();
    
    filteredOrders.forEach(order => {
      // Use estShipDate, fallback to dueDate if not available
      const shipDate = order.estShipDate || order.dueDate;
      if (!shipDate || !order.remainingDue || order.remainingDue <= 0) return;
      
      const dateKey = shipDate.substring(0, 10); // Get YYYY-MM-DD
      
      if (projectionMap.has(dateKey)) {
        const existing = projectionMap.get(dateKey)!;
        existing.amount += order.remainingDue;
        existing.customers.add(order.customer);
        existing.orderCount += 1;
      } else {
        projectionMap.set(dateKey, {
          amount: order.remainingDue,
          customers: new Set([order.customer]),
          orderCount: 1,
        });
      }
    });

    // Convert to array and sort by date
    return Array.from(projectionMap.entries())
      .map(([date, data]) => ({
        date,
        expectedAmount: data.amount,
        customer: data.customers.size === 1 ? Array.from(data.customers)[0] : `${data.customers.size} customers`,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12); // Show next 12 dates for readability
  }, [filteredOrders]);

  // Metric explanations for tooltips
  const metricExplanations = {
    activeCustomers: `Unique customers with active orders matching current filters.\n\nSource: JIRA CM Project → Customer field (customfield_10038)\n\nCalculation: COUNT(DISTINCT customer) from filtered active orders\n\nExcludes: Cancelled, Done, Shipped, Complete statuses`,
    activeOrders: `Total active orders matching current filters.\n\nSource: JIRA CM Project → All CM issues\n\nCalculation: COUNT(*) from filtered orders\n\nExcludes: Cancelled, Done, Shipped, Complete statuses`,
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
          onSectionChange={setActiveSection} 
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
                  <span>Live JIRA Data • {filteredOrders.length} orders displayed</span>
                  {(selectedCustomer !== 'All Customers' || selectedAgent !== 'All Agents' || selectedAccountManager !== 'All Account Managers') && (
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
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
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
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
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
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <MetricCard
                      title="Monthly Revenue"
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
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
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
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
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
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
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
                </TooltipContent>
              </Tooltip>
            </div>
          </section>

          {/* Charts Section */}
          <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CashFlowChart data={cashFlowProjections.length > 0 ? cashFlowProjections : mockCashFlowProjections} />
            <OrderHealthChart
              onTrack={reactiveMetrics.orderHealthBreakdown.onTrack}
              atRisk={reactiveMetrics.orderHealthBreakdown.atRisk}
              offTrack={reactiveMetrics.orderHealthBreakdown.offTrack}
            />
          </section>

          {/* Needs Attention Section */}
          <section className="mb-8">
            <NeedsAttentionTable orders={filteredOrders} />
          </section>

          {/* Web Development & Team Section */}
          <section className="mb-8">
            <WebProjectsTable projects={displayWebProjects} />
          </section>

          {/* Bottom Section: Team, Commissions, Top Customers */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TeamWorkload members={mockTeamMembers} />
            <CommissionsTable commissions={mockCommissions} />
            <TopCustomers customers={mockTopCustomers} />
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}
