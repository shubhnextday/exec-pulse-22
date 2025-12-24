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
  orderTotal: number;
  depositAmount: number;
  finalPayment: number;
  remainingDue: number;
  commissionDue: number;
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
}

export interface LabelOrder {
  id: string;
  orderId: string;
  labelOrderDate: string;
  designDueDate: string;
  currentStatus: string;
  daysInStatus: number;
  expectedPackagingDate: string;
  printDaysRequired: number;
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
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  openTasks: number;
  completedThisMonth: number;
}

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
