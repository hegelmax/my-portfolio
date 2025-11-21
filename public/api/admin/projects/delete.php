<?php
require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');

admin_require_auth_json();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id = $input['id'] ?? null;

if (!is_numeric($id)) {
    echo json_encode(['success' => false, 'errors' => ['Invalid project id']], JSON_UNESCAPED_UNICODE);
    exit;
}

$id = (int)$id;

$items = projects_read_all();
$newItems = [];
$removed = false;

foreach ($items as $proj) {
    if (isset($proj['id']) && (int)$proj['id'] === $id) {
        $removed = true;
        continue;
    }
    $newItems[] = $proj;
}

if (!$removed) {
    http_response_code(404);
    echo json_encode(['success' => false, 'errors' => ['Project not found']], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!projects_write_all($newItems)) {
    echo json_encode(['success' => false, 'errors' => ['Failed to write projects.json']], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'items'   => $newItems,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
