<?php

require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json();

$slug = pdf_sanitize_slug($_POST['slug'] ?? '');
$pageNumber = isset($_POST['pageNumber']) ? (int)$_POST['pageNumber'] : 0;

if ($slug === '' || $pageNumber < 1) {
    echo json_encode(['success' => false, 'error' => 'slug and pageNumber are required'], JSON_UNESCAPED_UNICODE);
    exit;
}

pdf_ensure_base_dirs();

$dir = pdf_pages_dir($slug);
if (!is_dir($dir)) {
    @mkdir($dir, 0775, true);
}

$binary = null;

if (!empty($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $binary = file_get_contents($_FILES['file']['tmp_name']);
} else {
    $imageData = $_POST['imageData'] ?? '';
    if (strpos($imageData, ',') !== false) {
        [, $imageData] = explode(',', $imageData, 2);
    }
    $binary = base64_decode((string)$imageData);
}

if (!$binary) {
    echo json_encode(['success' => false, 'error' => 'Image data is missing or invalid'], JSON_UNESCAPED_UNICODE);
    exit;
}

$image = @imagecreatefromstring($binary);
if (!$image) {
    echo json_encode(['success' => false, 'error' => 'Failed to read PNG data'], JSON_UNESCAPED_UNICODE);
    exit;
}

imagesavealpha($image, true);
$target = pdf_page_file($slug, $pageNumber);
$saved = imagepng($image, $target);
imagedestroy($image);

if (!$saved) {
    echo json_encode(['success' => false, 'error' => 'Failed to save page image'], JSON_UNESCAPED_UNICODE);
    exit;
}

$imageUrl = pdf_page_url($slug, $pageNumber);

echo json_encode(
    [
        'success'  => true,
        'imageUrl' => $imageUrl,
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
