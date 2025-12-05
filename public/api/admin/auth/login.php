<?php

require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

if (admin_is_first_run()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => ['Setup required']], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$login    = trim($input['name'] ?? '');
$password = $input['password'] ?? '';

if (!admin_verify_credentials($login, $password)) {
    echo json_encode(['success' => false, 'errors' => ['Invalid login or password']], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = admin_find_user($login) ?? [];
$role = $user['role'] ?? 'admin';

admin_login($login, $role);

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
