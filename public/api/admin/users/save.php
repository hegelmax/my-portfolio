<?php

require_once __DIR__ . '/../auth/_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_role(['admin']);

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$login = trim($input['login'] ?? '');
$role  = $input['role'] ?? 'admin';
$generateInvite = !empty($input['generateInvite']);

if ($login === '' || !in_array($role, ['admin', 'moderator', 'observer'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input'], JSON_UNESCAPED_UNICODE);
    exit;
}

$cfg = admin_read_config();
if (empty($cfg['users']) || !is_array($cfg['users'])) {
    $cfg['users'] = [];
}

$found = false;
$inviteLink = null;
foreach ($cfg['users'] as &$adm) {
    if (($adm['login'] ?? '') !== $login) continue;
    $found = true;
    $adm['role'] = $role;
    if ($generateInvite) {
        $token = bin2hex(random_bytes(24));
        $adm['invite_token'] = $token;
        $inviteLink = admin_build_invite_url($token);
    }
}
unset($adm);

if (!$found) {
    $token = bin2hex(random_bytes(24));
    $cfg['users'][] = [
        'login'         => $login,
        'password_hash' => '',
        'role'          => $role,
        'invite_token'  => $token,
        'created_at'    => date('c'),
    ];
    $inviteLink = admin_build_invite_url($token);
}

admin_write_config($cfg);

echo json_encode(['success' => true, 'inviteLink' => $inviteLink], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
