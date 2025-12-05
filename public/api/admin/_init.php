<?php

include_once __DIR__ . '/../_init.php';
include_once __DIR__ . '/auth/_init.php';

// Global guard: observers are read-only
if (admin_is_logged_in()) {
    $role = admin_current_role();
    if ($role === 'observer' && ($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Forbidden: read-only role'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
