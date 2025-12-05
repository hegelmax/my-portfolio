<?php

function media_file_path(): string {
    return DATA_DIR.'/media.json';
}

function media_read_all(): array {
    $file = media_file_path();
    if (!is_file($file)) return [];
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function media_write_all(array $items): bool {
    $file = media_file_path();
    return file_put_contents(
        $file,
        json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    ) !== false;
}

function media_next_id(array $items): int {
    $max = 0;
    foreach ($items as $it) {
        if (isset($it['id']) && (int)$it['id'] > $max) {
            $max = (int)$it['id'];
        }
    }
    return $max + 1;
}