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

    // Новый формат: ['admins' => [ {...}, {...} ]]
    if (!empty($cfg['admins']) && is_array($cfg['admins'])) {
        foreach ($cfg['admins'] as $adm) {
            if (!empty($adm['login']) && !empty($adm['password_hash'])) {
                // хотя бы один админ есть
                return false;
            }
        }
        // массив есть, но валидных нет
        return true;
    }

    // Легаси формат: одиночные login/password_hash на верхнем уровне
    return empty($cfg['login']) || empty($cfg['password_hash']);
}


function admin_login(string $login): void {
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_name'] = $login;
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

function admin_verify_credentials(string $login, string $password): bool {
    $cfg = admin_read_config();

    // Новый формат: config['admins'] — массив админов
    if (!empty($cfg['admins']) && is_array($cfg['admins'])) {
        foreach ($cfg['admins'] as $adm) {
            $admLogin = $adm['login']         ?? '';
            $admHash  = $adm['password_hash'] ?? '';

            if ($admLogin === '' || $admHash === '') {
                continue;
            }

            if ($admLogin !== $login) {
                continue;
            }

            // нашли логин — проверяем пароль
            return password_verify($password, $admHash);
        }
        return false;
    }

    // Легаси формат: один логин
    if (empty($cfg['login']) || empty($cfg['password_hash'])) {
        return false;
    }
    if ($cfg['login'] !== $login) {
        return false;
    }
    return password_verify($password, $cfg['password_hash']);
}


function admin_save_new(string $login, string $password): bool {
    $login = trim($login);
    if ($login === '' || $password === '') return false;

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $cfg = admin_read_config();

    $adminEntry = [
        'login'         => $login,
        'password_hash' => $hash,
        'created_at'    => date('c'),
    ];

    // Если уже есть новый формат — добавляем в список
    if (!empty($cfg['admins']) && is_array($cfg['admins'])) {
        $cfg['admins'][] = $adminEntry;
        return admin_write_config($cfg);
    }

    // Если это самый первый запуск и раньше был старый формат,
    // или файла не было — записываем в новом формате
    $cfg = [
        'admins' => [
            $adminEntry,
        ],
    ];

    return admin_write_config($cfg);
}
