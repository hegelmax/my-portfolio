<?php

require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');

admin_require_auth_json();

// Read JSON from request body
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$id = $input['id'] ?? null;

// Basic normalization of required fields
$title    = isset($input['title'])    ? trim($input['title'])    : '';
$slug     = isset($input['slug'])     ? trim($input['slug'])     : '';
$category = isset($input['category']) ? trim($input['category']) : '';
$selected = !empty($input['selected']);

$errors = [];

// These fields are required in the UI — validate them
if ($title === '') {
    $errors[] = 'Title is required';
}
if ($slug === '') {
    $errors[] = 'Slug is required';
}
if ($category === '') {
    $errors[] = 'Category is required';
}

if ($errors) {
    echo json_encode([
        'success' => false,
        'errors'  => $errors,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Write normalized values back to the object
// so the file receives the cleaned object
$input['title']    = $title;
$input['slug']     = $slug;
$input['category'] = $category;
$input['selected'] = $selected;

// Read all projects from file
$items = projects_read_all();
$item  = null;

// New project (id missing or empty)
if ($id === null || $id === '' || !is_numeric($id)) {
    $newId = projects_next_id($items);
    $input['id'] = $newId;

    // Keep id type consistent
    $items[] = $input;
    $item = $input;
} else {
    // Update existing project
    $id = (int)$id;
    $found = false;

    foreach ($items as &$proj) {
        if (isset($proj['id']) && (int)$proj['id'] === $id) {
            // Keep id fixed even if a different one was sent in the request
            $input['id'] = $id;
            // KEY POINT: save the object exactly as it was received
            $proj = $input;
            $item = $proj;
            $found = true;
            break;
        }
    }
    unset($proj);

    if (!$found) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'errors'  => ['Project not found'],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Write everything back to projects.json
if (!projects_write_all($items)) {
    echo json_encode([
        'success' => false,
        'errors'  => ['Failed to write projects.json'],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Successful response — like delete.php: success + items (+ item for convenience)
echo json_encode([
    'success' => true,
    'item'    => $item,
    'items'   => $items,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
