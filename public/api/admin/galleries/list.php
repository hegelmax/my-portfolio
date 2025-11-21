<?php
require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

$data = galleries_read_all();

echo json_encode(
    [
        'success'   => true,
        'galleries' => $data['galleries'],
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
