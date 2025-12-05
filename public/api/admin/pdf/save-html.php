<?php

require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json();

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

if (!is_array($payload)) {
    $payload = $_POST;
}

$slug = pdf_sanitize_slug($payload['slug'] ?? '');
$title = trim((string)($payload['title'] ?? ''));
$html  = (string)($payload['html'] ?? '');
$pageCount = isset($payload['pageCount']) ? max(0, (int)$payload['pageCount']) : null;
$previewImage = isset($payload['previewImage']) ? (string)$payload['previewImage'] : null;

if ($slug === '' || $title === '' || trim($html) === '') {
    echo json_encode(['success' => false, 'error' => 'slug, title and html are required'], JSON_UNESCAPED_UNICODE);
    exit;
}

pdf_ensure_base_dirs();

$htmlFile = pdf_html_file($slug);
$htmlDir = dirname($htmlFile);
if (!is_dir($htmlDir)) {
    @mkdir($htmlDir, 0775, true);
}

if (file_put_contents($htmlFile, $html) === false) {
    echo json_encode(['success' => false, 'error' => 'Failed to write HTML file'], JSON_UNESCAPED_UNICODE);
    exit;
}

$worksData = pdf_read_works();
$works = $worksData['works'];
$existingIndex = null;
$existing = null;

foreach ($works as $idx => $work) {
    if (isset($work['slug']) && $work['slug'] === $slug) {
        $existingIndex = $idx;
        $existing = $work;
        break;
    }
}

$now = date('c');
$entry = [
    'title'       => $title,
    'slug'        => $slug,
    'htmlPath'    => pdf_html_url($slug),
    'pagesDir'    => pdf_pages_url($slug),
    'createdAt'   => $existing['createdAt'] ?? $now,
    'updatedAt'   => $now,
];

if ($pageCount !== null) {
    $entry['pageCount'] = $pageCount;
}

if ($previewImage) {
    $entry['previewImage'] = $previewImage;
} else {
    $entry['previewImage'] = pdf_page_url($slug, 1);
}

if ($existingIndex !== null) {
    $works[$existingIndex] = $entry;
} else {
    $works[] = $entry;
}

if (!pdf_write_works($works)) {
    echo json_encode(['success' => false, 'error' => 'Failed to update pdf-works.json'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(
    [
        'success' => true,
        'work'    => $entry,
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
