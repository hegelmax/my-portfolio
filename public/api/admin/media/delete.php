<?php

require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$paths = isset($input['paths']) && is_array($input['paths']) ? $input['paths'] : [];

if (empty($paths)) {
    echo json_encode(['success' => false, 'error' => 'No media selected'], JSON_UNESCAPED_UNICODE);
    exit;
}

$normalized = [];
foreach ($paths as $p) {
    $p = trim((string)$p);
    if ($p !== '') {
        $normalized[$p] = true;
    }
}

if (empty($normalized)) {
    echo json_encode(['success' => false, 'error' => 'No valid media paths'], JSON_UNESCAPED_UNICODE);
    exit;
}

$items = media_read_all();
$remaining = [];
$deleted = [];

$imgRoot = realpath(IMG_DIR);

foreach ($items as $item) {
    $path = isset($item['path']) ? (string)$item['path'] : '';
    if ($path && isset($normalized[$path])) {
        $deleted[] = $path;

        $fullPath = ROOT_DIR . '/' . ltrim($path, '/');
        $real = realpath($fullPath);
        if ($real && $imgRoot && strpos($real, $imgRoot) === 0 && is_file($real)) {
            @unlink($real);
        }
        continue;
    }

    $remaining[] = $item;
}

media_write_all($remaining);

echo json_encode([
    'success' => true,
    'deleted' => $deleted,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
