<?php

require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

$state = $_SESSION['refresh_state'] ?? null;

if (!$state) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'reason' => 'refresh_not_initialized']);
    exit;
}

$prevKey  = $_POST['prev_key']  ?? null;
$clientTs = $_POST['client_ts'] ?? null;

if (!$prevKey || !$clientTs) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'reason' => 'bad_request']);
    exit;
}

$serverNow = time();

// 1. Validate key
if (!hash_equals($state['current_key'], $prevKey)) {
    http_response_code(409);
    echo json_encode(['status' => 'error', 'reason' => 'invalid_key']);
    exit;
}

// 2. Check that request hits the allowed window
if ($serverNow < $state['window_min'] || $serverNow > $state['window_max']) {
    http_response_code(409);
    echo json_encode(['status' => 'error', 'reason' => 'window_missed', 'server_now' => $serverNow, 'window' => $state]);
    exit;
}

// 3. All good — generate a new window and key
[$newKey, $minTs, $maxTs] = generateNextRefreshWindow();

$_SESSION['refresh_state']['current_key'] = $newKey;
$_SESSION['refresh_state']['window_min']  = $minTs;
$_SESSION['refresh_state']['window_max']  = $maxTs;

echo json_encode([
    'status'                     => 'ok',
    'current_refresh_key'        => $newKey,
    'next_refresh_min_datetime'  => $minTs,
    'next_refresh_max_datetime'  => $maxTs,
    'server_now'                 => $serverNow,
]);
