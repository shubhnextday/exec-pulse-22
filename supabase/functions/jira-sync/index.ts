import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JIRA custom field mappings - VERIFIED from PHP implementation
const FIELD_MAPPINGS = {
  customer: 'customfield_10038',
  agent: 'customfield_11573',
  accountManager: 'customfield_11393',
  orderTotal: 'customfield_11567', // Quoted Order Total
  grossOrderTotal: 'customfield_11646', // Gross Order Total $$
  depositAmount: 'customfield_10074',
  remainingAmount: 'customfield_11569',
  finalPaymentDue: 'customfield_11650', // Final Payment Due field
  commissionDue: 'customfield_11577',
  commissionPercent: 'customfield_11574', // Commission % field
  quantityOrdered: 'customfield_10073',
  salesOrderNumber: 'customfield_10113',
  productName: 'customfield_10115',
  productId: 'customfield_10732',
  dateOrdered: 'customfield_10040',
  startDate: 'customfield_10015', // Start Date from PHP
  estShipDate: 'customfield_10536', // EST Ship Date from PHP  
  actualShipDate: 'customfield_11161',
  commissionPaidDate: 'customfield_11578',
  daysInProduction: 'customfield_10930',
  orderHealth: 'customfield_10897', // Order Health field from PHP
  healthField: 'customfield_10083',
  depositReceivedDate: 'customfield_10039', // Deposit Received Date
  finalPaymentReceivedDate: 'customfield_10051', // Final Payment Received Date
  // WEB project fields
  totalChildItems: 'customfield_11834',
  totalBugs: 'customfield_11836',
  devLead: 'customfield_11683',
  projectLead: 'customfield_11756',
  projectHealth: 'customfield_11903',
};

const CANCELLED_STATUSES = ['cancelled', 'canceled', 'done', 'shipped', 'complete', 'completed', 'closed', 'final product shipped'];
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 2000;

// Order workflow statuses with expected percentages (from Order Workflow documentation)
const ORDER_WORKFLOW = [
  { status: 'Quote Requirements', percent: 0 },
  { status: '1 - Ready to Start Order', percent: 7.30 },
  { status: '2 - In Sourcing', percent: 7.80 },
  { status: '3 - Ordering Raw Materials', percent: 28.80 },
  { status: '4 - All Raw Materials Ordered', percent: 39.30 },
  { status: '5 - All Raw Materials Received', percent: 50.00 },
  { status: '6 - Raw Materials Testing', percent: 56.00 },
  { status: '7 - In Manufacturing', percent: 72.40 },
  { status: '8 - Manufacturing Complete', percent: 73.20 },
  { status: '9 - Bulk Product Testing', percent: 78.00 },
  { status: '10 - Awaiting Packaging', percent: 84.00 },
  { status: '11 - In Packaging', percent: 96.00 },
  { status: '12 - Finished Goods Testing', percent: 100 },
  { status: 'Final Product Shipped', percent: 100 },
];

// Calculate expected status based on elapsed time between start date and due date
function calculateExpectedStatus(startDate: string | null, dueDate: string | null): string {
  if (!startDate || !dueDate) return 'Unknown';
  
  const start = new Date(startDate);
  const due = new Date(dueDate);
  const now = new Date();
  
  // Check if due date is in the past - should be shipped
  if (now > due) {
    return 'Final Product Shipped';
  }
  
  // Total duration of the order
  const totalDuration = due.getTime() - start.getTime();
  if (totalDuration <= 0) return 'Final Product Shipped';
  
  // Elapsed time from start to now
  const elapsed = now.getTime() - start.getTime();
  
  // Calculate expected percentage complete
  const expectedPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  
  // Find the workflow status that matches the expected percentage
  for (let i = ORDER_WORKFLOW.length - 1; i >= 0; i--) {
    if (expectedPercent >= ORDER_WORKFLOW[i].percent) {
      return ORDER_WORKFLOW[i].status;
    }
  }
  
  return ORDER_WORKFLOW[0].status;
}

// Helper to extract customer name from various field formats
function extractCustomerName(customerField: any): string {
  if (!customerField) return 'Unknown';
  
  if (typeof customerField === 'string') return customerField;
  
  if (typeof customerField === 'object') {
    // Check various possible keys for customer name
    if (customerField.displayName) return customerField.displayName;
    if (customerField.name) return customerField.name;
    if (customerField.value) return customerField.value;
    if (customerField.key) return customerField.key;
  }
  
  return 'Unknown';
}

// Helper to fetch with retry on rate limit with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY_MS): Promise<Response> {
  const response = await fetch(url, options);
  
  if (response.status === 429 && retries > 0) {
    console.log(`Rate limited, waiting ${delay}ms before retry (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
  
  return response;
}

// Fetch ALL issues with pagination using nextPageToken (like PHP implementation)
async function fetchAllIssues(jiraDomain: string, headers: Record<string, string>, jql: string, fields: string[]): Promise<any[]> {
  const endpoint = `https://${jiraDomain}/rest/api/3/search/jql`;
  const allIssues: any[] = [];
  let nextPageToken: string | null = null;
  const maxResults = 100;
  
  console.log(`Fetching issues with JQL: ${jql}`);
  
  while (true) {
    const payload: any = {
      jql,
      maxResults,
      fields,
    };
    
    if (nextPageToken) {
      payload.nextPageToken = nextPageToken;
    }
    
    const response = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`JIRA API error: ${response.status}`, errorText);
      throw new Error(`JIRA API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.issues && Array.isArray(data.issues)) {
      allIssues.push(...data.issues);
      console.log(`Fetched ${data.issues.length} issues, total: ${allIssues.length}`);
    }
    
    // Check for next page
    if (data.nextPageToken) {
      nextPageToken = data.nextPageToken;
    } else {
      break;
    }
  }
  
  console.log(`Total issues fetched: ${allIssues.length}`);
  return allIssues;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const jiraDomain = Deno.env.get('JIRA_DOMAIN');
    const jiraEmail = Deno.env.get('JIRA_EMAIL');
    const jiraApiToken = Deno.env.get('JIRA_API_TOKEN');

    if (!jiraDomain || !jiraEmail || !jiraApiToken) {
      throw new Error('JIRA credentials not configured');
    }

    const auth = btoa(`${jiraEmail}:${jiraApiToken}`);
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const { action = 'dashboard' } = await req.json().catch(() => ({}));

    if (action === 'dashboard') {
      // Fields to fetch - matching PHP implementation
      const requiredFields = [
        'summary', 'status', 'created', 'duedate', 'parent', 'issuetype', 'subtasks',
        FIELD_MAPPINGS.customer,
        FIELD_MAPPINGS.agent,
        FIELD_MAPPINGS.accountManager,
        FIELD_MAPPINGS.orderTotal,
        FIELD_MAPPINGS.grossOrderTotal,
        FIELD_MAPPINGS.depositAmount,
        FIELD_MAPPINGS.remainingAmount,
        FIELD_MAPPINGS.finalPaymentDue,
        FIELD_MAPPINGS.commissionDue,
        FIELD_MAPPINGS.commissionPercent,
        FIELD_MAPPINGS.quantityOrdered,
        FIELD_MAPPINGS.salesOrderNumber,
        FIELD_MAPPINGS.productName,
        FIELD_MAPPINGS.dateOrdered,
        FIELD_MAPPINGS.startDate,
        FIELD_MAPPINGS.estShipDate,
        FIELD_MAPPINGS.actualShipDate,
        FIELD_MAPPINGS.daysInProduction,
        FIELD_MAPPINGS.orderHealth,
        FIELD_MAPPINGS.healthField,
        FIELD_MAPPINGS.depositReceivedDate,
        FIELD_MAPPINGS.finalPaymentReceivedDate,
      ];
      
      // JQL for Active Orders (excludes cancelled and completed statuses)
      const activeOrdersJql = 'project = CM AND type = "Order" AND status NOT IN (Cancelled, "Final Product Shipped", "In Quote Requirements", "Partial Shipment", "On Hold") ORDER BY created DESC';
      
      // JQL for Order Health pie chart (all orders except cancelled)
      const orderHealthJql = 'project = CM AND type = "Order" AND status != Cancelled ORDER BY created DESC';
      
      // JQL for Active Customers
      const activeCustomersJql = 'project = CUS AND status = Active ORDER BY created DESC';
      
      // Fetch Active Orders
      console.log('Fetching Active Orders...');
      const activeOrderIssues = await fetchAllIssues(jiraDomain, headers, activeOrdersJql, requiredFields);
      console.log(`Fetched ${activeOrderIssues.length} active orders`);
      
      // Fetch Order Health orders (all non-cancelled orders)
      console.log('Fetching Order Health orders...');
      const orderHealthIssues = await fetchAllIssues(jiraDomain, headers, orderHealthJql, requiredFields);
      console.log(`Fetched ${orderHealthIssues.length} orders for health chart`);
      
      // Fetch Active Customers from CUS project
      console.log('Fetching Active Customers...');
      const customerFields = ['summary', 'status', 'created'];
      let activeCustomerIssues: any[] = [];
      try {
        activeCustomerIssues = await fetchAllIssues(jiraDomain, headers, activeCustomersJql, customerFields);
      } catch (e) {
        console.log('CUS project fetch failed, continuing with empty:', e);
      }
      console.log(`Fetched ${activeCustomerIssues.length} active customers`);
      
      // Fetch ALL WEB epics (for popup display with all statuses)
      const webJql = 'project = "WEB" AND issuetype = Epic ORDER BY created DESC';
      const webFields = [
        'summary', 'status', 'created', 'duedate', 'subtasks',
        FIELD_MAPPINGS.totalChildItems,
        FIELD_MAPPINGS.totalBugs,
        FIELD_MAPPINGS.devLead,
        FIELD_MAPPINGS.projectLead,
        FIELD_MAPPINGS.projectHealth,
      ];
      
      let webIssues: any[] = [];
      try {
        webIssues = await fetchAllIssues(jiraDomain, headers, webJql, webFields);
      } catch (e) {
        console.log('WEB project fetch failed, continuing with empty:', e);
      }
      console.log(`Fetched ${webIssues.length} WEB epics`);
      
      // Fetch Active Development Projects for the dashboard count (excludes Cancelled, Done, Open)
      const activeDevelopmentJql = 'project = WEB AND type = Epic AND status NOT IN (Cancelled, Done, Open) ORDER BY created DESC';
      let activeDevelopmentIssues: any[] = [];
      try {
        activeDevelopmentIssues = await fetchAllIssues(jiraDomain, headers, activeDevelopmentJql, webFields);
      } catch (e) {
        console.log('Active development projects fetch failed, continuing with empty:', e);
      }
      console.log(`Fetched ${activeDevelopmentIssues.length} active development projects`);

      // Helper function to transform issue to order
      const transformIssueToOrder = (issue: any) => {
        const fields = issue.fields || {};
        const issueType = fields.issuetype?.name || '';
        
        const quotedOrderTotal = parseFloat(fields[FIELD_MAPPINGS.orderTotal]) || 0;
        const rawGrossOrderTotal = fields[FIELD_MAPPINGS.grossOrderTotal];
        const grossOrderTotal = parseFloat(rawGrossOrderTotal) || 0;
        
        // Debug log for CM-1297 to verify field is coming through
        if (issue.key === 'CM-1297') {
          console.log(`CM-1297 Debug: rawGrossOrderTotal=${JSON.stringify(rawGrossOrderTotal)}, parsed=${grossOrderTotal}, quotedOrderTotal=${quotedOrderTotal}`);
        }
        
        // Use Gross Order Total if available, otherwise fall back to Quoted Order Total
        const orderTotal = grossOrderTotal || quotedOrderTotal;
        const depositAmount = parseFloat(fields[FIELD_MAPPINGS.depositAmount]) || 0;
        // Use JIRA's remainingAmount field directly - if it's 0 or not set, the order is paid
        const remainingAmountFromJira = parseFloat(fields[FIELD_MAPPINGS.remainingAmount]);
        const remainingDue = !isNaN(remainingAmountFromJira) ? remainingAmountFromJira : Math.max(0, orderTotal - depositAmount);
        const finalPaymentDue = parseFloat(fields[FIELD_MAPPINGS.finalPaymentDue]) || 0;
        
        // Extract customer name from various formats
        const customerName = extractCustomerName(fields[FIELD_MAPPINGS.customer]);
        
        // Extract agent name
        const rawAgent = fields[FIELD_MAPPINGS.agent];
        let agentName = null;
        if (rawAgent) {
          agentName = rawAgent.displayName || rawAgent.value || rawAgent.name || 
                      (typeof rawAgent === 'string' ? rawAgent : null);
        }
        
        // Get order health from dedicated field (customfield_10897)
        const healthFieldValue = fields[FIELD_MAPPINGS.orderHealth];
        let orderHealth = 'on-track';
        if (healthFieldValue) {
          const healthValue = (healthFieldValue.value || healthFieldValue || '').toLowerCase();
          if (healthValue.includes('off track') || healthValue.includes('off-track')) {
            orderHealth = 'off-track';
          } else if (healthValue.includes('at risk') || healthValue.includes('at-risk')) {
            orderHealth = 'at-risk';
          } else if (healthValue.includes('complete')) {
            orderHealth = 'complete';
          } else if (healthValue.includes('pending deposit') || healthValue.includes('pending-deposit')) {
            orderHealth = 'pending-deposit';
          } else if (healthValue.includes('on hold') || healthValue.includes('on-hold')) {
            orderHealth = 'on-hold';
          } else if (healthValue.includes('white label') || healthValue.includes('white-label')) {
            orderHealth = 'white-label';
          } else if (healthValue.includes('on track') || healthValue.includes('on-track')) {
            orderHealth = 'on-track';
          }
        }
        
        // Parse dates
        const startDate = fields[FIELD_MAPPINGS.startDate] || fields[FIELD_MAPPINGS.dateOrdered] || fields.created?.substring(0, 10);
        const estShipDate = fields[FIELD_MAPPINGS.estShipDate] || fields.duedate;

        return {
          id: issue.key,
          issueType,
          salesOrderNumber: fields[FIELD_MAPPINGS.salesOrderNumber] || issue.key,
          customer: customerName,
          productName: fields[FIELD_MAPPINGS.productName] || fields.summary || 'Unknown Product',
          quantityOrdered: parseFloat(fields[FIELD_MAPPINGS.quantityOrdered]) || 0,
          quotedOrderTotal: quotedOrderTotal, // Quoted Order Total from Jira (customfield_11567)
          grossOrderTotal: grossOrderTotal, // Gross Order Total from Jira (customfield_11663)
          orderTotal, // Gross Order Total (or Quoted if Gross is 0) - used for calculations
          depositAmount,
          finalPayment: orderTotal - depositAmount,
          remainingDue,
          finalPaymentDue,
          commissionDue: parseFloat(fields[FIELD_MAPPINGS.commissionDue]) || 0,
          commissionPercent: parseFloat(fields[FIELD_MAPPINGS.commissionPercent]) || 0,
          startDate,
          dueDate: fields.duedate,
          estShipDate,
          actualShipDate: fields[FIELD_MAPPINGS.actualShipDate],
          currentStatus: fields.status?.name || 'Unknown',
          // Expected Status should be based on the order's Due Date (not EST Ship Date)
          expectedStatus: calculateExpectedStatus(startDate, fields.duedate),
          orderHealth,
          daysBehindSchedule: calculateDaysBehind(fields),
          daysInProduction: parseFloat(fields[FIELD_MAPPINGS.daysInProduction]) || calculateDaysInProduction(fields, startDate),
          agent: agentName,
          accountManager: fields[FIELD_MAPPINGS.accountManager]?.displayName || null,
          orderNotes: '',
          depositReceivedDate: fields[FIELD_MAPPINGS.depositReceivedDate] || null,
          finalPaymentReceivedDate: fields[FIELD_MAPPINGS.finalPaymentReceivedDate] || null,
        };
      };

      // Transform Active Orders (for Active Orders popup - excludes cancelled/completed)
      const activeOrders = activeOrderIssues.map(transformIssueToOrder);
      console.log(`Active orders transformed: ${activeOrders.length}`);

      // Transform Order Health orders (all non-cancelled orders - for pie chart)
      const orderHealthOrders = orderHealthIssues.map(transformIssueToOrder);
      console.log(`Order health orders transformed: ${orderHealthOrders.length}`);

      // Extract Active Customers from CUS project with order counts
      const activeCustomers = activeCustomerIssues.map((issue: any) => {
        const customerName = issue.fields?.summary || 'Unknown Customer';
        
        // Count total orders (from orderHealthOrders - all non-cancelled orders)
        const totalOrders = orderHealthOrders.filter((o: any) => 
          o.customer?.toLowerCase() === customerName.toLowerCase()
        ).length;
        
        // Count active orders (from activeOrders - excludes completed/cancelled)
        const activeOrdersCount = activeOrders.filter((o: any) => 
          o.customer?.toLowerCase() === customerName.toLowerCase()
        ).length;
        
        return {
          id: issue.key,
          name: customerName,
          status: issue.fields?.status?.name || 'Unknown',
          totalOrders,
          activeOrders: activeOrdersCount,
        };
      });
      console.log(`Active customers from CUS project: ${activeCustomers.length}`);

      // Calculate all-time outstanding from order health orders
      const allTimeOutstandingOrders = orderHealthOrders
        .filter((o: any) => {
          // For "12 - Finished Goods Testing", use finalPaymentDue; otherwise use remainingDue
          const outstandingAmount = o.currentStatus === '12 - Finished Goods Testing' 
            ? (o.finalPaymentDue || 0) 
            : (o.remainingDue || 0);
          return outstandingAmount > 0;
        })
        .map((o: any) => ({
          id: o.id,
          salesOrderNumber: o.salesOrderNumber,
          customer: o.customer,
          productName: o.productName,
          currentStatus: o.currentStatus,
          orderTotal: o.orderTotal,
          depositAmount: o.depositAmount,
          remainingDue: o.remainingDue,
          finalPaymentDue: o.finalPaymentDue,
          estShipDate: o.estShipDate,
        }));
      
      const allTimeOutstanding = allTimeOutstandingOrders.reduce((sum: number, o: any) => {
        // For "12 - Finished Goods Testing", use finalPaymentDue; otherwise use remainingDue
        const amount = o.currentStatus === '12 - Finished Goods Testing' 
          ? (o.finalPaymentDue || 0) 
          : (o.remainingDue || 0);
        return sum + amount;
      }, 0);
      console.log(`All-time outstanding from ${allTimeOutstandingOrders.length} orders: $${allTimeOutstanding}`);

      // Transform WEB epics
      const webProjects = webIssues.map((issue: any) => {
        const fields = issue.fields || {};
        
        // Extract dev lead name
        const devLeadField = fields[FIELD_MAPPINGS.devLead];
        const devLead = devLeadField?.displayName || devLeadField?.name || devLeadField?.value || null;
        
        // Extract project lead name
        const projectLeadField = fields[FIELD_MAPPINGS.projectLead];
        const projectLead = projectLeadField?.displayName || projectLeadField?.name || projectLeadField?.value || null;
        
        // Extract project health
        const projectHealthField = fields[FIELD_MAPPINGS.projectHealth];
        const projectHealth = projectHealthField?.value || projectHealthField?.name || projectHealthField || null;
        
        return {
          id: issue.key,
          epicName: fields.summary || 'Unknown Epic',
          epicKey: issue.key,
          status: mapEpicStatus(fields.status?.name),
          totalTasks: fields.subtasks?.length || 0,
          notStarted: 0, inProgress: 0, completed: 0, percentComplete: 0,
          startDate: fields.created?.substring(0, 10),
          dueDate: fields.duedate,
          isOffTrack: false,
          totalChildItems: parseFloat(fields[FIELD_MAPPINGS.totalChildItems]) || 0,
          totalBugs: parseFloat(fields[FIELD_MAPPINGS.totalBugs]) || 0,
          devLead,
          projectLead,
          projectHealth: typeof projectHealth === 'string' ? projectHealth : null,
        };
      });

      // Get unique customers from active orders for dropdown filters
      const uniqueCustomersFromOrders = [...new Set(activeOrders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown'))];
      
      const summary = {
        // Active Customers count from CUS project
        totalActiveCustomers: activeCustomers.length,
        // Active Orders count from filtered query
        totalActiveOrders: activeOrders.length,
        totalMonthlyRevenue: orderHealthOrders.reduce((sum: number, o: any) => sum + (o.orderTotal || 0), 0),
        totalOutstandingPayments: orderHealthOrders.reduce((sum: number, o: any) => sum + (o.remainingDue || 0), 0),
        allTimeOutstandingPayments: allTimeOutstanding,
        totalCommissionsDue: orderHealthOrders.reduce((sum: number, o: any) => sum + (o.commissionDue || 0), 0),
        totalActiveProjects: activeDevelopmentIssues.length, // Count from JQL: status NOT IN (Cancelled, Done, Open)
        // Order Health breakdown from orderHealthOrders (all non-cancelled orders)
        orderHealthBreakdown: {
          onTrack: orderHealthOrders.filter((o: any) => o.orderHealth === 'on-track').length,
          atRisk: orderHealthOrders.filter((o: any) => o.orderHealth === 'at-risk').length,
          offTrack: orderHealthOrders.filter((o: any) => o.orderHealth === 'off-track').length,
          complete: orderHealthOrders.filter((o: any) => o.orderHealth === 'complete').length,
          pendingDeposit: orderHealthOrders.filter((o: any) => o.orderHealth === 'pending-deposit').length,
          onHold: orderHealthOrders.filter((o: any) => o.orderHealth === 'on-hold').length,
          whiteLabel: orderHealthOrders.filter((o: any) => o.orderHealth === 'white-label').length,
        },
      };

      console.log(`Summary: ${activeOrders.length} active orders, ${activeCustomers.length} active customers, $${summary.totalMonthlyRevenue} revenue`);

      return new Response(JSON.stringify({
        success: true,
        data: {
          summary,
          orders: activeOrders, // Active orders for the popup
          orderHealthOrders, // All non-cancelled orders for health chart
          activeCustomers, // Active customers from CUS project
          allTimeOutstandingOrders,
          webProjects,
          customers: ['All Customers', ...uniqueCustomersFromOrders.sort()],
          agents: ['All Agents', ...new Set(activeOrders.map((o: any) => o.agent).filter(Boolean))],
          accountManagers: ['All Account Managers', ...new Set(activeOrders.map((o: any) => o.accountManager).filter(Boolean))],
          lastSynced: new Date().toISOString(),
          totalOrdersInJira: orderHealthIssues.length,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fields') {
      const fieldsResponse = await fetch(`https://${jiraDomain}/rest/api/3/field`, { headers });
      if (!fieldsResponse.ok) throw new Error(`JIRA API error: ${fieldsResponse.status}`);
      return new Response(JSON.stringify({ success: true, fields: await fieldsResponse.json() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateDaysBehind(fields: any): number {
  const dueDate = fields.duedate ? new Date(fields.duedate) : null;
  if (!dueDate) return 0;
  const daysDiff = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 0 ? daysDiff : 0;
}

function calculateDaysInProduction(fields: any, startDate: string | null): number {
  const start = startDate || fields.customfield_10040 || fields.created?.substring(0, 10);
  if (!start) return 0;
  return Math.ceil((Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
}

// Map raw Jira status to standardized EpicStatus values
function mapEpicStatus(status: string): string {
  const lower = status?.toLowerCase() || '';
  
  // Map to exact status values expected by frontend
  // IMPORTANT: Check "continuous development" BEFORE generic "development" to avoid false match
  if (lower === 'open' || lower.includes('to do') || lower.includes('backlog')) return 'Open';
  if (lower.includes('requirements') || lower.includes('requirement')) return 'In Requirements';
  if (lower.includes('design') && !lower.includes('development')) return 'In Design';
  if (lower.includes('continuous development')) return 'Continuous Development';
  if (lower.includes('website development') || lower.includes('development') || lower.includes('in progress')) return 'In Website Development';
  if (lower.includes('qa') || lower.includes('testing') || lower.includes('review')) return 'In Final QA Testing';
  if (lower.includes('done') || lower.includes('complete') || lower.includes('closed')) return 'Done';
  if (lower.includes('hold') || lower.includes('blocked') || lower.includes('paused')) return 'On Hold';
  if (lower.includes('cancel')) return 'Canceled';
  
  // Return raw status if no mapping found (will be displayed as-is)
  return status || 'Open';
}
