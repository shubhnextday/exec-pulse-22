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
  orderTotal: 'customfield_11567',
  depositAmount: 'customfield_10074',
  remainingAmount: 'customfield_11569',
  commissionDue: 'customfield_11577',
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
  
  // Total duration of the order
  const totalDuration = due.getTime() - start.getTime();
  if (totalDuration <= 0) return 'Final Product Shipped';
  
  // Elapsed time
  const elapsed = now.getTime() - start.getTime();
  
  // Calculate expected percentage complete
  const expectedPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  
  // If past due date, expected status is Final Product Shipped
  if (expectedPercent >= 100) return 'Final Product Shipped';
  
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
      // Use full project name like PHP: "Contract Manufacturing"
      const cmJql = 'project = "Contract Manufacturing"';
      
      // Fields to fetch - matching PHP implementation
      const requiredFields = [
        'summary', 'status', 'created', 'duedate', 'parent', 'issuetype', 'subtasks',
        FIELD_MAPPINGS.customer,
        FIELD_MAPPINGS.agent,
        FIELD_MAPPINGS.accountManager,
        FIELD_MAPPINGS.orderTotal,
        FIELD_MAPPINGS.depositAmount,
        FIELD_MAPPINGS.remainingAmount,
        FIELD_MAPPINGS.commissionDue,
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
      ];
      
      // Fetch ALL CM orders with pagination
      const allCmIssues = await fetchAllIssues(jiraDomain, headers, cmJql, requiredFields);
      
      // Fetch WEB epics
      const webJql = 'project = "WEB" AND issuetype = Epic ORDER BY created DESC';
      const webFields = ['summary', 'status', 'created', 'duedate', 'subtasks'];
      
      let webIssues: any[] = [];
      try {
        webIssues = await fetchAllIssues(jiraDomain, headers, webJql, webFields);
      } catch (e) {
        console.log('WEB project fetch failed, continuing with empty:', e);
      }
      console.log(`Fetched ${webIssues.length} WEB epics`);

      // Transform CM issues to orders
      const orders = allCmIssues.map((issue: any) => {
        const fields = issue.fields || {};
        const issueType = fields.issuetype?.name || '';
        
        // Skip non-Order issue types for main order list
        // (Design Order and Packaging are child items)
        
        const orderTotal = parseFloat(fields[FIELD_MAPPINGS.orderTotal]) || 0;
        const depositAmount = parseFloat(fields[FIELD_MAPPINGS.depositAmount]) || 0;
        const remainingDue = parseFloat(fields[FIELD_MAPPINGS.remainingAmount]) || (orderTotal - depositAmount);
        
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
          if (healthValue.includes('off') || healthValue.includes('behind')) {
            orderHealth = 'off-track';
          } else if (healthValue.includes('risk') || healthValue.includes('warning')) {
            orderHealth = 'at-risk';
          } else if (healthValue.includes('white label') || healthValue.includes('on hold') || healthValue.includes('pending')) {
            orderHealth = 'on-track'; // Neutral
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
          orderTotal,
          depositAmount,
          finalPayment: orderTotal - depositAmount,
          remainingDue,
          commissionDue: parseFloat(fields[FIELD_MAPPINGS.commissionDue]) || 0,
          startDate,
          dueDate: fields.duedate,
          estShipDate,
          actualShipDate: fields[FIELD_MAPPINGS.actualShipDate],
          currentStatus: fields.status?.name || 'Unknown',
          expectedStatus: calculateExpectedStatus(startDate, estShipDate || fields.duedate),
          orderHealth,
          daysBehindSchedule: calculateDaysBehind(fields),
          daysInProduction: parseFloat(fields[FIELD_MAPPINGS.daysInProduction]) || calculateDaysInProduction(fields, startDate),
          agent: agentName,
          accountManager: fields[FIELD_MAPPINGS.accountManager]?.displayName || null,
          orderNotes: '',
        };
      });

      // Filter to only Order type issues (not Design Order or Packaging)
      const orderTypeOrders = orders.filter((o: any) => 
        o.issueType === 'Order' || o.issueType === '' || !o.issueType
      );
      
      console.log(`Total orders: ${orders.length}, Order type: ${orderTypeOrders.length}`);

      // Filter active orders (exclude cancelled/completed)
      const activeOrders = orderTypeOrders.filter((o: any) => {
        const status = (o.currentStatus || '').toLowerCase();
        return !CANCELLED_STATUSES.some(s => status.includes(s));
      });

      // Calculate all-time outstanding (from all orders with remaining due > 0)
      const allTimeOutstandingOrders = orders
        .filter((o: any) => o.remainingDue > 0)
        .map((o: any) => ({
          id: o.id,
          salesOrderNumber: o.salesOrderNumber,
          customer: o.customer,
          productName: o.productName,
          currentStatus: o.currentStatus,
          orderTotal: o.orderTotal,
          depositAmount: o.depositAmount,
          remainingDue: o.remainingDue,
          estShipDate: o.estShipDate,
        }));
      
      const allTimeOutstanding = allTimeOutstandingOrders.reduce((sum: number, o: any) => sum + o.remainingDue, 0);
      console.log(`All-time outstanding from ${allTimeOutstandingOrders.length} orders: $${allTimeOutstanding}`);

      // Transform WEB epics
      const webProjects = webIssues.map((issue: any) => ({
        id: issue.key,
        epicName: issue.fields?.summary || 'Unknown Epic',
        epicKey: issue.key,
        status: mapEpicStatus(issue.fields?.status?.name),
        totalTasks: issue.fields?.subtasks?.length || 0,
        notStarted: 0, inProgress: 0, completed: 0, percentComplete: 0,
        startDate: issue.fields?.created?.substring(0, 10),
        dueDate: issue.fields?.duedate,
        isOffTrack: false,
      }));

      // Get unique customers from all orders (not just active)
      const uniqueCustomers = [...new Set(orderTypeOrders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown'))];
      
      const summary = {
        totalActiveCustomers: new Set(activeOrders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown')).size,
        totalActiveOrders: activeOrders.length,
        totalMonthlyRevenue: orderTypeOrders.reduce((sum: number, o: any) => sum + (o.orderTotal || 0), 0),
        totalOutstandingPayments: orderTypeOrders.reduce((sum: number, o: any) => sum + (o.remainingDue || 0), 0),
        allTimeOutstandingPayments: allTimeOutstanding,
        totalCommissionsDue: orderTypeOrders.reduce((sum: number, o: any) => sum + (o.commissionDue || 0), 0),
        totalActiveProjects: webProjects.filter((p: any) => p.status === 'active').length,
        orderHealthBreakdown: {
          onTrack: activeOrders.filter((o: any) => o.orderHealth === 'on-track').length,
          atRisk: activeOrders.filter((o: any) => o.orderHealth === 'at-risk').length,
          offTrack: activeOrders.filter((o: any) => o.orderHealth === 'off-track').length,
        },
      };

      console.log(`Summary: ${activeOrders.length} active orders, ${uniqueCustomers.length} unique customers, $${summary.totalMonthlyRevenue} revenue`);

      return new Response(JSON.stringify({
        success: true,
        data: {
          summary,
          orders: orderTypeOrders,
          allTimeOutstandingOrders,
          webProjects,
          customers: ['All Customers', ...uniqueCustomers.sort()],
          agents: ['All Agents', ...new Set(orderTypeOrders.map((o: any) => o.agent).filter(Boolean))],
          accountManagers: ['All Account Managers', ...new Set(orderTypeOrders.map((o: any) => o.accountManager).filter(Boolean))],
          lastSynced: new Date().toISOString(),
          totalOrdersInJira: allCmIssues.length,
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
  if (lower === 'open' || lower.includes('to do') || lower.includes('backlog')) return 'Open';
  if (lower.includes('requirements') || lower.includes('requirement')) return 'In Requirements';
  if (lower.includes('design') && !lower.includes('development')) return 'In Design';
  if (lower.includes('website development') || lower.includes('development') || lower.includes('in progress')) return 'In Website Development';
  if (lower.includes('qa') || lower.includes('testing') || lower.includes('review')) return 'In Final QA Testing';
  if (lower.includes('continuous')) return 'Continuous Development';
  if (lower.includes('done') || lower.includes('complete') || lower.includes('closed')) return 'Done';
  if (lower.includes('hold') || lower.includes('blocked') || lower.includes('paused')) return 'On Hold';
  if (lower.includes('cancel')) return 'Canceled';
  
  // Return raw status if no mapping found (will be displayed as-is)
  return status || 'Open';
}
