<?php

require_once __DIR__ . '/../auth/_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_role(['admin']);

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$login = trim($input['login'] ?? '');

if ($login === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Login is required'], JSON_UNESCAPED_UNICODE);
    exit;
}

$current = admin_current_login();
if ($current === $login) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'You cannot delete yourself'], JSON_UNESCAPED_UNICODE);
    exit;
}

$cfg = admin_read_config();
if (empty($cfg['users']) || !is_array($cfg['users'])) {
    echo json_encode(['success' => true]);
    exit;
}

$cfg['users'] = array_values(array_filter($cfg['users'], function ($adm) use ($login) {
    return ($adm['login'] ?? '') !== $login;
}));

admin_write_config($cfg);

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
