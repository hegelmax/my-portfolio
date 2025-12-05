<?php

require_once __DIR__ . '/../auth/_init.php';

header('Content-Type: application/json; charset=utf-8');
admin_require_role(['admin']);

$cfg = admin_read_config();
$users = [];
if (!empty($cfg['users']) && is_array($cfg['users'])) {
    foreach ($cfg['users'] as $adm) {
        $login = $adm['login'] ?? '';
        if ($login === '') continue;
        $role = $adm['role'] ?? 'admin';
        $hasPassword = !empty($adm['password_hash']);
        $token = $adm['invite_token'] ?? null;
        $users[] = [
            'login'        => $login,
            'role'         => $role,
            'hasPassword'  => $hasPassword,
            'inviteToken'  => $token,
            'inviteUrl'    => $token ? (admin_build_invite_url($token)) : null,
        ];
    }
}

echo json_encode(['success' => true, 'users' => $users], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
