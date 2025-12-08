<?php
/**
 * NextDay Nutra Executive Dashboard - WordPress Code Snippet
 * ===========================================================
 * 
 * INSTALLATION:
 * 1. Install "Code Snippets" plugin in WordPress (or use theme's functions.php)
 * 2. Go to Snippets → Add New
 * 3. Paste this entire code
 * 4. Save and Activate
 * 5. Use shortcode [ndn_executive_dashboard] on any page
 * 
 * UPDATE YOUR CREDENTIALS ON LINES 18-19 BELOW
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
define('NDN_JIRA_DOMAIN', 'nextdaynutra.atlassian.net');
define('NDN_JIRA_EMAIL', 'your-email@nextdaynutra.com');      // ← CHANGE THIS
define('NDN_JIRA_API_TOKEN', 'your-api-token-here');          // ← CHANGE THIS

// ============================================
// JIRA FIELD MAPPINGS
// ============================================
function ndn_get_field_map() {
    return [
        'customer'           => 'customfield_10038',
        'agent'              => 'customfield_11573',
        'accountManager'     => 'customfield_11393',
        'orderTotal'         => 'customfield_11567',
        'depositAmount'      => 'customfield_10074',
        'remainingAmount'    => 'customfield_11569',
        'commissionDue'      => 'customfield_11577',
        'quantityOrdered'    => 'customfield_10073',
        'salesOrderNumber'   => 'customfield_10113',
        'productName'        => 'customfield_10115',
        'productId'          => 'customfield_10732',
        'dateOrdered'        => 'customfield_10040',
        'actualShipDate'     => 'customfield_11161',
        'commissionPaidDate' => 'customfield_11578',
        'daysInProduction'   => 'customfield_10930',
        'healthField'        => 'customfield_10083',
    ];
}

function ndn_get_cancelled_statuses() {
    return ['cancelled', 'canceled', 'done', 'shipped', 'complete', 'completed', 'closed'];
}

// ============================================
// JIRA API REQUEST (NEW /search/jql ENDPOINT)
// ============================================
function ndn_jira_api_request($jql, $max_results = 100) {
    $url = 'https://' . NDN_JIRA_DOMAIN . '/rest/api/3/search/jql';
    
    $response = wp_remote_post($url, [
        'headers' => [
            'Authorization' => 'Basic ' . base64_encode(NDN_JIRA_EMAIL . ':' . NDN_JIRA_API_TOKEN),
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ],
        'body' => json_encode([
            'jql'        => $jql,
            'maxResults' => $max_results,
            'fields'     => ['*all'],
        ]),
        'timeout' => 30,
    ]);
    
    if (is_wp_error($response)) {
        return ['error' => $response->get_error_message()];
    }
    
    $code = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);
    
    if ($code < 200 || $code >= 300) {
        $msg = $body['errorMessages'][0] ?? $body['message'] ?? "HTTP $code";
        return ['error' => $msg];
    }
    
    return $body;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function ndn_is_order_active($status) {
    $status = strtolower(trim($status));
    foreach (ndn_get_cancelled_statuses() as $cancelled) {
        if (strpos($status, $cancelled) !== false) {
            return false;
        }
    }
    return true;
}

function ndn_get_order_health($fields) {
    $map = ndn_get_field_map();
    $healthValue = $fields[$map['healthField']]['value'] ?? '';
    $healthLower = strtolower($healthValue);
    
    if ($healthValue) {
        if (strpos($healthLower, 'off') !== false || strpos($healthLower, 'behind') !== false) {
            return 'off-track';
        }
        if (strpos($healthLower, 'risk') !== false || strpos($healthLower, 'warning') !== false) {
            return 'at-risk';
        }
        return 'on-track';
    }
    
    // Fallback to due date
    $dueDate = $fields['duedate'] ?? null;
    if (!$dueDate) return 'on-track';
    
    $daysUntilDue = (strtotime($dueDate) - time()) / 86400;
    if ($daysUntilDue < 0) return 'off-track';
    if ($daysUntilDue < 7) return 'at-risk';
    return 'on-track';
}

function ndn_calculate_days_behind($fields) {
    $dueDate = $fields['duedate'] ?? null;
    if (!$dueDate) return 0;
    $diff = (time() - strtotime($dueDate)) / 86400;
    return max(0, (int)$diff);
}

function ndn_calculate_days_in_production($fields) {
    $map = ndn_get_field_map();
    $startDate = $fields[$map['dateOrdered']] ?? null;
    if (!$startDate && isset($fields['created'])) {
        $startDate = substr($fields['created'], 0, 10);
    }
    if (!$startDate) return 0;
    return (int)((time() - strtotime($startDate)) / 86400);
}

function ndn_map_epic_status($status) {
    $lower = strtolower($status);
    if (strpos($lower, 'done') !== false || strpos($lower, 'complete') !== false || strpos($lower, 'closed') !== false) {
        return 'complete';
    }
    if (strpos($lower, 'hold') !== false || strpos($lower, 'blocked') !== false || strpos($lower, 'paused') !== false) {
        return 'on-hold';
    }
    return 'active';
}

// ============================================
// DATA TRANSFORMERS
// ============================================
function ndn_transform_order($issue) {
    $map = ndn_get_field_map();
    $fields = $issue['fields'] ?? [];
    
    $orderTotal = (float)($fields[$map['orderTotal']] ?? 0);
    $depositAmount = (float)($fields[$map['depositAmount']] ?? 0);
    $remainingDue = (float)($fields[$map['remainingAmount']] ?? ($orderTotal - $depositAmount));
    
    return [
        'id'                 => $issue['key'],
        'salesOrderNumber'   => $fields[$map['salesOrderNumber']] ?? $issue['key'],
        'customer'           => $fields[$map['customer']]['value'] ?? 'Unknown',
        'productName'        => $fields[$map['productName']] ?? ($fields['summary'] ?? 'Unknown'),
        'quantityOrdered'    => (int)($fields[$map['quantityOrdered']] ?? 0),
        'orderTotal'         => $orderTotal,
        'depositAmount'      => $depositAmount,
        'remainingDue'       => $remainingDue,
        'commissionDue'      => (float)($fields[$map['commissionDue']] ?? 0),
        'startDate'          => $fields[$map['dateOrdered']] ?? (isset($fields['created']) ? substr($fields['created'], 0, 10) : null),
        'dueDate'            => $fields['duedate'] ?? null,
        'actualShipDate'     => $fields[$map['actualShipDate']] ?? null,
        'currentStatus'      => $fields['status']['name'] ?? 'Unknown',
        'orderHealth'        => ndn_get_order_health($fields),
        'daysBehindSchedule' => ndn_calculate_days_behind($fields),
        'daysInProduction'   => (int)($fields[$map['daysInProduction']] ?? ndn_calculate_days_in_production($fields)),
        'agent'              => $fields[$map['agent']]['value'] ?? null,
        'accountManager'     => $fields[$map['accountManager']]['displayName'] ?? null,
    ];
}

function ndn_transform_web_project($issue) {
    $fields = $issue['fields'] ?? [];
    return [
        'id'        => $issue['key'],
        'epicName'  => $fields['summary'] ?? 'Unknown',
        'status'    => ndn_map_epic_status($fields['status']['name'] ?? ''),
        'startDate' => isset($fields['created']) ? substr($fields['created'], 0, 10) : null,
        'dueDate'   => $fields['duedate'] ?? null,
    ];
}

// ============================================
// FETCH ALL DASHBOARD DATA
// ============================================
function ndn_fetch_all_data() {
    // Fetch CM Orders using NEW API endpoint
    $cm = ndn_jira_api_request('project = "CM" ORDER BY created DESC', 100);
    if (isset($cm['error'])) {
        return ['error' => 'CM Error: ' . $cm['error']];
    }
    
    // Fetch WEB Epics using NEW API endpoint
    $web = ndn_jira_api_request('project = "WEB" AND issuetype = Epic ORDER BY created DESC', 50);
    if (isset($web['error'])) {
        return ['error' => 'WEB Error: ' . $web['error']];
    }
    
    $orders = array_map('ndn_transform_order', $cm['issues'] ?? []);
    $webProjects = array_map('ndn_transform_web_project', $web['issues'] ?? []);
    
    // Filter active orders
    $activeOrders = array_filter($orders, function($o) {
        return ndn_is_order_active($o['currentStatus']);
    });
    
    // Get unique customers
    $customers = [];
    foreach ($activeOrders as $o) {
        if (!empty($o['customer']) && $o['customer'] !== 'Unknown') {
            $customers[$o['customer']] = true;
        }
    }
    
    // Count active web projects
    $activeWebProjects = array_filter($webProjects, function($p) {
        return $p['status'] === 'active';
    });
    
    // Health breakdown
    $onTrack = count(array_filter($activeOrders, fn($o) => $o['orderHealth'] === 'on-track'));
    $atRisk = count(array_filter($activeOrders, fn($o) => $o['orderHealth'] === 'at-risk'));
    $offTrack = count(array_filter($activeOrders, fn($o) => $o['orderHealth'] === 'off-track'));
    
    return [
        'summary' => [
            'totalActiveCustomers'     => count($customers),
            'totalActiveOrders'        => count($activeOrders),
            'totalMonthlyRevenue'      => array_sum(array_column($orders, 'orderTotal')),
            'totalOutstandingPayments' => array_sum(array_column($orders, 'remainingDue')),
            'totalCommissionsDue'      => array_sum(array_column($orders, 'commissionDue')),
            'totalActiveProjects'      => count($activeWebProjects),
            'orderHealth' => [
                'onTrack'  => $onTrack,
                'atRisk'   => $atRisk,
                'offTrack' => $offTrack,
            ],
        ],
        'orders'      => array_values($activeOrders),
        'webProjects' => $webProjects,
    ];
}

// ============================================
// SHORTCODE RENDER
// ============================================
function ndn_executive_dashboard_shortcode() {
    $data = ndn_fetch_all_data();
    
    if (isset($data['error'])) {
        return '<div style="padding:20px;background:#fee2e2;color:#991b1b;border-radius:12px;font-family:system-ui;">
            <strong>JIRA Error:</strong> ' . esc_html($data['error']) . '
        </div>';
    }
    
    $s = $data['summary'];
    $orders = $data['orders'];
    $webProjects = $data['webProjects'];
    
    ob_start();
    ?>
    <style>
        .ndn-dash{font-family:'Inter',system-ui,-apple-system,sans-serif;max-width:1400px;margin:0 auto;padding:24px;background:#f8fafc;}
        .ndn-header{margin-bottom:32px;}
        .ndn-header h1{font-size:28px;font-weight:700;color:#0f172a;margin:0 0 8px;}
        .ndn-header p{color:#64748b;margin:0;font-size:14px;}
        .ndn-metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-bottom:32px;}
        .ndn-metric{background:#fff;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e2e8f0;}
        .ndn-metric-label{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:8px;}
        .ndn-metric-value{font-size:28px;font-weight:700;color:#0f172a;}
        .ndn-metric-value.orange{color:#F05323;}
        .ndn-section{background:#fff;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e2e8f0;margin-bottom:24px;}
        .ndn-section-title{font-size:16px;font-weight:600;color:#0f172a;margin:0 0 16px;display:flex;align-items:center;gap:8px;}
        .ndn-table{width:100%;border-collapse:collapse;font-size:13px;}
        .ndn-table th{text-align:left;padding:12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;}
        .ndn-table td{padding:12px;border-bottom:1px solid #f1f5f9;color:#334155;}
        .ndn-table tr:hover{background:#f8fafc;}
        .ndn-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:500;}
        .ndn-badge.on-track{background:#dcfce7;color:#166534;}
        .ndn-badge.at-risk{background:#fef3c7;color:#92400e;}
        .ndn-badge.off-track{background:#fee2e2;color:#b91c1c;}
        .ndn-badge.status{background:#e2e8f0;color:#475569;}
        .ndn-badge.active{background:#dbeafe;color:#1e40af;}
        .ndn-badge.complete{background:#dcfce7;color:#166534;}
        .ndn-badge.on-hold{background:#fef3c7;color:#92400e;}
        .ndn-grid{display:grid;grid-template-columns:2fr 1fr;gap:24px;}
        .ndn-health-item{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9;}
        .ndn-health-item:last-child{border-bottom:none;}
        .ndn-health-count{font-size:20px;font-weight:600;color:#0f172a;}
        @media(max-width:1200px){.ndn-metrics{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:768px){.ndn-metrics{grid-template-columns:repeat(2,1fr);}.ndn-grid{grid-template-columns:1fr;}}
    </style>
    
    <div class="ndn-dash">
        <!-- Header -->
        <div class="ndn-header">
            <h1>Executive Dashboard</h1>
            <p>NextDay Nutra Operations Overview • Last updated: <?php echo date('M j, Y g:i A'); ?></p>
        </div>
        
        <!-- Metrics -->
        <div class="ndn-metrics">
            <div class="ndn-metric">
                <div class="ndn-metric-label">Active Customers</div>
                <div class="ndn-metric-value"><?php echo number_format($s['totalActiveCustomers']); ?></div>
            </div>
            <div class="ndn-metric">
                <div class="ndn-metric-label">Active Orders</div>
                <div class="ndn-metric-value"><?php echo number_format($s['totalActiveOrders']); ?></div>
            </div>
            <div class="ndn-metric">
                <div class="ndn-metric-label">Monthly Revenue</div>
                <div class="ndn-metric-value orange">$<?php echo number_format($s['totalMonthlyRevenue']); ?></div>
            </div>
            <div class="ndn-metric">
                <div class="ndn-metric-label">Outstanding</div>
                <div class="ndn-metric-value">$<?php echo number_format($s['totalOutstandingPayments']); ?></div>
            </div>
            <div class="ndn-metric">
                <div class="ndn-metric-label">Commissions Due</div>
                <div class="ndn-metric-value orange">$<?php echo number_format($s['totalCommissionsDue']); ?></div>
            </div>
            <div class="ndn-metric">
                <div class="ndn-metric-label">Web Projects</div>
                <div class="ndn-metric-value"><?php echo number_format($s['totalActiveProjects']); ?></div>
            </div>
        </div>
        
        <!-- Orders Table -->
        <div class="ndn-section">
            <h2 class="ndn-section-title">📦 Active Orders</h2>
            <div style="overflow-x:auto;">
                <table class="ndn-table">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Agent</th>
                            <th>Status</th>
                            <th>Health</th>
                            <th>Days Behind</th>
                            <th>Order Total</th>
                            <th>Outstanding</th>
                            <th>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($orders)): ?>
                            <tr><td colspan="10" style="text-align:center;color:#64748b;padding:40px;">No active orders found</td></tr>
                        <?php else: ?>
                            <?php foreach ($orders as $o): ?>
                                <tr>
                                    <td><strong><?php echo esc_html($o['id']); ?></strong></td>
                                    <td><?php echo esc_html($o['customer']); ?></td>
                                    <td><?php echo esc_html(substr($o['productName'], 0, 30)); ?></td>
                                    <td><?php echo esc_html($o['agent'] ?? '-'); ?></td>
                                    <td><span class="ndn-badge status"><?php echo esc_html($o['currentStatus']); ?></span></td>
                                    <td><span class="ndn-badge <?php echo esc_attr($o['orderHealth']); ?>"><?php echo ucwords(str_replace('-', ' ', $o['orderHealth'])); ?></span></td>
                                    <td><?php echo $o['daysBehindSchedule']; ?></td>
                                    <td>$<?php echo number_format($o['orderTotal']); ?></td>
                                    <td>$<?php echo number_format($o['remainingDue']); ?></td>
                                    <td><?php echo esc_html($o['dueDate'] ?? '-'); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Bottom Grid -->
        <div class="ndn-grid">
            <!-- Web Projects -->
            <div class="ndn-section">
                <h2 class="ndn-section-title">🌐 Web Projects</h2>
                <table class="ndn-table">
                    <thead>
                        <tr>
                            <th>Epic</th>
                            <th>Status</th>
                            <th>Start Date</th>
                            <th>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($webProjects)): ?>
                            <tr><td colspan="4" style="text-align:center;color:#64748b;">No web projects found</td></tr>
                        <?php else: ?>
                            <?php foreach ($webProjects as $p): ?>
                                <tr>
                                    <td><strong><?php echo esc_html($p['epicName']); ?></strong></td>
                                    <td><span class="ndn-badge <?php echo esc_attr($p['status']); ?>"><?php echo ucfirst($p['status']); ?></span></td>
                                    <td><?php echo esc_html($p['startDate'] ?? '-'); ?></td>
                                    <td><?php echo esc_html($p['dueDate'] ?? '-'); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <!-- Order Health Summary -->
            <div class="ndn-section">
                <h2 class="ndn-section-title">📊 Order Health</h2>
                <div class="ndn-health-item">
                    <span class="ndn-badge on-track">On Track</span>
                    <span class="ndn-health-count"><?php echo $s['orderHealth']['onTrack']; ?></span>
                </div>
                <div class="ndn-health-item">
                    <span class="ndn-badge at-risk">At Risk</span>
                    <span class="ndn-health-count"><?php echo $s['orderHealth']['atRisk']; ?></span>
                </div>
                <div class="ndn-health-item">
                    <span class="ndn-badge off-track">Off Track</span>
                    <span class="ndn-health-count"><?php echo $s['orderHealth']['offTrack']; ?></span>
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

// Register the shortcode
add_shortcode('ndn_executive_dashboard', 'ndn_executive_dashboard_shortcode');
