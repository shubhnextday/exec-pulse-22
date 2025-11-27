import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JIRA custom field mappings from the API documentation
const FIELD_MAPPINGS = {
  // Order fields
  quantityOrdered: 'customfield_10073',
  depositAmount: 'customfield_10074',
  dateOrdered: 'customfield_10040',
  datePaid: 'customfield_10041',
  dateReceived: 'customfield_10042',
  bulkTestingStart: 'customfield_10043',
  bulkTestingComplete: 'customfield_10044',
  mfgActualEnd: 'customfield_10045',
  mfgActualStart: 'customfield_10046',
  pkgStart: 'customfield_10047',
  finalTestingComplete: 'customfield_10050',
  finalPaymentReceived: 'customfield_10051',
  mfgDepositPaid: 'customfield_10052',
  mfgFinalPaymentDate: 'customfield_10053',
  finalTesting: 'customfield_10049',
  rawMatTesting: 'customfield_10075',
  rawMatTestingComplete: 'customfield_10076',
  actualShipDate: 'customfield_11161',
  accountManager: 'customfield_11393',
  productId: 'customfield_10732',
  designer: 'customfield_11493',
  // Additional fields we need
  orderTotal: 'customfield_10077', // Adjust based on actual field
  finalPayment: 'customfield_10078', // Adjust based on actual field
  commissionPercent: 'customfield_10079', // Adjust based on actual field
  commissionPaid: 'customfield_10080', // Adjust based on actual field
  estShipDate: 'customfield_10081', // Adjust based on actual field
  agent: 'customfield_10082', // Adjust based on actual field
  orderHealth: 'customfield_10083', // Adjust based on actual field
  daysInProduction: 'customfield_10084', // Adjust based on actual field
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

    const { action = 'dashboard' } = await req.json().catch(() => ({}));

    if (action === 'dashboard') {
      // Fetch Contract Manufacturing issues using new JQL search API
      const cmJql = 'project = "CM" ORDER BY created DESC';
      const cmResponse = await fetch(
        `https://${jiraDomain}/rest/api/3/search/jql`,
        { 
          method: 'POST',
          headers,
          body: JSON.stringify({
            jql: cmJql,
            maxResults: 100,
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
      console.log(`Fetched ${cmData.issues?.length || 0} CM issues`);

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
      const orders = (cmData.issues || []).map((issue: any) => {
        const fields = issue.fields;
        return {
          id: issue.key,
          salesOrderNumber: issue.key,
          customer: fields.customfield_11261 || fields.summary?.split(' - ')[0] || 'Unknown',
          productName: fields.summary || 'Unknown Product',
          quantityOrdered: fields[FIELD_MAPPINGS.quantityOrdered] || 0,
          orderTotal: fields.customfield_10077 || 0,
          depositAmount: fields[FIELD_MAPPINGS.depositAmount] || 0,
          finalPayment: fields.customfield_10078 || 0,
          remainingDue: (fields.customfield_10077 || 0) - (fields[FIELD_MAPPINGS.depositAmount] || 0),
          startDate: fields[FIELD_MAPPINGS.dateOrdered] || fields.created?.substring(0, 10),
          dueDate: fields.duedate,
          estShipDate: fields.customfield_10081 || fields.duedate,
          actualShipDate: fields[FIELD_MAPPINGS.actualShipDate],
          currentStatus: fields.status?.name || 'Unknown',
          expectedStatus: fields.status?.name || 'Unknown',
          orderHealth: getOrderHealth(fields),
          daysBehindSchedule: calculateDaysBehind(fields),
          daysInProduction: calculateDaysInProduction(fields),
          agent: fields.customfield_10082?.displayName,
          accountManager: fields[FIELD_MAPPINGS.accountManager]?.displayName,
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

      // Calculate summary metrics
      const summary = {
        totalActiveCustomers: new Set(orders.map((o: any) => o.customer)).size,
        totalActiveOrders: orders.length,
        totalMonthlyRevenue: orders.reduce((sum: number, o: any) => sum + (o.orderTotal || 0), 0),
        totalOutstandingPayments: orders.reduce((sum: number, o: any) => sum + (o.remainingDue || 0), 0),
        totalCommissionsDue: 0, // Calculate from commission fields
        totalActiveProjects: webProjects.filter((p: any) => p.status === 'active').length,
        orderHealthBreakdown: {
          onTrack: orders.filter((o: any) => o.orderHealth === 'on-track').length,
          atRisk: orders.filter((o: any) => o.orderHealth === 'at-risk').length,
          offTrack: orders.filter((o: any) => o.orderHealth === 'off-track').length,
        },
      };

      // Get unique customers and agents for filters
      const customers = ['All Customers', ...new Set(orders.map((o: any) => o.customer).filter(Boolean))];
      const agents = ['All Agents', ...new Set(orders.map((o: any) => o.agent).filter(Boolean))];
      const accountManagers = ['All Account Managers', ...new Set(orders.map((o: any) => o.accountManager).filter(Boolean))];

      console.log('Dashboard data compiled successfully');

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
