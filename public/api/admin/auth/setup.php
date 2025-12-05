<?php

require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

if (!admin_is_first_run()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => ['Setup already done']], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$login    = trim($input['name'] ?? '');
$password = $input['password'] ?? '';

$errors = [];

if ($login === '') {
    $errors[] = 'Enter a login';
}
if ($password === '') {
    $errors[] = 'Enter a password';
}
if (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters long';
}

if ($errors) {
    echo json_encode(['success' => false, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!admin_save_new($login, $password)) {
    echo json_encode(['success' => false, 'errors' => ['Failed to save config']], JSON_UNESCAPED_UNICODE);
    exit;
}

admin_login($login);

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
