<?php

include_once __DIR__ . '/../_init.php';

admin_require_auth_json();

header('Content-Type: application/json; charset=utf-8');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid payload'], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = DATA_DIR . '/seo.json';
$dir  = dirname($file);
if (!is_dir($dir)) {
    @mkdir($dir, 0775, true);
}

$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$fp = fopen($file, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Cannot open file'], JSON_UNESCAPED_UNICODE);
    exit;
}

flock($fp, LOCK_EX);
ftruncate($fp, 0);
fwrite($fp, $json);
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
