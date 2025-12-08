import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JIRA custom field mappings - VERIFIED from API
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
  actualShipDate: 'customfield_11161',
  commissionPaidDate: 'customfield_11578',
  daysInProduction: 'customfield_10930',
};

const CANCELLED_STATUSES = ['cancelled', 'canceled'];
const MAX_ORDERS = 500;
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 2000;

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

    const { action = 'dashboard', filters = {} } = await req.json().catch(() => ({}));

    if (action === 'dashboard') {
      const dateFrom = filters.dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const cmJql = `project = "CM" AND created >= "${dateFrom}" ORDER BY created DESC`;
      console.log('JQL Query:', cmJql);
      
      const requiredFields = [
        'summary', 'status', 'created', 'duedate',
        FIELD_MAPPINGS.customer, FIELD_MAPPINGS.agent, FIELD_MAPPINGS.accountManager,
        FIELD_MAPPINGS.orderTotal, FIELD_MAPPINGS.depositAmount, FIELD_MAPPINGS.remainingAmount,
        FIELD_MAPPINGS.commissionDue, FIELD_MAPPINGS.quantityOrdered, FIELD_MAPPINGS.salesOrderNumber,
        FIELD_MAPPINGS.productName, FIELD_MAPPINGS.dateOrdered, FIELD_MAPPINGS.actualShipDate,
        FIELD_MAPPINGS.daysInProduction, 'customfield_10083'
      ];
      
      // Single request with 500 limit
      const params = new URLSearchParams({
        jql: cmJql,
        maxResults: MAX_ORDERS.toString(),
        fields: requiredFields.join(','),
      });
      
      const cmResponse = await fetchWithRetry(
        `https://${jiraDomain}/rest/api/3/search/jql?${params.toString()}`,
        { method: 'GET', headers }
      );

      if (!cmResponse.ok) {
        const errorText = await cmResponse.text();
        console.error('JIRA CM API error:', cmResponse.status, errorText);
        throw new Error(`JIRA API error: ${cmResponse.status}`);
      }

      const cmData = await cmResponse.json();
      const allCmIssues = cmData.issues || [];
      console.log(`Fetched ${allCmIssues.length} CM issues (limit: ${MAX_ORDERS})`);
      

      // Fetch WEB epics (small dataset) using GET with query params
      const webParams = new URLSearchParams({
        jql: 'project = "WEB" AND issuetype = Epic ORDER BY created DESC',
        maxResults: '50',
        fields: 'summary,status,created,duedate,subtasks',
      });
      
      const webResponse = await fetchWithRetry(
        `https://${jiraDomain}/rest/api/3/search/jql?${webParams.toString()}`,
        { 
          method: 'GET',
          headers,
        }
      );

      const webData = webResponse.ok ? await webResponse.json() : { issues: [] };
      console.log(`Fetched ${webData.issues?.length || 0} WEB epics`);

      // Transform CM issues to orders
      const orders = allCmIssues.map((issue: any) => {
        const fields = issue.fields;
        const orderTotal = fields[FIELD_MAPPINGS.orderTotal] || 0;
        const depositAmount = fields[FIELD_MAPPINGS.depositAmount] || 0;
        
        const rawAgent = fields[FIELD_MAPPINGS.agent];
        if (rawAgent) {
          console.log(`Order ${issue.key} agent field:`, JSON.stringify(rawAgent));
        }
        
        let agentName = null;
        if (rawAgent) {
          agentName = rawAgent.displayName || rawAgent.value || rawAgent.name || 
                      (typeof rawAgent === 'string' ? rawAgent : null);
        }
        
        return {
          id: issue.key,
          salesOrderNumber: fields[FIELD_MAPPINGS.salesOrderNumber] || issue.key,
          customer: fields[FIELD_MAPPINGS.customer]?.value || 'Unknown',
          productName: fields[FIELD_MAPPINGS.productName] || fields.summary || 'Unknown Product',
          quantityOrdered: fields[FIELD_MAPPINGS.quantityOrdered] || 0,
          orderTotal,
          depositAmount,
          finalPayment: orderTotal - depositAmount,
          remainingDue: fields[FIELD_MAPPINGS.remainingAmount] || (orderTotal - depositAmount),
          commissionDue: fields[FIELD_MAPPINGS.commissionDue] || 0,
          startDate: fields[FIELD_MAPPINGS.dateOrdered] || fields.created?.substring(0, 10),
          dueDate: fields.duedate,
          estShipDate: fields.duedate,
          actualShipDate: fields[FIELD_MAPPINGS.actualShipDate],
          currentStatus: fields.status?.name || 'Unknown',
          expectedStatus: fields.status?.name || 'Unknown',
          orderHealth: getOrderHealth(fields),
          daysBehindSchedule: calculateDaysBehind(fields),
          daysInProduction: fields[FIELD_MAPPINGS.daysInProduction] || calculateDaysInProduction(fields),
          agent: agentName,
          accountManager: fields[FIELD_MAPPINGS.accountManager]?.displayName || null,
          orderNotes: '',
        };
      });

      // Transform WEB epics
      const webProjects = (webData.issues || []).map((issue: any) => ({
        id: issue.key,
        epicName: issue.fields.summary || 'Unknown Epic',
        epicKey: issue.key,
        status: mapEpicStatus(issue.fields.status?.name),
        totalTasks: issue.fields.subtasks?.length || 0,
        notStarted: 0, inProgress: 0, completed: 0, percentComplete: 0,
        startDate: issue.fields.created?.substring(0, 10),
        dueDate: issue.fields.duedate,
        isOffTrack: false,
      }));

      // Calculate metrics
      const activeOrders = orders.filter((o: any) => 
        !CANCELLED_STATUSES.some(s => o.currentStatus?.toLowerCase().includes(s))
      );

      const summary = {
        totalActiveCustomers: new Set(activeOrders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown')).size,
        totalActiveOrders: activeOrders.length,
        totalMonthlyRevenue: orders.reduce((sum: number, o: any) => sum + (o.orderTotal || 0), 0),
        totalOutstandingPayments: orders.reduce((sum: number, o: any) => sum + (o.remainingDue || 0), 0),
        totalCommissionsDue: orders.reduce((sum: number, o: any) => sum + (o.commissionDue || 0), 0),
        totalActiveProjects: webProjects.filter((p: any) => p.status === 'active').length,
        orderHealthBreakdown: {
          onTrack: activeOrders.filter((o: any) => o.orderHealth === 'on-track').length,
          atRisk: activeOrders.filter((o: any) => o.orderHealth === 'at-risk').length,
          offTrack: activeOrders.filter((o: any) => o.orderHealth === 'off-track').length,
        },
      };

      console.log(`Orders: ${orders.length}, Active: ${activeOrders.length}`);

      return new Response(JSON.stringify({
        success: true,
        data: {
          summary,
          orders,
          webProjects,
          customers: ['All Customers', ...new Set(orders.map((o: any) => o.customer).filter((c: string) => c && c !== 'Unknown'))],
          agents: ['All Agents', ...new Set(orders.map((o: any) => o.agent).filter(Boolean))],
          accountManagers: ['All Account Managers', ...new Set(orders.map((o: any) => o.accountManager).filter(Boolean))],
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

function getOrderHealth(fields: any): 'on-track' | 'at-risk' | 'off-track' {
  const healthField = fields.customfield_10083?.value?.toLowerCase();
  if (healthField) {
    if (healthField.includes('off') || healthField.includes('behind')) return 'off-track';
    if (healthField.includes('risk') || healthField.includes('warning')) return 'at-risk';
    return 'on-track';
  }
  const dueDate = fields.duedate ? new Date(fields.duedate) : null;
  if (!dueDate) return 'on-track';
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntilDue < 0) return 'off-track';
  if (daysUntilDue < 7) return 'at-risk';
  return 'on-track';
}

function calculateDaysBehind(fields: any): number {
  const dueDate = fields.duedate ? new Date(fields.duedate) : null;
  if (!dueDate) return 0;
  const daysDiff = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 0 ? daysDiff : 0;
}

function calculateDaysInProduction(fields: any): number {
  const startDate = fields.customfield_10040 || fields.created?.substring(0, 10);
  if (!startDate) return 0;
  return Math.ceil((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
}

function mapEpicStatus(status: string): 'active' | 'on-hold' | 'complete' {
  const lower = status?.toLowerCase() || '';
  if (lower.includes('done') || lower.includes('complete') || lower.includes('closed')) return 'complete';
  if (lower.includes('hold') || lower.includes('blocked') || lower.includes('paused')) return 'on-hold';
  return 'active';
}
