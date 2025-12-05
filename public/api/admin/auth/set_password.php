<?php

require_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$token = trim($input['token'] ?? '');
$password = $input['password'] ?? '';

if ($token === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid token or password'], JSON_UNESCAPED_UNICODE);
    exit;
}

$cfg = admin_read_config();
if (empty($cfg['users']) || !is_array($cfg['users'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid token'], JSON_UNESCAPED_UNICODE);
    exit;
}

$foundLogin = null;
foreach ($cfg['users'] as &$adm) {
    if (($adm['invite_token'] ?? '') === $token) {
        $adm['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        $adm['invite_token'] = null;
        $adm['updated_at'] = date('c');
        $foundLogin = $adm['login'] ?? null;
        break;
    }
}
unset($adm);

if ($foundLogin === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid token'], JSON_UNESCAPED_UNICODE);
    exit;
}

admin_write_config($cfg);

echo json_encode(['success' => true, 'login' => $foundLogin], JSON_UNESCAPED_UNICODE);
