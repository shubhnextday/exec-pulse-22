import { useState } from 'react';
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
} from 'lucide-react';
import {
  mockExecutiveSummary,
  mockOrders,
  mockWebProjects,
  mockTeamMembers,
  mockCommissions,
  mockCashFlowProjections,
  mockTopCustomers,
  mockCustomers,
  mockAgents,
  mockAccountManagers,
} from '@/data/mockData';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState('All Customers');
  const [selectedAgent, setSelectedAgent] = useState('All Agents');
  const [selectedAccountManager, setSelectedAccountManager] = useState('All Account Managers');
  const [dateRange, setDateRange] = useState('nov-2025');

  const summary = mockExecutiveSummary;

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
        <Header />
        
        <FilterBar
          customers={mockCustomers}
          agents={mockAgents}
          accountManagers={mockAccountManagers}
          selectedCustomer={selectedCustomer}
          selectedAgent={selectedAgent}
          selectedAccountManager={selectedAccountManager}
          dateRange={dateRange}
          onCustomerChange={setSelectedCustomer}
          onAgentChange={setSelectedAgent}
          onAccountManagerChange={setSelectedAccountManager}
          onDateRangeChange={setDateRange}
        />

        {/* Executive Summary Section */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard
              title="Active Customers"
              value={summary.totalActiveCustomers}
              icon={Users}
              iconColor="text-primary"
              delay={100}
            />
            <MetricCard
              title="Active Orders"
              value={summary.totalActiveOrders}
              icon={Package}
              iconColor="text-accent"
              delay={150}
            />
            <MetricCard
              title="Monthly Revenue"
              value={`$${(summary.totalMonthlyRevenue / 1000).toFixed(0)}k`}
              icon={DollarSign}
              iconColor="text-success"
              change={{ value: 12.5, isPositive: true }}
              delay={200}
            />
            <MetricCard
              title="Outstanding"
              value={`$${(summary.totalOutstandingPayments / 1000).toFixed(0)}k`}
              icon={CreditCard}
              iconColor="text-warning"
              delay={250}
            />
            <MetricCard
              title="Commissions Due"
              value={`$${summary.totalCommissionsDue.toLocaleString()}`}
              icon={Percent}
              iconColor="text-accent"
              delay={300}
            />
            <MetricCard
              title="Active Projects"
              value={summary.totalActiveProjects}
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
            onTrack={summary.orderHealthBreakdown.onTrack}
            atRisk={summary.orderHealthBreakdown.atRisk}
            offTrack={summary.orderHealthBreakdown.offTrack}
          />
        </section>

        {/* Needs Attention Section */}
        <section className="mb-8">
          <NeedsAttentionTable orders={mockOrders} />
        </section>

        {/* Web Development & Team Section */}
        <section className="mb-8">
          <WebProjectsTable projects={mockWebProjects} />
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
