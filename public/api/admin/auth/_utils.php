<?php

function admin_require_auth_json() {
    if (!admin_is_logged_in()) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function admin_read_config(): array {
    if (!file_exists(ADMIN_CONFIG_FILE)) {
        return [];
    }
    $json = file_get_contents(ADMIN_CONFIG_FILE);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function admin_write_config(array $data): bool {
    $dir = dirname(ADMIN_CONFIG_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $fp = fopen(ADMIN_CONFIG_FILE, 'c+');
    if (!$fp) return false;

    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return true;
}

function admin_is_first_run(): bool {
    $cfg = admin_read_config();

    // New format: ['users' => [ {...}, {...} ]]
    if (empty($cfg['users']) || !is_array($cfg['users'])) {
        return true;
    }
    foreach ($cfg['users'] as $adm) {
        if (!empty($adm['login']) && !empty($adm['password_hash'])) {
            // at least one admin exists
            return false;
        }
    }
    return true;
}


function admin_login(string $login, string $role = 'admin'): void {
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_name'] = $login;
    $_SESSION['admin_role'] = $role;
}

function admin_logout(): void {
    $_SESSION = [];
    if (session_id() !== '') {
        session_destroy();
    }
}

function admin_is_logged_in(): bool {
    return !empty($_SESSION['admin_logged_in']);
}

function admin_current_role(): string {
    return $_SESSION['admin_role'] ?? 'admin';
}

function admin_current_login(): ?string {
    return $_SESSION['admin_name'] ?? null;
}

function admin_require_role(array $allowed): void {
    if (!admin_is_logged_in()) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $role = admin_current_role();
    if (!in_array($role, $allowed, true)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Forbidden'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function admin_find_user(string $login): ?array {
    $cfg = admin_read_config();
    if (empty($cfg['users']) || !is_array($cfg['users'])) {
        return null;
    }
    foreach ($cfg['users'] as $adm) {
        if (($adm['login'] ?? '') === $login) {
            return $adm;
        }
    }
    return null;
}

function admin_verify_credentials(string $login, string $password): bool {
    $user = admin_find_user($login);
    if (!$user) return false;

    $hash = $user['password_hash'] ?? '';
    if ($hash === '') return false;

    return password_verify($password, $hash);
}


function admin_save_new(string $login, string $password): bool {
    $login = trim($login);
    if ($login === '' || $password === '') return false;

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $cfg = admin_read_config();

    $adminEntry = [
        'login'         => $login,
        'password_hash' => $hash,
        'role'          => 'admin',
        'created_at'    => date('c'),
    ];

    // If new format already exists - add to the list
    if (!empty($cfg['users']) && is_array($cfg['users'])) {
        $cfg['users'][] = $adminEntry;
        return admin_write_config($cfg);
    }

    // If first run and there was only the old format,
    // or file was missing — write using the new format
    $cfg = [
        'users' => [
            $adminEntry,
        ],
    ];

    return admin_write_config($cfg);
}

function admin_build_invite_url(string $token): string {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $scheme . '://' . $host . '/admin/set-password?token=' . urlencode($token);
}
