<?php
include_once __DIR__ . '/_init.php';

header('Content-Type: application/json; charset=utf-8');

$cfg = admin_read_config();

$name = null;
if (admin_is_logged_in()) {
    $name = $_SESSION['admin_name'] ?? null;

    if ($name === null) {
        // Новый формат: берём первого админа для фоллбека
        if (!empty($cfg['admins']) && is_array($cfg['admins']) && !empty($cfg['admins'][0]['login'])) {
            $name = $cfg['admins'][0]['login'];
        } elseif (!empty($cfg['login'])) { // старый формат
            $name = $cfg['login'];
        } else {
            $name = 'Admin';
        }
    }
}

echo json_encode([
    'firstRun'        => admin_is_first_run(),
    'isAuthenticated' => admin_is_logged_in(),
    'user'            => admin_is_logged_in() ? ['name' => $name] : null,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);


