import { useState, useEffect } from 'react';
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
  const displaySummary = summary || mockExecutiveSummary;
  const displayOrders = orders.length > 0 ? orders : mockOrders;
  const displayWebProjects = webProjects.length > 0 ? webProjects : mockWebProjects;
  const displayCustomers = customers.length > 1 ? customers : ['All Customers', ...mockOrders.map(o => o.customer)];
  const displayAgents = agents.length > 1 ? agents : ['All Agents'];
  const displayAccountManagers = accountManagers.length > 1 ? accountManagers : ['All Account Managers'];

  // Filter orders based on selections
  const filteredOrders = displayOrders.filter(order => {
    if (selectedCustomer !== 'All Customers' && order.customer !== selectedCustomer) return false;
    if (selectedAgent !== 'All Agents' && order.agent !== selectedAgent) return false;
    if (selectedAccountManager !== 'All Account Managers' && order.accountManager !== selectedAccountManager) return false;
    return true;
  });

  return (
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
          <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 flex items-center gap-3">
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
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 ml-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Syncing with JIRA...</p>
              <p className="text-sm text-muted-foreground">Fetching orders and projects</p>
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
        <div className="mb-4 text-xs text-muted-foreground">
          {summary ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Connected to JIRA • {displayOrders.length} orders • {displayWebProjects.length} projects
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warning" />
              Showing demo data • Connect to JIRA for live data
            </span>
          )}
        </div>

        {/* Executive Summary Section */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard
              title="Active Customers"
              value={displaySummary.totalActiveCustomers}
              icon={Users}
              iconColor="text-primary"
              delay={100}
            />
            <MetricCard
              title="Active Orders"
              value={displaySummary.totalActiveOrders}
              icon={Package}
              iconColor="text-accent"
              delay={150}
            />
            <MetricCard
              title="Monthly Revenue"
              value={`$${(displaySummary.totalMonthlyRevenue / 1000).toFixed(0)}k`}
              icon={DollarSign}
              iconColor="text-success"
              change={{ value: 12.5, isPositive: true }}
              delay={200}
            />
            <MetricCard
              title="Outstanding"
              value={`$${(displaySummary.totalOutstandingPayments / 1000).toFixed(0)}k`}
              icon={CreditCard}
              iconColor="text-warning"
              delay={250}
            />
            <MetricCard
              title="Commissions Due"
              value={`$${displaySummary.totalCommissionsDue.toLocaleString()}`}
              icon={Percent}
              iconColor="text-accent"
              delay={300}
            />
            <MetricCard
              title="Active Projects"
              value={displaySummary.totalActiveProjects}
              icon={FolderKanban}
              iconColor="text-primary"
              delay={350}
            />
          </div>
        </section>

        {/* Charts Section */}
        <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CashFlowChart data={mockCashFlowProjections} />
          <OrderHealthChart
            onTrack={displaySummary.orderHealthBreakdown.onTrack}
            atRisk={displaySummary.orderHealthBreakdown.atRisk}
            offTrack={displaySummary.orderHealthBreakdown.offTrack}
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
  );
}
