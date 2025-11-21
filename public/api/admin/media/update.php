<?php
require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id = isset($input['id']) ? (int)$input['id'] : 0;

if ($id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid id'], JSON_UNESCAPED_UNICODE);
    exit;
}

$tags = [];
if (isset($input['tags']) && is_array($input['tags'])) {
    foreach ($input['tags'] as $t) {
        $t = trim((string)$t);
        if ($t !== '') $tags[] = $t;
    }
}

$items = media_read_all();
$updated = null;

foreach ($items as &$item) {
    if ((int)$item['id'] === $id) {
        if ($tags) {
            $item['tags'] = $tags;
        }
        if (isset($input['alt'])) {
            $item['alt'] = trim((string)$input['alt']);
        }
        if (isset($input['credit'])) {
            $item['credit'] = trim((string)$input['credit']);
        }
        $updated = $item;
        break;
    }
}
unset($item);

if (!$updated) {
    echo json_encode(['success' => false, 'error' => 'Media not found'], JSON_UNESCAPED_UNICODE);
    exit;
}

media_write_all($items);

echo json_encode([
    'success' => true,
    'item'    => $updated,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
