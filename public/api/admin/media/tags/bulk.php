<?php
require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = isset($input['action']) ? strtolower(trim((string)$input['action'])) : '';
$rawTags = isset($input['tags']) && is_array($input['tags']) ? $input['tags'] : [];
$rawPaths = isset($input['paths']) && is_array($input['paths']) ? $input['paths'] : [];

$allowedActions = ['add', 'replace', 'remove'];
if (!in_array($action, $allowedActions, true)) {
    echo json_encode(['success' => false, 'error' => 'Invalid action'], JSON_UNESCAPED_UNICODE);
    exit;
}

$tags = [];
foreach ($rawTags as $tag) {
    $tag = trim((string)$tag);
    if ($tag !== '' && !in_array($tag, $tags, true)) {
        $tags[] = $tag;
    }
}

$paths = [];
foreach ($rawPaths as $path) {
    $path = trim((string)$path);
    if ($path !== '') {
        $paths[$path] = true;
    }
}

if (empty($paths)) {
    echo json_encode(['success' => false, 'error' => 'No media selected'], JSON_UNESCAPED_UNICODE);
    exit;
}

$items = media_read_all();
$updatedCount = 0;

foreach ($items as &$item) {
    $itemPath = isset($item['path']) ? (string)$item['path'] : '';
    if ($itemPath === '' || !isset($paths[$itemPath])) {
        continue;
    }

    $itemTags = [];
    if (isset($item['tags']) && is_array($item['tags'])) {
        foreach ($item['tags'] as $t) {
            $t = (string)$t;
            if ($t !== '') {
                $itemTags[] = $t;
            }
        }
    }

    if ($action === 'add') {
        $itemTags = array_values(array_unique(array_merge($itemTags, $tags)));
    } elseif ($action === 'replace') {
        $itemTags = $tags;
    } elseif ($action === 'remove') {
        if ($tags) {
            $itemTags = array_values(array_diff($itemTags, $tags));
        } else {
            $itemTags = [];
        }
    }

    $item['tags'] = $itemTags;
    $updatedCount++;
}
unset($item);

media_write_all($items);

echo json_encode([
    'success' => true,
    'updated' => $updatedCount,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
