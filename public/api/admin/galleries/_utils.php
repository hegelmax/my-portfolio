<?php

function galleries_file_path(): string {
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0775, true);
    }
    return DATA_DIR . '/galleries.json';
}

function galleries_read_all(): array {
    $file = galleries_file_path();
    if (!is_file($file)) {
        return ['galleries' => []];
    }

    $json = file_get_contents($file);
    $data = json_decode($json, true);

    if (!is_array($data)) {
        return ['galleries' => []];
    }

    if (!isset($data['galleries']) || !is_array($data['galleries'])) {
        $data['galleries'] = [];
    }

    return $data;
}

function galleries_write_all(array $data): bool {
    $file = galleries_file_path();
    return file_put_contents(
        $file,
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    ) !== false;
}

function galleries_find_by_id(string $id): ?array {
    $data = galleries_read_all();
    foreach ($data['galleries'] as $gallery) {
        if (isset($gallery['id']) && $gallery['id'] === $id) {
            return $gallery;
        }
    }
    return null;
}
