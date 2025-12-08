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

    const { action = 'dashboard', filters = {} } = await req.json().catch(() => ({}));

    if (action === 'dashboard') {
      const { customer, agent, accountManager, dateFrom } = filters;
      
      // Build JQL query based on filters
      const jqlParts = ['project = "CM"'];
      
      // Date filter - default to last 6 months if not specified
      let dateFilter = dateFrom;
      if (!dateFilter) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        dateFilter = sixMonthsAgo.toISOString().split('T')[0];
      }
      jqlParts.push(`created >= "${dateFilter}"`);
      
      // Customer filter via JQL if specified
      if (customer && customer !== 'All Customers') {
        jqlParts.push(`"Customer" = "${customer}"`);
      }
      
      const cmJql = jqlParts.join(' AND ') + ' ORDER BY created DESC';
      console.log('JQL Query:', cmJql);
      
      // Only fetch the fields we actually need (not *all) to reduce memory
      const requiredFields = [
        'summary', 'status', 'created', 'duedate', 'description',
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
        FIELD_MAPPINGS.productId,
        FIELD_MAPPINGS.dateOrdered,
        FIELD_MAPPINGS.actualShipDate,
        FIELD_MAPPINGS.commissionPaidDate,
        FIELD_MAPPINGS.daysInProduction,
      ];
      
      let allCmIssues: any[] = [];
      let startAt = 0;
      const maxPerPage = 100;
      let fetchedCount = 0;
      
      do {
        let retries = 0;
        const maxRetries = 3;
        let cmResponse: Response | null = null;
        
        while (retries < maxRetries) {
          cmResponse = await fetch(
            `https://${jiraDomain}/rest/api/3/search/jql?startAt=${startAt}`,
            { 
              method: 'POST',
              headers,
              body: JSON.stringify({
                jql: cmJql,
                maxResults: maxPerPage,
                fields: requiredFields,
              }),
            }
          );
          
          if (cmResponse.status === 429) {
            retries++;
            const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(`Rate limited (429), waiting ${waitTime}ms before retry ${retries}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          break;
        }

        if (!cmResponse || !cmResponse.ok) {
          const errorText = cmResponse ? await cmResponse.text() : 'No response';
          console.error('JIRA CM API error:', cmResponse?.status, errorText);
          
          if (cmResponse?.status === 429) {
            throw new Error('JIRA rate limit exceeded. Please wait a few minutes and try again.');
          }
          throw new Error(`JIRA API error: ${cmResponse?.status}`);
        }

        const cmData = await cmResponse.json();
        const issues = cmData.issues || [];
        fetchedCount = issues.length;
        allCmIssues = [...allCmIssues, ...issues];
        startAt += maxPerPage;
        console.log(`Fetched batch of ${fetchedCount}, total so far: ${allCmIssues.length}`);
      } while (fetchedCount === maxPerPage);
      
      console.log(`Total CM issues fetched: ${allCmIssues.length}`);

      // Fetch Web Development issues (Epics)
      const webJql = 'project = "WEB" AND issuetype = Epic ORDER BY created DESC';
      const webResponse = await fetch(
        `https://${jiraDomain}/rest/api/3/search/jql`,
        { 
          method: 'POST',
          headers,
          body: JSON.stringify({
            jql: webJql,
            maxResults: 50,
            fields: ['summary', 'status', 'created', 'duedate', 'subtasks'],
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
        
        const customerValue = fields[FIELD_MAPPINGS.customer]?.value || 'Unknown';
        const agentValue = fields[FIELD_MAPPINGS.agent]?.value || null;
        const accountManagerValue = fields[FIELD_MAPPINGS.accountManager]?.displayName || null;
        
        const orderTotal = fields[FIELD_MAPPINGS.orderTotal] || 0;
        const depositAmount = fields[FIELD_MAPPINGS.depositAmount] || 0;
        const remainingAmount = fields[FIELD_MAPPINGS.remainingAmount] || (orderTotal - depositAmount);
        const productName = fields[FIELD_MAPPINGS.productName] || fields.summary || 'Unknown Product';
        const salesOrderNumber = fields[FIELD_MAPPINGS.salesOrderNumber] || issue.key;
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

      // Apply post-fetch filters for agent and account manager (JQL for these is complex)
      let filteredOrders = orders;
      if (agent && agent !== 'All Agents') {
        filteredOrders = filteredOrders.filter((o: any) => o.agent === agent);
      }
      if (accountManager && accountManager !== 'All Account Managers') {
        filteredOrders = filteredOrders.filter((o: any) => o.accountManager === accountManager);
      }

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

      // Calculate summary metrics from filtered orders
      const totalCommissionsDue = filteredOrders.reduce((sum: number, o: any) => sum + (o.commissionDue || 0), 0);
      
      const summary = {
        totalActiveCustomers: new Set(filteredOrders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown')).size,
        totalActiveOrders: filteredOrders.length,
        totalMonthlyRevenue: filteredOrders.reduce((sum: number, o: any) => sum + (o.orderTotal || 0), 0),
        totalOutstandingPayments: filteredOrders.reduce((sum: number, o: any) => sum + (o.remainingDue || 0), 0),
        totalCommissionsDue: totalCommissionsDue,
        totalActiveProjects: webProjects.filter((p: any) => p.status === 'active').length,
        orderHealthBreakdown: {
          onTrack: filteredOrders.filter((o: any) => o.orderHealth === 'on-track').length,
          atRisk: filteredOrders.filter((o: any) => o.orderHealth === 'at-risk').length,
          offTrack: filteredOrders.filter((o: any) => o.orderHealth === 'off-track').length,
        },
      };
      
      console.log(`Total orders: ${orders.length}, Filtered: ${filteredOrders.length}, Commission Due: $${totalCommissionsDue}`);

      // Get ALL unique customers, agents, managers for filter dropdowns (from unfiltered orders)
      const customers = ['All Customers', ...Array.from(new Set(orders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown'))).sort()];
      const agents = ['All Agents', ...Array.from(new Set(orders.map((o: any) => o.agent).filter(Boolean))).sort()];
      const accountManagers = ['All Account Managers', ...Array.from(new Set(orders.map((o: any) => o.accountManager).filter(Boolean))).sort()];

      console.log('Dashboard data compiled successfully');
      console.log(`Unique customers: ${customers.length - 1}, Agents: ${agents.length - 1}, Account Managers: ${accountManagers.length - 1}`);

      return new Response(JSON.stringify({
        success: true,
        data: {
          summary,
          orders: filteredOrders,
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
  const healthField = fields.customfield_10083?.value?.toLowerCase();
  if (healthField) {
    if (healthField.includes('off') || healthField.includes('behind')) return 'off-track';
    if (healthField.includes('risk') || healthField.includes('warning')) return 'at-risk';
    return 'on-track';
  }

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