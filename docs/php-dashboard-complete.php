<?php
/**
 * NextDay Nutra Executive Dashboard - Complete PHP Backend
 * =========================================================
 * This is an EXACT replica of the Lovable edge function (jira-sync/index.ts)
 * 
 * USAGE:
 * 1. Upload this file to your PHP server
 * 2. Update the credentials below
 * 3. Call via POST request with JSON body: {"action": "dashboard"}
 * 
 * API Response: JSON with summary, orders, webProjects, customers, agents, accountManagers
 */

// ============================================================================
// 1. CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

define('JIRA_DOMAIN', 'nextdaynutra.atlassian.net');
define('JIRA_EMAIL', 'your-email@nextdaynutra.com');  // ← CHANGE THIS
define('JIRA_API_TOKEN', 'your-api-token-here');       // ← CHANGE THIS

// ============================================================================
// 2. JIRA CUSTOM FIELD MAPPINGS (Verified from JIRA API)
// ============================================================================

$FIELD_MAPPINGS = [
    // Core fields
    'customer'          => 'customfield_10038',    // Customer (Dropdown) - use .value
    'agent'             => 'customfield_11573',    // Agent (Dropdown) - use .value
    'accountManager'    => 'customfield_11393',    // Account Manager (User Picker) - use .displayName
    
    // Financial fields
    'orderTotal'        => 'customfield_11567',    // Order Total (Number)
    'depositAmount'     => 'customfield_10074',    // Deposit Amount (Number)
    'remainingAmount'   => 'customfield_11569',    // Remaining Amount (Number)
    'commissionDue'     => 'customfield_11577',    // Commission Due (Number)
    
    // Order fields
    'quantityOrdered'   => 'customfield_10073',    // Quantity Ordered (Number)
    'salesOrderNumber'  => 'customfield_10113',    // Sales Order # (Text)
    'productName'       => 'customfield_10115',    // Product Name (Text)
    'productId'         => 'customfield_10732',    // Product_ID (Text)
    
    // Date fields
    'dateOrdered'       => 'customfield_10040',    // Date Ordered
    'actualShipDate'    => 'customfield_11161',    // Actual Ship Date
    'commissionPaidDate'=> 'customfield_11578',    // Commission Paid (Date)
    
    // Production fields
    'daysInProduction'  => 'customfield_10930',    // Days In Production (Number)
];

// ============================================================================
// 3. CANCELLED/INACTIVE STATUSES
// ============================================================================

$CANCELLED_STATUSES = ['cancelled', 'canceled', 'done', 'shipped', 'complete', 'completed', 'closed'];

// ============================================================================
// 4. CORS HEADERS (for browser requests)
// ============================================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================================
// 5. JIRA API REQUEST FUNCTION
// ============================================================================

function jiraRequest($method, $endpoint, $body = null) {
    $url = 'https://' . JIRA_DOMAIN . $endpoint;
    
    $auth = base64_encode(JIRA_EMAIL . ':' . JIRA_API_TOKEN);
    
    $headers = [
        'Authorization: Basic ' . $auth,
        'Content-Type: application/json',
        'Accept: application/json',
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if (strtoupper($method) === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['error' => 'cURL Error: ' . $error];
    }
    
    $data = json_decode($response, true);
    
    if ($httpCode < 200 || $httpCode >= 300) {
        $errorMsg = isset($data['errorMessages'][0]) ? $data['errorMessages'][0] : 'HTTP ' . $httpCode;
        return ['error' => $errorMsg];
    }
    
    return $data;
}

// ============================================================================
// 6. HELPER FUNCTIONS (Exact replicas from edge function)
// ============================================================================

/**
 * Determine order health based on custom field or due date
 */
function getOrderHealth($fields) {
    // Check custom field for order health if available
    $healthField = isset($fields['customfield_10083']['value']) 
        ? strtolower($fields['customfield_10083']['value']) 
        : '';
    
    if ($healthField) {
        if (strpos($healthField, 'off') !== false || strpos($healthField, 'behind') !== false) {
            return 'off-track';
        }
        if (strpos($healthField, 'risk') !== false || strpos($healthField, 'warning') !== false) {
            return 'at-risk';
        }
        return 'on-track';
    }
    
    // Fallback: calculate based on due date
    $dueDate = isset($fields['duedate']) ? $fields['duedate'] : null;
    if (!$dueDate) {
        return 'on-track';
    }
    
    $daysUntilDue = ceil((strtotime($dueDate) - time()) / 86400);
    
    if ($daysUntilDue < 0) return 'off-track';
    if ($daysUntilDue < 7) return 'at-risk';
    return 'on-track';
}

/**
 * Calculate how many days behind schedule an order is
 */
function calculateDaysBehind($fields) {
    $dueDate = isset($fields['duedate']) ? $fields['duedate'] : null;
    if (!$dueDate) return 0;
    
    $daysDiff = ceil((time() - strtotime($dueDate)) / 86400);
    return $daysDiff > 0 ? $daysDiff : 0;
}

/**
 * Calculate days in production from start date
 */
function calculateDaysInProduction($fields) {
    global $FIELD_MAPPINGS;
    
    $startDate = isset($fields[$FIELD_MAPPINGS['dateOrdered']]) 
        ? $fields[$FIELD_MAPPINGS['dateOrdered']] 
        : null;
    
    if (!$startDate && isset($fields['created'])) {
        $startDate = substr($fields['created'], 0, 10);
    }
    
    if (!$startDate) return 0;
    
    return ceil((time() - strtotime($startDate)) / 86400);
}

/**
 * Map JIRA epic status to simplified status
 */
function mapEpicStatus($status) {
    $lower = strtolower($status ?? '');
    
    if (strpos($lower, 'done') !== false || 
        strpos($lower, 'complete') !== false || 
        strpos($lower, 'closed') !== false) {
        return 'complete';
    }
    
    if (strpos($lower, 'hold') !== false || 
        strpos($lower, 'blocked') !== false || 
        strpos($lower, 'paused') !== false) {
        return 'on-hold';
    }
    
    return 'active';
}

/**
 * Check if an order is active (not cancelled/completed)
 */
function isOrderActive($status) {
    global $CANCELLED_STATUSES;
    
    $status = strtolower($status ?? '');
    
    foreach ($CANCELLED_STATUSES as $cancelled) {
        if (strpos($status, $cancelled) !== false) {
            return false;
        }
    }
    
    return true;
}

/**
 * Safely extract order notes from description field
 */
function safeOrderNotes($fields) {
    if (isset($fields['description']['content'][0]['content'][0]['text'])) {
        return $fields['description']['content'][0]['content'][0]['text'];
    }
    return '';
}

// ============================================================================
// 7. TRANSFORM FUNCTIONS
// ============================================================================

/**
 * Transform JIRA issue to Order object
 */
function transformIssueToOrder($issue) {
    global $FIELD_MAPPINGS;
    
    $fields = isset($issue['fields']) ? $issue['fields'] : [];
    
    // Extract customer name from dropdown field
    $customerValue = isset($fields[$FIELD_MAPPINGS['customer']]['value']) 
        ? $fields[$FIELD_MAPPINGS['customer']]['value'] 
        : 'Unknown';
    
    // Extract agent from dropdown field
    $agentValue = isset($fields[$FIELD_MAPPINGS['agent']]['value']) 
        ? $fields[$FIELD_MAPPINGS['agent']]['value'] 
        : null;
    
    // Extract account manager from user picker field
    $accountManagerValue = isset($fields[$FIELD_MAPPINGS['accountManager']]['displayName']) 
        ? $fields[$FIELD_MAPPINGS['accountManager']]['displayName'] 
        : null;
    
    // Extract financial values
    $orderTotal = isset($fields[$FIELD_MAPPINGS['orderTotal']]) 
        ? (float)$fields[$FIELD_MAPPINGS['orderTotal']] 
        : 0;
    $depositAmount = isset($fields[$FIELD_MAPPINGS['depositAmount']]) 
        ? (float)$fields[$FIELD_MAPPINGS['depositAmount']] 
        : 0;
    $remainingAmount = isset($fields[$FIELD_MAPPINGS['remainingAmount']]) 
        ? (float)$fields[$FIELD_MAPPINGS['remainingAmount']] 
        : ($orderTotal - $depositAmount);
    
    // Extract other fields
    $productName = isset($fields[$FIELD_MAPPINGS['productName']]) 
        ? $fields[$FIELD_MAPPINGS['productName']] 
        : (isset($fields['summary']) ? $fields['summary'] : 'Unknown Product');
    $salesOrderNumber = isset($fields[$FIELD_MAPPINGS['salesOrderNumber']]) 
        ? $fields[$FIELD_MAPPINGS['salesOrderNumber']] 
        : $issue['key'];
    
    // Extract commission due
    $commissionDue = isset($fields[$FIELD_MAPPINGS['commissionDue']]) 
        ? (float)$fields[$FIELD_MAPPINGS['commissionDue']] 
        : 0;
    
    // Extract dates
    $startDate = isset($fields[$FIELD_MAPPINGS['dateOrdered']]) 
        ? $fields[$FIELD_MAPPINGS['dateOrdered']] 
        : (isset($fields['created']) ? substr($fields['created'], 0, 10) : null);
    
    // Extract days in production
    $daysInProduction = isset($fields[$FIELD_MAPPINGS['daysInProduction']]) 
        ? (int)$fields[$FIELD_MAPPINGS['daysInProduction']] 
        : calculateDaysInProduction($fields);
    
    return [
        'id'                 => $issue['key'],
        'salesOrderNumber'   => $salesOrderNumber,
        'customer'           => $customerValue,
        'productName'        => $productName,
        'quantityOrdered'    => isset($fields[$FIELD_MAPPINGS['quantityOrdered']]) 
            ? (int)$fields[$FIELD_MAPPINGS['quantityOrdered']] 
            : 0,
        'orderTotal'         => $orderTotal,
        'depositAmount'      => $depositAmount,
        'finalPayment'       => $orderTotal - $depositAmount,
        'remainingDue'       => $remainingAmount,
        'commissionDue'      => $commissionDue,
        'startDate'          => $startDate,
        'dueDate'            => isset($fields['duedate']) ? $fields['duedate'] : null,
        'estShipDate'        => isset($fields['duedate']) ? $fields['duedate'] : null,
        'actualShipDate'     => isset($fields[$FIELD_MAPPINGS['actualShipDate']]) 
            ? $fields[$FIELD_MAPPINGS['actualShipDate']] 
            : null,
        'currentStatus'      => isset($fields['status']['name']) 
            ? $fields['status']['name'] 
            : 'Unknown',
        'expectedStatus'     => isset($fields['status']['name']) 
            ? $fields['status']['name'] 
            : 'Unknown',
        'orderHealth'        => getOrderHealth($fields),
        'daysBehindSchedule' => calculateDaysBehind($fields),
        'daysInProduction'   => $daysInProduction,
        'agent'              => $agentValue,
        'accountManager'     => $accountManagerValue,
        'orderNotes'         => safeOrderNotes($fields),
    ];
}

/**
 * Transform JIRA epic to Web Project object
 */
function transformEpicToWebProject($issue) {
    $fields = isset($issue['fields']) ? $issue['fields'] : [];
    
    return [
        'id'              => $issue['key'],
        'epicName'        => isset($fields['summary']) ? $fields['summary'] : 'Unknown Epic',
        'epicKey'         => $issue['key'],
        'status'          => mapEpicStatus(isset($fields['status']['name']) ? $fields['status']['name'] : ''),
        'totalTasks'      => isset($fields['subtasks']) ? count($fields['subtasks']) : 0,
        'notStarted'      => 0,
        'inProgress'      => 0,
        'completed'       => 0,
        'percentComplete' => 0,
        'startDate'       => isset($fields['created']) ? substr($fields['created'], 0, 10) : null,
        'dueDate'         => isset($fields['duedate']) ? $fields['duedate'] : null,
        'isOffTrack'      => false,
    ];
}

// ============================================================================
// 8. MAIN API HANDLER
// ============================================================================

function handleDashboardRequest() {
    global $CANCELLED_STATUSES;
    
    // -------------------------------------------------------------------------
    // STEP 1: Fetch Contract Manufacturing (CM) issues
    // IMPORTANT: Using NEW API endpoint /rest/api/3/search/jql
    // -------------------------------------------------------------------------
    
    $cmResult = jiraRequest('POST', '/rest/api/3/search/jql', [
        'jql'        => 'project = "CM" ORDER BY created DESC',
        'maxResults' => 100,
        'fields'     => ['*all'],
    ]);
    
    if (isset($cmResult['error'])) {
        return ['success' => false, 'error' => 'JIRA CM Error: ' . $cmResult['error']];
    }
    
    // -------------------------------------------------------------------------
    // STEP 2: Fetch Web Development (WEB) epics
    // IMPORTANT: Using NEW API endpoint /rest/api/3/search/jql
    // -------------------------------------------------------------------------
    
    $webResult = jiraRequest('POST', '/rest/api/3/search/jql', [
        'jql'        => 'project = "WEB" AND issuetype = Epic ORDER BY created DESC',
        'maxResults' => 50,
        'fields'     => ['*all'],
    ]);
    
    if (isset($webResult['error'])) {
        return ['success' => false, 'error' => 'JIRA WEB Error: ' . $webResult['error']];
    }
    
    // -------------------------------------------------------------------------
    // STEP 3: Transform issues to orders and projects
    // -------------------------------------------------------------------------
    
    $cmIssues = isset($cmResult['issues']) ? $cmResult['issues'] : [];
    $webIssues = isset($webResult['issues']) ? $webResult['issues'] : [];
    
    $orders = array_map('transformIssueToOrder', $cmIssues);
    $webProjects = array_map('transformEpicToWebProject', $webIssues);
    
    // -------------------------------------------------------------------------
    // STEP 4: Filter active orders (exclude cancelled/completed)
    // -------------------------------------------------------------------------
    
    $activeOrders = array_filter($orders, function($order) {
        return isOrderActive($order['currentStatus']);
    });
    $activeOrders = array_values($activeOrders); // Re-index array
    
    // -------------------------------------------------------------------------
    // STEP 5: Calculate summary metrics
    // -------------------------------------------------------------------------
    
    // Get unique active customers
    $uniqueCustomers = [];
    foreach ($activeOrders as $order) {
        if (!empty($order['customer']) && $order['customer'] !== 'Unknown') {
            $uniqueCustomers[$order['customer']] = true;
        }
    }
    
    // Calculate totals
    $totalMonthlyRevenue = array_sum(array_column($orders, 'orderTotal'));
    $totalOutstandingPayments = array_sum(array_column($orders, 'remainingDue'));
    $totalCommissionsDue = array_sum(array_column($orders, 'commissionDue'));
    
    // Count active web projects
    $activeWebProjects = array_filter($webProjects, function($project) {
        return $project['status'] === 'active';
    });
    
    // Calculate order health breakdown
    $onTrackCount = count(array_filter($activeOrders, function($o) { 
        return $o['orderHealth'] === 'on-track'; 
    }));
    $atRiskCount = count(array_filter($activeOrders, function($o) { 
        return $o['orderHealth'] === 'at-risk'; 
    }));
    $offTrackCount = count(array_filter($activeOrders, function($o) { 
        return $o['orderHealth'] === 'off-track'; 
    }));
    
    $summary = [
        'totalActiveCustomers'     => count($uniqueCustomers),
        'totalActiveOrders'        => count($activeOrders),
        'totalMonthlyRevenue'      => $totalMonthlyRevenue,
        'totalOutstandingPayments' => $totalOutstandingPayments,
        'totalCommissionsDue'      => $totalCommissionsDue,
        'totalActiveProjects'      => count($activeWebProjects),
        'orderHealthBreakdown'     => [
            'onTrack'  => $onTrackCount,
            'atRisk'   => $atRiskCount,
            'offTrack' => $offTrackCount,
        ],
    ];
    
    // -------------------------------------------------------------------------
    // STEP 6: Extract unique filter values
    // -------------------------------------------------------------------------
    
    // Customers (excluding empty/Unknown)
    $customerList = ['All Customers'];
    foreach ($orders as $order) {
        if (!empty($order['customer']) && $order['customer'] !== 'Unknown') {
            if (!in_array($order['customer'], $customerList)) {
                $customerList[] = $order['customer'];
            }
        }
    }
    
    // Agents (excluding empty)
    $agentList = ['All Agents'];
    foreach ($orders as $order) {
        if (!empty($order['agent'])) {
            if (!in_array($order['agent'], $agentList)) {
                $agentList[] = $order['agent'];
            }
        }
    }
    
    // Account Managers (excluding empty)
    $accountManagerList = ['All Account Managers'];
    foreach ($orders as $order) {
        if (!empty($order['accountManager'])) {
            if (!in_array($order['accountManager'], $accountManagerList)) {
                $accountManagerList[] = $order['accountManager'];
            }
        }
    }
    
    // -------------------------------------------------------------------------
    // STEP 7: Return complete response
    // -------------------------------------------------------------------------
    
    return [
        'success' => true,
        'data'    => [
            'summary'         => $summary,
            'orders'          => $orders,
            'webProjects'     => $webProjects,
            'customers'       => $customerList,
            'agents'          => $agentList,
            'accountManagers' => $accountManagerList,
            'lastSynced'      => date('c'), // ISO 8601 format
        ],
    ];
}

/**
 * Fetch JIRA fields (for debugging)
 */
function handleFieldsRequest() {
    $result = jiraRequest('GET', '/rest/api/3/field', null);
    
    if (isset($result['error'])) {
        return ['success' => false, 'error' => $result['error']];
    }
    
    return [
        'success' => true,
        'fields'  => $result,
    ];
}

// ============================================================================
// 9. MAIN EXECUTION
// ============================================================================

// Get request body
$input = file_get_contents('php://input');
$requestData = json_decode($input, true) ?? [];
$action = isset($requestData['action']) ? $requestData['action'] : 'dashboard';

// Route to appropriate handler
switch ($action) {
    case 'dashboard':
        $response = handleDashboardRequest();
        break;
    
    case 'fields':
        $response = handleFieldsRequest();
        break;
    
    default:
        $response = ['success' => false, 'error' => 'Invalid action: ' . $action];
        http_response_code(400);
}

// Output JSON response
echo json_encode($response, JSON_PRETTY_PRINT);
