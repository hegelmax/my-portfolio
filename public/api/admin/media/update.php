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

$formatProvided = array_key_exists('format', $input);
$format = $formatProvided ? trim((string)$input['format']) : null;
$allowedFormats = ['1:1', '1:2', '2:1', '2:2'];
if ($formatProvided && $format !== '' && !in_array($format, $allowedFormats, true)) {
    $format = null;
}

$fitProvided = array_key_exists('fit', $input);
$fitRaw = $fitProvided ? strtolower(trim((string)$input['fit'])) : null;
$fit = ($fitRaw === 'contain' || $fitRaw === 'cover') ? $fitRaw : null;

$focusXProvided = array_key_exists('focusX', $input);
$focusYProvided = array_key_exists('focusY', $input);
$rotationProvided = array_key_exists('rotation', $input);

function clamp01(float $value): float {
    if ($value < 0) return 0.0;
    if ($value > 100) return 100.0;
    return $value;
}

function normalize_rotation($value) {
    if (!is_numeric($value)) return null;
    $r = ((float)$value) % 360;
    if ($r < 0) $r += 360;
    return round($r, 2);
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
        if ($formatProvided) {
            if ($format) {
                $item['format'] = $format;
            } else {
                unset($item['format']);
            }
        }
        if ($fitProvided) {
            if ($fit) {
                $item['fit'] = $fit;
            } else {
                unset($item['fit']);
            }
        }
        if ($focusXProvided) {
            if (is_numeric($input['focusX'])) {
                $item['focusX'] = clamp01((float)$input['focusX']);
            } else {
                unset($item['focusX']);
            }
        }
        if ($focusYProvided) {
            if (is_numeric($input['focusY'])) {
                $item['focusY'] = clamp01((float)$input['focusY']);
            } else {
                unset($item['focusY']);
            }
        }
        if ($rotationProvided) {
            $rot = normalize_rotation($input['rotation']);
            if ($rot === null) {
                unset($item['rotation']);
            } else {
                $item['rotation'] = $rot;
            }
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
