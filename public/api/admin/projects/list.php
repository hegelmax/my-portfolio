<?php

require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');

admin_require_auth_json();

$items = projects_read_all();

echo json_encode([
    'success' => true,
    'items'   => $items,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
