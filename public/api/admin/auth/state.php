<?php

include_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

$cfg = admin_read_config();

$name = null;
$role = 'admin';
if (admin_is_logged_in()) {
    $name = $_SESSION['admin_name'] ?? null;
    $role = admin_current_role();

    if ($name === null) {
        // New format: use the first user as fallback
        if (!empty($cfg['users']) && is_array($cfg['users']) && !empty($cfg['users'][0]['login'])) {
            $name = $cfg['users'][0]['login'];
        } else {
            $name = 'Admin';
        }
    }
}

echo json_encode([
    'firstRun'        => admin_is_first_run(),
    'isAuthenticated' => admin_is_logged_in(),
    'user'            => admin_is_logged_in() ? ['name' => $name, 'role' => $role] : null,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

