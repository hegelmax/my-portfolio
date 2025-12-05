<?php

include_once __DIR__ . '/../_init.php';

header('Content-Type: application/json; charset=utf-8');

$file = DATA_DIR . '/seo.json';

if (!file_exists($file)) {
    echo json_encode([
        'success' => true,
        'data' => new stdClass(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$json = file_get_contents($file);
$data = json_decode($json, true);

if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Invalid seo.json'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'data' => $data,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
