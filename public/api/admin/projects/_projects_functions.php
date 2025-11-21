<?php
function projects_read_all(): array {
    if (!file_exists(PROJECTS_FILE)) {
        return [];
    }
    $json = file_get_contents(PROJECTS_FILE);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function projects_write_all(array $items): bool {
    $dir = dirname(PROJECTS_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    $json = json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $fp = fopen(PROJECTS_FILE, 'c+');
    if (!$fp) return false;

    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return true;
}

function projects_next_id(array $items): int {
    $max = 0;
    foreach ($items as $item) {
        if (isset($item['id']) && is_numeric($item['id'])) {
            $v = (int)$item['id'];
            if ($v > $max) $max = $v;
        }
    }
    return $max + 1;
}
