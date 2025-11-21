<?php
require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$from = isset($input['from']) ? trim((string)$input['from']) : '';
$to   = isset($input['to']) ? trim((string)$input['to']) : '';

if ($from === '' || $to === '') {
    echo json_encode(['success' => false, 'error' => 'Both source and target tags are required'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($from === $to) {
    echo json_encode(['success' => false, 'error' => 'Tags must be different'], JSON_UNESCAPED_UNICODE);
    exit;
}

$items = media_read_all();
$updatedCount = 0;

foreach ($items as &$item) {
    if (empty($item['tags']) || !is_array($item['tags'])) {
        continue;
    }

    $changed = false;
    $newTags = [];
    foreach ($item['tags'] as $tag) {
        $tag = trim((string)$tag);
        if ($tag === '') {
            continue;
        }
        if ($tag === $from) {
            $tag = $to;
            $changed = true;
        }
        if (!in_array($tag, $newTags, true)) {
            $newTags[] = $tag;
        }
    }

    if ($changed) {
        $item['tags'] = $newTags;
        $updatedCount++;
    }
}
unset($item);

if ($updatedCount > 0) {
    media_write_all($items);
}

echo json_encode([
    'success' => true,
    'updated' => $updatedCount,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
