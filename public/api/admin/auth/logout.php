<?php
require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

admin_logout();

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
