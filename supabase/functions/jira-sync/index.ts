import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JIRA custom field mappings - VERIFIED from API
const FIELD_MAPPINGS = {
  // Core fields
  customer: 'customfield_10038',           // Customer (Dropdown) - use .value
  agent: 'customfield_11573',              // Agent (Dropdown) - use .value
  accountManager: 'customfield_11393',     // Account Manager (User Picker) - use .displayName
  
  // Financial fields
  orderTotal: 'customfield_11567',         // Order Total (Number)
  depositAmount: 'customfield_10074',      // Deposit Amount (Number)
  remainingAmount: 'customfield_11569',    // Remaining Amount (Number)
  commissionDue: 'customfield_11577',      // Commission Due (Number)
  
  // Order fields
  quantityOrdered: 'customfield_10073',    // Quantity Ordered (Number)
  salesOrderNumber: 'customfield_10113',   // Sales Order # (Text)
  productName: 'customfield_10115',        // Product Name (Text)
  productId: 'customfield_10732',          // Product_ID (Text)
  
  // Date fields
  dateOrdered: 'customfield_10040',        // Date Ordered
  actualShipDate: 'customfield_11161',     // Actual Ship Date
  commissionPaidDate: 'customfield_11578', // Commission Paid (Date)
  
  // Production fields
  daysInProduction: 'customfield_10930',   // Days In Production (Number)
};

// Statuses that indicate an order is cancelled/not active
const CANCELLED_STATUSES = ['cancelled', 'canceled', 'done', 'shipped', 'complete', 'completed', 'closed'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const jiraDomain = Deno.env.get('JIRA_DOMAIN');
    const jiraEmail = Deno.env.get('JIRA_EMAIL');
    const jiraApiToken = Deno.env.get('JIRA_API_TOKEN');

    if (!jiraDomain || !jiraEmail || !jiraApiToken) {
      console.error('Missing JIRA credentials');
      throw new Error('JIRA credentials not configured');
    }

    console.log(`Connecting to JIRA at ${jiraDomain}...`);

    // Create Basic Auth header
    const auth = btoa(`${jiraEmail}:${jiraApiToken}`);
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const { action = 'dashboard' } = await req.json().catch(() => ({}));

    if (action === 'dashboard') {
      // Fetch ALL Contract Manufacturing issues using pagination
      const cmJql = 'project = "CM" ORDER BY created DESC';
      let allCmIssues: any[] = [];
      let startAt = 0;
      const maxPerPage = 100;
      let totalIssues = 0;
      
      do {
        const cmResponse = await fetch(
          `https://${jiraDomain}/rest/api/3/search/jql`,
          { 
            method: 'POST',
            headers,
            body: JSON.stringify({
              jql: cmJql,
              maxResults: maxPerPage,
              startAt: startAt,
              fields: ['*all'],
            }),
          }
        );

        if (!cmResponse.ok) {
          const errorText = await cmResponse.text();
          console.error('JIRA CM API error:', cmResponse.status, errorText);
          throw new Error(`JIRA API error: ${cmResponse.status}`);
        }

        const cmData = await cmResponse.json();
        totalIssues = cmData.total || 0;
        allCmIssues = [...allCmIssues, ...(cmData.issues || [])];
        startAt += maxPerPage;
        console.log(`Fetched ${allCmIssues.length}/${totalIssues} CM issues...`);
      } while (startAt < totalIssues);
      
      console.log(`Total CM issues fetched: ${allCmIssues.length}`);

      // Fetch Web Development issues (Epics) using new JQL search API
      const webJql = 'project = "WEB" AND issuetype = Epic ORDER BY created DESC';
      const webResponse = await fetch(
        `https://${jiraDomain}/rest/api/3/search/jql`,
        { 
          method: 'POST',
          headers,
          body: JSON.stringify({
            jql: webJql,
            maxResults: 50,
            fields: ['*all'],
          }),
        }
      );

      if (!webResponse.ok) {
        const errorText = await webResponse.text();
        console.error('JIRA WEB API error:', webResponse.status, errorText);
        throw new Error(`JIRA API error: ${webResponse.status}`);
      }

      const webData = await webResponse.json();
      console.log(`Fetched ${webData.issues?.length || 0} WEB epics`);

      // Transform CM issues to orders
      const orders = allCmIssues.map((issue: any) => {
        const fields = issue.fields;
        
        // Extract customer name from dropdown field
        const customerValue = fields[FIELD_MAPPINGS.customer]?.value || 'Unknown';
        
        // Extract agent from dropdown field  
        const agentValue = fields[FIELD_MAPPINGS.agent]?.value || null;
        
        // Extract account manager from user picker field
        const accountManagerValue = fields[FIELD_MAPPINGS.accountManager]?.displayName || null;
        
        // Extract financial values
        const orderTotal = fields[FIELD_MAPPINGS.orderTotal] || 0;
        const depositAmount = fields[FIELD_MAPPINGS.depositAmount] || 0;
        const remainingAmount = fields[FIELD_MAPPINGS.remainingAmount] || (orderTotal - depositAmount);
        
        // Extract other fields
        const productName = fields[FIELD_MAPPINGS.productName] || fields.summary || 'Unknown Product';
        const salesOrderNumber = fields[FIELD_MAPPINGS.salesOrderNumber] || issue.key;
        
        // Extract commission due
        const commissionDue = fields[FIELD_MAPPINGS.commissionDue] || 0;
        
        return {
          id: issue.key,
          salesOrderNumber: salesOrderNumber,
          customer: customerValue,
          productName: productName,
          quantityOrdered: fields[FIELD_MAPPINGS.quantityOrdered] || 0,
          orderTotal: orderTotal,
          depositAmount: depositAmount,
          finalPayment: orderTotal - depositAmount,
          remainingDue: remainingAmount,
          commissionDue: commissionDue,
          startDate: fields[FIELD_MAPPINGS.dateOrdered] || fields.created?.substring(0, 10),
          dueDate: fields.duedate,
          estShipDate: fields.duedate,
          actualShipDate: fields[FIELD_MAPPINGS.actualShipDate],
          currentStatus: fields.status?.name || 'Unknown',
          expectedStatus: fields.status?.name || 'Unknown',
          orderHealth: getOrderHealth(fields),
          daysBehindSchedule: calculateDaysBehind(fields),
          daysInProduction: fields[FIELD_MAPPINGS.daysInProduction] || calculateDaysInProduction(fields),
          agent: agentValue,
          accountManager: accountManagerValue,
          orderNotes: fields.description?.content?.[0]?.content?.[0]?.text || '',
        };
      });

      // Transform WEB epics to projects
      const webProjects = (webData.issues || []).map((issue: any) => {
        const fields = issue.fields;
        return {
          id: issue.key,
          epicName: fields.summary || 'Unknown Epic',
          epicKey: issue.key,
          status: mapEpicStatus(fields.status?.name),
          totalTasks: fields.subtasks?.length || 0,
          notStarted: 0,
          inProgress: 0,
          completed: 0,
          percentComplete: 0,
          startDate: fields.created?.substring(0, 10),
          dueDate: fields.duedate,
          isOffTrack: false,
        };
      });

      // Filter active orders (exclude cancelled/completed statuses)
      const activeOrders = orders.filter((o: any) => {
        const status = o.currentStatus?.toLowerCase() || '';
        return !CANCELLED_STATUSES.some(s => status.includes(s));
      });

      // Calculate summary metrics
      const totalCommissionsDue = orders.reduce((sum: number, o: any) => sum + (o.commissionDue || 0), 0);
      
      const summary = {
        totalActiveCustomers: new Set(activeOrders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown')).size,
        totalActiveOrders: activeOrders.length,
        totalMonthlyRevenue: orders.reduce((sum: number, o: any) => sum + (o.orderTotal || 0), 0),
        totalOutstandingPayments: orders.reduce((sum: number, o: any) => sum + (o.remainingDue || 0), 0),
        totalCommissionsDue: totalCommissionsDue,
        totalActiveProjects: webProjects.filter((p: any) => p.status === 'active').length,
        orderHealthBreakdown: {
          onTrack: activeOrders.filter((o: any) => o.orderHealth === 'on-track').length,
          atRisk: activeOrders.filter((o: any) => o.orderHealth === 'at-risk').length,
          offTrack: activeOrders.filter((o: any) => o.orderHealth === 'off-track').length,
        },
      };
      
      console.log(`Total orders: ${orders.length}, Active orders: ${activeOrders.length}, Commission Due: $${totalCommissionsDue}`);

      // Get unique customers and agents for filters (excluding empty/Unknown values)
      const customers = ['All Customers', ...new Set(orders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown'))];
      const agents = ['All Agents', ...new Set(orders.map((o: any) => o.agent).filter(Boolean))];
      const accountManagers = ['All Account Managers', ...new Set(orders.map((o: any) => o.accountManager).filter(Boolean))];

      console.log('Dashboard data compiled successfully');
      console.log(`Unique customers: ${customers.length - 1}, Agents: ${agents.length - 1}, Account Managers: ${accountManagers.length - 1}`);

      return new Response(JSON.stringify({
        success: true,
        data: {
          summary,
          orders,
          webProjects,
          customers,
          agents,
          accountManagers,
          lastSynced: new Date().toISOString(),
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch fields endpoint for debugging
    if (action === 'fields') {
      const fieldsResponse = await fetch(
        `https://${jiraDomain}/rest/api/3/field`,
        { headers }
      );

      if (!fieldsResponse.ok) {
        throw new Error(`JIRA API error: ${fieldsResponse.status}`);
      }

      const fieldsData = await fieldsResponse.json();
      console.log(`Fetched ${fieldsData.length} JIRA fields`);

      return new Response(JSON.stringify({
        success: true,
        fields: fieldsData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in jira-sync function:', errorMessage);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function getOrderHealth(fields: any): 'on-track' | 'at-risk' | 'off-track' {
  // Check custom field for order health if available
  const healthField = fields.customfield_10083?.value?.toLowerCase();
  if (healthField) {
    if (healthField.includes('off') || healthField.includes('behind')) return 'off-track';
    if (healthField.includes('risk') || healthField.includes('warning')) return 'at-risk';
    return 'on-track';
  }

  // Fallback: calculate based on due date and status
  const dueDate = fields.duedate ? new Date(fields.duedate) : null;
  const now = new Date();
  
  if (!dueDate) return 'on-track';
  
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) return 'off-track';
  if (daysUntilDue < 7) return 'at-risk';
  return 'on-track';
}

function calculateDaysBehind(fields: any): number {
  const dueDate = fields.duedate ? new Date(fields.duedate) : null;
  if (!dueDate) return 0;
  
  const now = new Date();
  const daysDiff = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff > 0 ? daysDiff : 0;
}

function calculateDaysInProduction(fields: any): number {
  const startDate = fields.customfield_10040 || fields.created?.substring(0, 10);
  if (!startDate) return 0;
  
  const start = new Date(startDate);
  const now = new Date();
  
  return Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function mapEpicStatus(status: string): 'active' | 'on-hold' | 'complete' {
  const lower = status?.toLowerCase() || '';
  if (lower.includes('done') || lower.includes('complete') || lower.includes('closed')) return 'complete';
  if (lower.includes('hold') || lower.includes('blocked') || lower.includes('paused')) return 'on-hold';
  return 'active';
}
