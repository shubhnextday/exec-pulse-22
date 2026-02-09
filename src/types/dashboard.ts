// Dashboard Types based on JIRA field mappings

export type OrderHealth = 'on-track' | 'at-risk' | 'off-track' | 'complete' | 'pending-deposit' | 'on-hold' | 'white-label';
export type EpicStatus = 
  | 'Open'
  | 'In Requirements'
  | 'In Design'
  | 'In Website Development'
  | 'In Final QA Testing'
  | 'Continuous Development'
  | 'Done'
  | 'On Hold'
  | 'Canceled';

export interface Order {
  id: string;
  salesOrderNumber: string;
  customer: string;
  productName: string;
  quantityOrdered: number;
  quotedOrderTotal?: number; // Quoted Order Total from Jira (customfield_11567)
  grossOrderTotal?: number; // Gross Order Total from Jira (customfield_11663)
  orderTotal: number; // Gross Order Total (or Quoted if Gross is 0) - used for calculations
  depositAmount: number;
  /** Order Total - Deposit (legacy field used in some places) */
  finalPayment: number;
  /** JIRA "Final Payment Due" (used for Status 12 calculations) */
  finalPaymentDue?: number;
  remainingDue: number;
  commissionDue: number;
  commissionPercent?: number;
  startDate: string;
  dueDate: string;
  estShipDate: string;
  actualShipDate?: string;
  currentStatus: string;
  expectedStatus: string;
  orderHealth: OrderHealth;
  daysBehindSchedule: number;
  daysInProduction: number;
  agent?: string;
  accountManager?: string;
  orderNotes?: string;
  depositReceivedDate?: string; // Date when deposit was received
  finalPaymentReceivedDate?: string; // Date when final payment was received
}

export interface LabelOrder {
  id: string;
  salesOrderNumber: string;
  customer: string;
  productName: string;
  designDueDate: string;
  currentStatus: string;
  daysBehindSchedule: number;
  labelHealth: 'on-track' | 'at-risk' | 'off-track';
}

export interface WebProject {
  id: string;
  epicName: string;
  epicKey: string;
  status: EpicStatus;
  totalTasks: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  percentComplete: number;
  startDate: string;
  dueDate: string;
  isOffTrack: boolean;
  totalChildItems?: number;
  totalBugs?: number;
  devLead?: string;
  projectLead?: string;
  projectHealth?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  openTasks: number;
  completedThisMonth: number;
}

export interface AgentPayment {
  id: string;
  agent: string;
  summary: string;
  commissionDue: number; // Order Commission Total field
  created: string;
}

/** @deprecated Use AgentPayment instead */
export interface Commission {
  id: string;
  agent: string;
  customer: string;
  orderTotal: number;
  commissionPercent: number;
  commissionDue: number;
  commissionPaid: number;
  commissionPaidDate?: string;
}

export interface ExecutiveSummary {
  totalActiveCustomers: number;
  totalActiveOrders: number;
  totalMonthlyRevenue: number;
  totalOutstandingPayments: number;
  allTimeOutstandingPayments?: number; // All-time outstanding from all orders
  totalCommissionsDue: number;
  totalActiveProjects: number;
  orderHealthBreakdown: {
    onTrack: number;
    atRisk: number;
    offTrack: number;
    complete: number;
    pendingDeposit: number;
    onHold: number;
    whiteLabel: number;
  };
}

export interface ActiveCustomer {
  id: string;
  name: string;
  status: string;
  totalOrders?: number;
  activeOrders?: number;
  hasActiveOrder?: boolean;  // Has at least one active order (not On Hold, Cancelled, Final Product Shipped)
  hasRecentOrder?: boolean;  // Has placed an order in the last 90 days
}

export interface OutstandingOrder {
  id: string;
  salesOrderNumber: string;
  customer: string;
  productName: string;
  currentStatus: string;
  orderTotal: number;
  depositAmount: number;
  remainingDue: number;
  finalPaymentDue?: number;
  estShipDate?: string;
}

export interface CashFlowProjection {
  date: string;
  expectedAmount: number;
  customer: string;
  orderCount: number;
  orders?: { id: string; customer: string; productName: string; remainingDue: number; status: string }[];
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  customer: string | null;
  agent: string | null;
  projectType: 'all' | 'manufacturing' | 'web-development';
  accountManager: string | null;
}
