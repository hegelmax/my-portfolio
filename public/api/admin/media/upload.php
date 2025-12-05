<?php

require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_auth_json(); // auth via your pattern

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Upload error'], JSON_UNESCAPED_UNICODE);
    exit;
}

$origName = $_FILES['file']['name'];
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
    echo json_encode(['success' => false, 'error' => 'Unsupported file type'], JSON_UNESCAPED_UNICODE);
    exit;
}

// read image
$tmp = $_FILES['file']['tmp_name'];
switch ($ext) {
    case 'jpg':
    case 'jpeg':
        $src = imagecreatefromjpeg($tmp);
        break;
    case 'png':
        $src = imagecreatefrompng($tmp);
        break;
    case 'webp':
        $src = imagecreatefromwebp($tmp);
        break;
    default:
        $src = null;
}

if (!$src) {
    echo json_encode(['success' => false, 'error' => 'Unsupported image'], JSON_UNESCAPED_UNICODE);
    exit;
}

$width = imagesx($src);
$height = imagesy($src);
$scale = min(1, MAX_PHOTO_SIZE_PX / max($width, $height));

if ($scale < 1) {
    $newW = (int) round($width * $scale);
    $newH = (int) round($height * $scale);

    $dst = imagecreatetruecolor($newW, $newH);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $width, $height);

    imagedestroy($src);
    $src = $dst;
    $width = $newW;
    $height = $newH;
}

// auto-name: yyyymmdd_his_rand.webp
$baseName = 'img_' . date('Ymd_His') . '_' . mt_rand(1000, 9999);
$filename = $baseName . '.webp';
$dest = IMG_DIR . '/' . $filename;

if (!is_dir(IMG_DIR)) {
    mkdir(IMG_DIR, 0775, true);
}

if (!imagewebp($src, $dest, 85)) {
    imagedestroy($src);
    echo json_encode(['success' => false, 'error' => 'Failed to save image'], JSON_UNESCAPED_UNICODE);
    exit;
}

imagedestroy($src);

// web path
$relative = str_replace(ROOT_DIR, '', $dest); // e.g. /images/portfolio/2025/11/20/img_...webp

// tags (if provided immediately)
$tags = [];
if (!empty($_POST['tags'])) {
    $raw = is_array($_POST['tags']) ? $_POST['tags'] : explode(',', $_POST['tags']);
    foreach ($raw as $t) {
        $t = trim((string)$t);
        if ($t !== '') $tags[] = $t;
    }
}

// save to media.json
$items = media_read_all();
$id = media_next_id($items);

$item = [
    'id'        => $id,
    'path'      => $relative,
    'filename'  => $filename,
    'tags'      => $tags,
    'width'     => $width,
    'height'    => $height,
    'createdAt' => date('c'),
];

$items[] = $item;
media_write_all($items);

echo json_encode([
    'success' => true,
    'item'    => $item,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
