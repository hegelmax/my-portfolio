<?php

require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

// For testing: skip any checks (no captcha, etc.)

// Generate the first key and window
[$key, $minTs, $maxTs] = generateNextRefreshWindow();

$_SESSION['refresh_state'] = [
    'current_key'   => $key,
    'window_min'    => $minTs,
    'window_max'    => $maxTs,
    'captcha_level' => 'normal', // not used yet, but keep for future
];

echo json_encode([
    'status'                     => 'ok',
    'current_refresh_key'        => $key,
    'next_refresh_min_datetime'  => $minTs,
    'next_refresh_max_datetime'  => $maxTs,
]);
