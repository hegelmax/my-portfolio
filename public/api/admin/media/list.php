<?php
require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$tags       = $input['tags'] ?? [];
$search     = trim($input['search'] ?? '');
$page       = max(1, (int)($input['page'] ?? 1));
$pageSize   = max(1, min(1000, (int)($input['pageSize'] ?? 60)));

if (!is_array($tags)) $tags = [];

$all = media_read_all();

// фильтрация
$filtered = [];
$tagsSet = [];
foreach ($all as $item) {
    $ok = true;

    // фильтр по тегам: все указанные теги должны присутствовать
    if ($tags) {
        $itemTags = isset($item['tags']) && is_array($item['tags']) ? $item['tags'] : [];
        foreach ($tags as $t) {
            if (!in_array($t, $itemTags, true)) {
                $ok = false;
                break;
            }
        }
    }

    // поиск по имени/пути
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

// пагинация
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
