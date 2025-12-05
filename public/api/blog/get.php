<?php

require_once __DIR__ . '/../_init.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. Load Joomla config to get DB credentials
    // adjust the relative path for your structure
    require_once ROOT_DIR . '/../../style.renew/public/configuration.php';

    $config = new \JConfig();

    $dsn = 'mysql:host=' . $config->host . ';dbname=' . $config->db . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $config->user, $config->password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $prefix = $config->dbprefix;

	// Ensure the images folder exists
	if (!is_dir(BLOG_IMG_CACHE_DIR)) {
		mkdir(BLOG_IMG_CACHE_DIR, 0775, true);
	}

    // Pagination params
    $page  = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(20, max(1, (int)($_GET['limit'] ?? 5)));
    $offset = ($page - 1) * $limit;

	// ==== MAIN LOGIC ====

	// 1. Load cache
	$cache = loadCache();

	// 2. Determine sync point (latest article modification date)
	$lastModified = $cache['last_modified'];

	if ($lastModified) {
		// Take only new / updated articles after lastModified
		$sql = "SELECT id, title, alias, introtext, images, catid, created, created_by_alias
			FROM {$prefix}content
			WHERE	state = 1
				AND	catid = :catid
				AND	(created > :lm OR modified > :lm)
			ORDER BY created DESC";
		$stmt = $pdo->prepare($sql);
		$stmt->execute([':lm' => $lastModified, ':catid' => BLOG_CAT_ID]);
	} else {
		// No cache yet — take all published articles
		$sql = "SELECT id, title, alias, introtext, images, catid, created, created_by_alias
			FROM {$prefix}content
			WHERE	state = 1
				AND	catid = :catid
			ORDER BY created DESC";
		$stmt = $pdo->prepare($sql);
		$stmt->execute([':catid' => BLOG_CAT_ID]);
	}

	$newRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

	// 3. Convert cached articles to an array by id for easy updates
	$articlesById = [];
	foreach ($cache['articles'] as $article) {
		$articlesById[$article['id']] = $article;
	}

	// 4. Update articles and compute new last_modified
	$maxModified = $lastModified ? $lastModified : '1970-01-01 00:00:00';

	foreach ($newRows as $row) {
		$id = (int)$row['id'];

		// Joomla stores JSON in the images field
		$imagesJson = $row['images'] ?? '';
		$imageIntro = null;
		if ($imagesJson) {
			$imgData = json_decode($imagesJson, true);
			if (is_array($imgData) && !empty($imgData['image_intro'])) {
				$imageIntro = $imgData['image_intro'];
			}
		}

		// Cache the image and get a local URL
		$localImageUrl = $imageIntro ? cacheImage($imageIntro, $id) : null;

		// Strip HTML from introtext and trim length
		$introRaw = strip_tags($row['introtext'] ?? '');
		$intro = mb_substr($introRaw, 0, 350);
		if (mb_strlen($introRaw) > 350) {
			$intro .= '…';
		}

		// Prepare article for API
		$article = [
			'id'        => $id,
			'title'     => $row['title'],
			'slug'      => $row['alias'],
			'intro'     => $intro,
			'image'     => $localImageUrl,  // local path
			'created'   => $row['created'],
			'modified'  => $row['modified'] ?: $row['created'],
			'author'    => $row['created_by_alias'] ?: 'Nadia Paley',
		];

		$articlesById[$id] = $article;

		// Update maxModified
		$rowModified = $row['modified'] ?: $row['created'];
		if ($rowModified > $maxModified) {
			$maxModified = $rowModified;
		}
	}

	// If there are no new rows, maxModified stays the same
	if (!$newRows && !$lastModified) {
		// No cache at all and no articles — return empty
		$maxModified = null;
	}

	// 5. Assemble the articles array and sort by created date
	$articles = array_values($articlesById);
	usort($articles, function ($a, $b) {
		return strcmp($b['created'], $a['created']); // newest first
	});

	// 6. Update cache
	$cache['articles']      = $articles;
	$cache['last_modified'] = $maxModified;
	saveCache($cache);

	// 7. Return JSON
	// 6. Build response
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
        //'debug' => $e->getMessage(), // enable only on dev
    ], JSON_UNESCAPED_UNICODE);
}

// ==== HELPER FUNCTIONS ====

// Load cache from file
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

	// Safety defaults
	$data['articles']      = $data['articles']      ?? [];
	$data['last_modified'] = $data['last_modified'] ?? null;
	$data['generated_at']  = $data['generated_at']  ?? null;

	return $data;
}

// Save cache
function saveCache(array $data): void {
	$data['generated_at'] = date('c');
	file_put_contents(
		BLOG_CACHE_FILE,
		json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
		LOCK_EX
	);
}

// Normalize relative image path to an absolute Joomla URL
function buildJoomlaImageUrl(string $imagePath): ?string {
	$imagePath = trim($imagePath);
	if ($imagePath === '') {
		return null;
	}
	// In Joomla, paths often look like \"images/...\" — append domain
	if (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://')) {
		return $imagePath; // already a full path
	}

	return rtrim(BLOG_JOOMLA_BASE_URL, '/') . '/' . ltrim($imagePath, '/');
}

// Cache and resize image, return local URL
function cacheImage(string $originalPath, int $articleId): ?string {
	$sourceUrl = buildJoomlaImageUrl($originalPath);
	if (!$sourceUrl) {
		return null;
	}

	// Default extension
	$ext = pathinfo(parse_url($sourceUrl, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION);
	if ($ext === '') {
		$ext = 'jpg';
	}

	// Cached filename: articleID_hash.ext
	$hash = md5($sourceUrl);
	$localFilename = "a{$articleId}_{$hash}.{$ext}";
	$localPath = BLOG_IMG_CACHE_DIR . '/' . $localFilename;

	// If file already exists — skip download
	if (!file_exists($localPath)) {
		// Download source
		$imageData = @file_get_contents($sourceUrl);
		if ($imageData === false) {
			return null;
		}

		$tmpPath = BLOG_IMG_CACHE_DIR . '/tmp_' . uniqid() . '.' . $ext;
		file_put_contents($tmpPath, $imageData);

		// Resize
		if (!resizeImage($tmpPath, $localPath, BLOG_IMG_TARGET_WIDTH, BLOG_IMG_TARGET_HEIGHT)) {
			@unlink($tmpPath);
			return null;
		}

		@unlink($tmpPath);
	}

	// Return relative URL for the front-end; adjust for your structure
	// For example, if /cache/blog_images is served as /static/blog_images
	$publicPrefix = '/cache/blog_images'; // or '/static/blog_images'
	return $publicPrefix . '/' . $localFilename;
}

// Resize with center crop to the target size
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
			// Unknown format — try jpeg
			$srcImg = @imagecreatefromjpeg($srcPath);
			if (!$srcImg) return false;
	}

	if (!$srcImg) {
		return false;
	}

	// Scale with cropping (cover)
	$srcRatio = $width / $height;
	$dstRatio = $targetW / $targetH;

	if ($srcRatio > $dstRatio) {
		// Source is wider — match height, crop width
		$newHeight = $targetH;
		$newWidth  = (int) round($targetH * $srcRatio);
	} else {
		// Source is taller — match width, crop height
		$newWidth  = $targetW;
		$newHeight = (int) round($targetW / $srcRatio);
	}

	$tmp = imagecreatetruecolor($newWidth, $newHeight);
	imagecopyresampled($tmp, $srcImg, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

	// Center-crop to target size
	$dstImg = imagecreatetruecolor($targetW, $targetH);
	$srcX = (int) floor(($newWidth  - $targetW) / 2);
	$srcY = (int) floor(($newHeight - $targetH) / 2);
	imagecopy($dstImg, $tmp, 0, 0, $srcX, $srcY, $targetW, $targetH);

	// Save as jpeg (adjust if needed)
	$result = imagejpeg($dstImg, $dstPath, 85);

	imagedestroy($srcImg);
	imagedestroy($tmp);
	imagedestroy($dstImg);

	return $result;
}
