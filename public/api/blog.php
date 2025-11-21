<?php
require_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');

// ==== НАСТРОЙКИ ====

// Путь к файлу кеша статей
const BLOG_CACHE_FILE = __DIR__ . '/../cache/blog_cache.json';

// Папка для кеша изображений (должна существовать и быть writable)
const BLOG_IMG_CACHE_DIR = __DIR__ . '/../cache/blog_images';

// URL домена Joomla (откуда тянем оригинальные картинки)
const JOOMLA_BASE_URL = 'https://renew.style/';

// Фильтр по категории блога (создай category "Fashion Blog" и узнай её id)
const BLOG_CAT_ID = 20;

// Размер картинок
const IMG_TARGET_WIDTH  = 870;
const IMG_TARGET_HEIGHT = 491;

try {
    // 1. Подключаем конфиг Джумлы, чтобы взять логин/пароль к БД
    // поправь относительный путь под свою структуру
    require_once __DIR__ . '/../../../style.renew/public/configuration.php';

    $config = new \JConfig();

    $dsn = 'mysql:host=' . $config->host . ';dbname=' . $config->db . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $config->user, $config->password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $prefix = $config->dbprefix;

	// Убедимся, что папка для картинок есть
	if (!is_dir(BLOG_IMG_CACHE_DIR)) {
		mkdir(BLOG_IMG_CACHE_DIR, 0775, true);
	}

    // Параметры пагинации
    $page  = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(20, max(1, (int)($_GET['limit'] ?? 5)));
    $offset = ($page - 1) * $limit;

	// ==== ОСНОВНАЯ ЛОГИКА ====

	// 1. Загружаем кеш
	$cache = loadCache();

	// 2. Определяем "точку синка" (последняя дата изменения статей)
	$lastModified = $cache['last_modified'];

	if ($lastModified) {
		// Берём только новые / изменённые статьи после lastModified
		$sql = "SELECT id, title, alias, introtext, images, catid, created, created_by_alias
			FROM {$prefix}content
			WHERE	state = 1
				AND	catid = :catid
				AND	(created > :lm OR modified > :lm)
			ORDER BY created DESC";
		$stmt = $pdo->prepare($sql);
		$stmt->execute([':lm' => $lastModified, ':catid' => BLOG_CAT_ID]);
	} else {
		// Кеша ещё нет — берём все опубликованные статьи
		$sql = "SELECT id, title, alias, introtext, images, catid, created, created_by_alias
			FROM {$prefix}content
			WHERE	state = 1
				AND	catid = :catid
			ORDER BY created DESC";
		$stmt = $pdo->prepare($sql);
		$stmt->execute([':catid' => BLOG_CAT_ID]);
	}

	$newRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

	// 3. Переводим кешированные статьи в массив по id для удобного обновления
	$articlesById = [];
	foreach ($cache['articles'] as $article) {
		$articlesById[$article['id']] = $article;
	}

	// 4. Обновляем статьи и считаем новый last_modified
	$maxModified = $lastModified ? $lastModified : '1970-01-01 00:00:00';

	foreach ($newRows as $row) {
		$id = (int)$row['id'];

		// Joomla в поле images хранит JSON
		$imagesJson = $row['images'] ?? '';
		$imageIntro = null;
		if ($imagesJson) {
			$imgData = json_decode($imagesJson, true);
			if (is_array($imgData) && !empty($imgData['image_intro'])) {
				$imageIntro = $imgData['image_intro'];
			}
		}

		// Кешируем картинку и получаем локальный URL
		$localImageUrl = $imageIntro ? cacheImage($imageIntro, $id) : null;

		// Чистим introtext от HTML и режем длину
		$introRaw = strip_tags($row['introtext'] ?? '');
		$intro = mb_substr($introRaw, 0, 350);
		if (mb_strlen($introRaw) > 350) {
			$intro .= '…';
		}

		// Подготовка статьи для API
		$article = [
			'id'        => $id,
			'title'     => $row['title'],
			'slug'      => $row['alias'],
			'intro'     => $intro,
			'image'     => $localImageUrl,  // локальный путь
			'created'   => $row['created'],
			'modified'  => $row['modified'] ?: $row['created'],
			'author'    => $row['created_by_alias'] ?: 'Nadia Paley',
		];

		$articlesById[$id] = $article;

		// Обновляем maxModified
		$rowModified = $row['modified'] ?: $row['created'];
		if ($rowModified > $maxModified) {
			$maxModified = $rowModified;
		}
	}

	// Если новых строк нет, maxModified останется прежним
	if (!$newRows && !$lastModified) {
		// Вообще нет кеша и нет статей — просто
		$maxModified = null;
	}

	// 5. Собираем массив статей обратно и сортируем по дате создания
	$articles = array_values($articlesById);
	usort($articles, function ($a, $b) {
		return strcmp($b['created'], $a['created']); // новые сверху
	});

	// 6. Обновляем кеш
	$cache['articles']      = $articles;
	$cache['last_modified'] = $maxModified;
	saveCache($cache);

	// 7. Отдаём JSON
	// 6. Формируем ответ
	$total = count($articles);
	$totalPages = $limit > 0 ? (int)ceil($total / $limit) : 1;
	$offset = ($page - 1) * $limit;
	$pagedArticles = array_slice($articles, $offset, $limit);
	
	echo json_encode([
			'generated_at'  => $cache['generated_at'],
			'last_modified' => $cache['last_modified'],
			'page'       => $page,
			'pageSize'   => $limit,
			'total'      => $total,
			'totalPages' => $totalPages,
			'items'      => $pagedArticles,
		], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Server error',
        //'debug' => $e->getMessage(), // включить только на dev
    ], JSON_UNESCAPED_UNICODE);
}

// ==== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====

// Загрузка кеша из файла
function loadCache(): array {
	if (!file_exists(BLOG_CACHE_FILE)) {
		return [
			'generated_at' => null,
			'last_modified' => null,
			'articles' => []
		];
	}

	$json = file_get_contents(BLOG_CACHE_FILE);
	$data = json_decode($json, true);

	if (!is_array($data)) {
		return [
			'generated_at' => null,
			'last_modified' => null,
			'articles' => []
		];
	}

	// Страховка
	$data['articles']      = $data['articles']      ?? [];
	$data['last_modified'] = $data['last_modified'] ?? null;
	$data['generated_at']  = $data['generated_at']  ?? null;

	return $data;
}

// Сохранение кеша
function saveCache(array $data): void {
	$data['generated_at'] = date('c');
	file_put_contents(
		BLOG_CACHE_FILE,
		json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
		LOCK_EX
	);
}

// Нормализация относительного пути картинки в абсолютный URL на Joomla
function buildJoomlaImageUrl(string $imagePath): ?string {
	$imagePath = trim($imagePath);
	if ($imagePath === '') {
		return null;
	}
	// В Joomla часто хранятся пути вида "images/..." — добавляем домен
	if (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://')) {
		return $imagePath; // уже полный путь
	}

	return rtrim(JOOMLA_BASE_URL, '/') . '/' . ltrim($imagePath, '/');
}

// Кеширование и ресайз картинки, возвращает локальный URL
function cacheImage(string $originalPath, int $articleId): ?string {
	$sourceUrl = buildJoomlaImageUrl($originalPath);
	if (!$sourceUrl) {
		return null;
	}

	// Расширение по умолчанию
	$ext = pathinfo(parse_url($sourceUrl, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION);
	if ($ext === '') {
		$ext = 'jpg';
	}

	// Имя файла в кеше: articleID_hash.ext
	$hash = md5($sourceUrl);
	$localFilename = "a{$articleId}_{$hash}.{$ext}";
	$localPath = BLOG_IMG_CACHE_DIR . '/' . $localFilename;

	// Если файл уже есть — не качаем заново
	if (!file_exists($localPath)) {
		// Скачиваем исходник
		$imageData = @file_get_contents($sourceUrl);
		if ($imageData === false) {
			return null;
		}

		$tmpPath = BLOG_IMG_CACHE_DIR . '/tmp_' . uniqid() . '.' . $ext;
		file_put_contents($tmpPath, $imageData);

		// Ресайз
		if (!resizeImage($tmpPath, $localPath, IMG_TARGET_WIDTH, IMG_TARGET_HEIGHT)) {
			@unlink($tmpPath);
			return null;
		}

		@unlink($tmpPath);
	}

	// Вернем относительный URL для фронта, подстрой под свою структуру
	// Например, если /cache/blog_images доступна как /static/blog_images
	$publicPrefix = '/cache/blog_images'; // или '/static/blog_images'
	return $publicPrefix . '/' . $localFilename;
}

// Ресайз с обрезкой по центру под заданный размер
function resizeImage(string $srcPath, string $dstPath, int $targetW, int $targetH): bool {
	[$width, $height, $type] = @getimagesize($srcPath);
	if (!$width || !$height) {
		return false;
	}

	switch ($type) {
		case IMAGETYPE_JPEG:
			$srcImg = @imagecreatefromjpeg($srcPath);
			break;
		case IMAGETYPE_PNG:
			$srcImg = @imagecreatefrompng($srcPath);
			break;
		case IMAGETYPE_WEBP:
			if (function_exists('imagecreatefromwebp')) {
				$srcImg = @imagecreatefromwebp($srcPath);
			} else {
				return false;
			}
			break;
		default:
			// Неизвестный формат — попробуем как jpeg
			$srcImg = @imagecreatefromjpeg($srcPath);
			if (!$srcImg) return false;
	}

	if (!$srcImg) {
		return false;
	}

	// Масштабируем с обрезкой (cover)
	$srcRatio = $width / $height;
	$dstRatio = $targetW / $targetH;

	if ($srcRatio > $dstRatio) {
		// Источник "шире" — подгоняем по высоте, ширину режем
		$newHeight = $targetH;
		$newWidth  = (int) round($targetH * $srcRatio);
	} else {
		// Источник "уже" — подгоняем по ширине, высоту режем
		$newWidth  = $targetW;
		$newHeight = (int) round($targetW / $srcRatio);
	}

	$tmp = imagecreatetruecolor($newWidth, $newHeight);
	imagecopyresampled($tmp, $srcImg, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

	// Обрезаем по центру до нужного размера
	$dstImg = imagecreatetruecolor($targetW, $targetH);
	$srcX = (int) floor(($newWidth  - $targetW) / 2);
	$srcY = (int) floor(($newHeight - $targetH) / 2);
	imagecopy($dstImg, $tmp, 0, 0, $srcX, $srcY, $targetW, $targetH);

	// Сохраняем как jpeg (можно поменять под себя)
	$result = imagejpeg($dstImg, $dstPath, 85);

	imagedestroy($srcImg);
	imagedestroy($tmp);
	imagedestroy($dstImg);

	return $result;
}

