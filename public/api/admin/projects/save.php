<?php
require_once '_init.php';

header('Content-Type: application/json; charset=utf-8');

admin_require_auth_json();

// Читаем JSON из тела запроса
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$id = $input['id'] ?? null;

// Базовая нормализация "обязательных" полей
$title    = isset($input['title'])    ? trim($input['title'])    : '';
$slug     = isset($input['slug'])     ? trim($input['slug'])     : '';
$category = isset($input['category']) ? trim($input['category']) : '';
$selected = !empty($input['selected']);

$errors = [];

// В твоём UI эти поля по сути обязательные — проверим
if ($title === '') {
    $errors[] = 'Title is required';
}
if ($slug === '') {
    $errors[] = 'Slug is required';
}
if ($category === '') {
    $errors[] = 'Category is required';
}

if ($errors) {
    echo json_encode([
        'success' => false,
        'errors'  => $errors,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Записываем нормализованные значения обратно в объект,
// чтобы в файл ушёл уже "правильный" объект
$input['title']    = $title;
$input['slug']     = $slug;
$input['category'] = $category;
$input['selected'] = $selected;

// Читаем все проекты из файла
$items = projects_read_all();
$item  = null;

// Новый проект (id нет или пустой)
if ($id === null || $id === '' || !is_numeric($id)) {
    $newId = projects_next_id($items);
    $input['id'] = $newId;

    // На всякий случай следим за типом id
    $items[] = $input;
    $item = $input;
} else {
    // Обновление существующего проекта
    $id = (int)$id;
    $found = false;

    foreach ($items as &$proj) {
        if (isset($proj['id']) && (int)$proj['id'] === $id) {
            // id фиксируем, даже если вдруг в запросе кто-то прислал другой
            $input['id'] = $id;
            // КЛЮЧЕВОЙ МОМЕНТ: сохраняем объект целиком, как пришёл
            $proj = $input;
            $item = $proj;
            $found = true;
            break;
        }
    }
    unset($proj);

    if (!$found) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'errors'  => ['Project not found'],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Пишем всё обратно в projects.json
if (!projects_write_all($items)) {
    echo json_encode([
        'success' => false,
        'errors'  => ['Failed to write projects.json'],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Успешный ответ — как в delete.php: success + items (+ item для удобства фронта)
echo json_encode([
    'success' => true,
    'item'    => $item,
    'items'   => $items,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
