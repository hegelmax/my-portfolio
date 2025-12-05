<?php

require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json();

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || !isset($input['galleries']) || !is_array($input['galleries'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid payload'], JSON_UNESCAPED_UNICODE);
    exit;
}

$galleries = [];
foreach ($input['galleries'] as $gallery) {
    if (!isset($gallery['id'], $gallery['routePath'], $gallery['title'])) {
        echo json_encode(['success' => false, 'error' => 'Missing gallery fields'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $gallery['id'] = trim((string)$gallery['id']);
    $gallery['routePath'] = trim((string)$gallery['routePath'], " \t\n\r\0\x0B/");
    $gallery['title'] = trim((string)$gallery['title']);
    $gallery['menuLabel'] = isset($gallery['menuLabel'])
        ? trim((string)$gallery['menuLabel'])
        : $gallery['title'];

    if ($gallery['id'] === '' || $gallery['routePath'] === '' || $gallery['title'] === '') {
        echo json_encode(['success' => false, 'error' => 'Gallery id, routePath and title are required'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!isset($gallery['filters']) || !is_array($gallery['filters'])) {
        $gallery['filters'] = [];
    }

    foreach ($gallery['filters'] as &$filter) {
        $filter['id'] = isset($filter['id']) ? trim((string)$filter['id']) : '';
        $filter['label'] = isset($filter['label']) ? trim((string)$filter['label']) : '';
        $filter['showInMenu'] = !empty($filter['showInMenu']);
        if (!isset($filter['clauses']) || !is_array($filter['clauses'])) {
            $filter['clauses'] = [];
        }
        foreach ($filter['clauses'] as &$clause) {
            $clause['mode'] = isset($clause['mode']) && strtoupper($clause['mode']) === 'ALL' ? 'ALL' : 'ANY';
            $clause['tags'] = array_values(array_filter(
                array_map('trim', (array)($clause['tags'] ?? [])),
                fn($tag) => $tag !== ''
            ));
            $clause['excludeTags'] = array_values(array_filter(
                array_map('trim', (array)($clause['excludeTags'] ?? [])),
                fn($tag) => $tag !== ''
            ));
        }
        unset($clause);
    }
    unset($filter);

    $galleries[] = $gallery;
}

if (!galleries_write_all(['galleries' => $galleries])) {
    echo json_encode(['success' => false, 'error' => 'Failed to save galleries'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
