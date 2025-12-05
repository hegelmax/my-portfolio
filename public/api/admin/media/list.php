<?php

require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');

$raw = $_SERVER['REQUEST_METHOD'] === 'GET'
    ? $_GET
    : (json_decode(file_get_contents('php://input'), true) ?? []);

$tags = $raw['tags'] ?? [];
if (!is_array($tags)) {
    // accept comma-separated string
    if (is_string($tags) && $tags !== '') {
        $tags = array_filter(array_map('trim', explode(',', $tags)), static fn($v) => $v !== '');
    } else {
        $tags = [];
    }
}
$search   = trim($raw['search'] ?? '');
$page     = max(1, (int)($raw['page'] ?? 1));
$pageSize = max(1, min(1000, (int)($raw['pageSize'] ?? 60)));

$all = media_read_all();

// filtering
$filtered = [];
$tagsSet = [];
foreach ($all as $item) {
    $ok = true;

    // tag filter: all provided tags must be present
    if ($tags) {
        $itemTags = isset($item['tags']) && is_array($item['tags']) ? $item['tags'] : [];
        foreach ($tags as $t) {
            if (!in_array($t, $itemTags, true)) {
                $ok = false;
                break;
            }
        }
    }

    // search by name/path
    if ($ok && $search !== '') {
        $hay = ($item['filename'] ?? '') . ' ' . ($item['path'] ?? '');
        if (stripos($hay, $search) === false) {
            $ok = false;
        }
    }

    if ($ok) {
    $filtered[] = $item;

    if (!empty($item['tags']) && is_array($item['tags'])) {
        foreach ($item['tags'] as $tag) {
            if ($tag !== '') {
                $tagsSet[$tag] = true;
            }
        }
    }
}
}

// pagination
$total = count($filtered);
$totalPages = max(1, (int)ceil($total / $pageSize));
$page = min($page, $totalPages);

$offset = ($page - 1) * $pageSize;
$items = array_slice($filtered, $offset, $pageSize);

ksort($tagsSet, SORT_NATURAL | SORT_FLAG_CASE);
$allTags = array_keys($tagsSet);

echo json_encode([
    'success'    => true,
    'page'       => $page,
    'pageSize'   => $pageSize,
    'total'      => $total,
    'totalPages' => $totalPages,
    'allTags'    => $allTags,
    'items'      => $items,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
