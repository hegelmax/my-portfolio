<?php

// =======================================
// CONFIG
// =======================================

$seoFile       = DATA_DIR  . '/seo.json';
$manifestFile  = ROOT_DIR  . '/.vite/manifest.json';

// Current path, for example: "/", "/about", "/projects/..."
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalizing the cache file name
if ($path === '/' || $path === '' || $path === false) {
    $cacheKey = 'home';
} else {
    // "/about/me" -> "about_me"
    $cacheKey = trim(str_replace('/', '_', $path), '_');
    if ($cacheKey === '') {
        $cacheKey = 'home';
    }
}

$cacheFile = CACHE_DIR . '/index/' . $cacheKey . '.html';

// =======================================
// 1. CACHE CHECK
// =======================================

$seoTime      = file_exists($seoFile)      ? filemtime($seoFile)      : 0;
$manifestTime = file_exists($manifestFile) ? filemtime($manifestFile) : 0;

if (file_exists($cacheFile)) {
    $cacheTime = filemtime($cacheFile);

    // 1.2. If the cache is not outdated, we return and exit.
    if ($cacheTime >= $seoTime && $cacheTime >= $manifestTime) {
        readfile($cacheFile);
        exit;
    }
    // 1.1. Otherwise, we'll go recalculate (go to point 2)
}

// =======================================
// 2. Read SEO and choose the right path
// =======================================

$seoData = json_decode(file_get_contents($seoFile), true) ?? [];

$defaultSeo = $seoData['default'] ?? [];
$pageSeo    = $seoData['pages'][$path] ?? $defaultSeo; // if not, default

$seoField = function (string $key) use ($pageSeo, $defaultSeo) {
    return $pageSeo[$key] ?? $defaultSeo[$key] ?? '';
};

$title       = $seoField('title');
$description = $seoField('description');
$keywords    = $seoField('keywords');
$author      = $seoField('author');

$defaultOg   = $defaultSeo['og'] ?? [];
$pageOg      = $pageSeo['og'] ?? [];
$og          = array_merge($defaultOg, $pageOg);

$defaultTw   = $defaultSeo['twitter'] ?? [];
$pageTw      = $pageSeo['twitter'] ?? [];
$twitter     = array_merge($defaultTw, $pageTw);

// Insurance in case of missing keys
$ogTitle       = $og['title']       ?? $title;
$ogDescription = $og['description'] ?? $description;
$ogType        = $og['type']        ?? 'website';
$ogUrl         = $og['url']         ?? '';
$ogImage       = $og['image']       ?? '';

$twCard        = $twitter['card']        ?? 'summary_large_image';
$twTitle       = $twitter['title']       ?? $title;
$twDescription = $twitter['description'] ?? $description;
$twImage       = $twitter['image']       ?? $ogImage;

// =======================================
// 3. Read the Vite manifest and get links to the bundles
// =======================================

$jsSrc   = '/src/main.tsx'; // fallback на dev
$cssList = [];

if (file_exists($manifestFile)) {
    $manifest = json_decode(file_get_contents($manifestFile), true) ?? [];

    if (isset($manifest['index.html'])) {
        $entry = $manifest['index.html'];

        if (!empty($entry['file'])) {
            // "assets/index-Ch-MZG06.js" -> "/assets/index-Ch-MZG06.js"
            $jsSrc = '/' . ltrim($entry['file'], '/');
        }

        if (!empty($entry['css']) && is_array($entry['css'])) {
            foreach ($entry['css'] as $cssFile) {
                $cssList[] = '/' . ltrim($cssFile, '/');
            }
        }
    }
}

// =======================================
// 4. Generate HTML, save to cache, and output
// =======================================

if (!is_dir(CACHE_DIR)) {
    mkdir(CACHE_DIR, 0777, true);
}

ob_start();
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Dynamic SEO -->
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>" />
    <meta name="keywords" content="<?= htmlspecialchars($keywords, ENT_QUOTES, 'UTF-8') ?>" />
    <meta name="author" content="<?= htmlspecialchars($author, ENT_QUOTES, 'UTF-8') ?>" />

    <!-- Open Graph -->
    <meta property="og:title" content="<?= htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:description" content="<?= htmlspecialchars($ogDescription, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:type" content="<?= htmlspecialchars($ogType, ENT_QUOTES, 'UTF-8') ?>" />
    <?php if ($ogUrl): ?><meta property="og:url" content="<?= htmlspecialchars($ogUrl, ENT_QUOTES, 'UTF-8') ?>" />
<?php endif; ?>
    <?php if ($ogImage): ?><meta property="og:image" content="<?= htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8') ?>" />
<?php endif; ?>

    <!-- Twitter -->
    <meta name="twitter:card" content="<?= htmlspecialchars($twCard, ENT_QUOTES, 'UTF-8') ?>" />
    <meta name="twitter:title" content="<?= htmlspecialchars($twTitle, ENT_QUOTES, 'UTF-8') ?>" />
    <meta name="twitter:description" content="<?= htmlspecialchars($twDescription, ENT_QUOTES, 'UTF-8') ?>" />
    <?php if ($twImage): ?><meta name="twitter:image" content="<?= htmlspecialchars($twImage, ENT_QUOTES, 'UTF-8') ?>" />
<?php endif; ?>

    <!-- Vite CSS bundles -->
    <?php foreach ($cssList as $cssHref): ?>
    <link rel="stylesheet" href="<?= $cssHref ?>" crossorigin />
    <?php endforeach; ?>

    <!-- FAVICONS -->
    <link rel="icon" type="image/png" href="/img/favicon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/img/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/img/favicon/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/img/favicon/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- FONTS / ICONS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>
    <script src="/lib/snowfall/snowfall.js"></script>
    <link rel="stylesheet" href="/lib/snowfall/snowfall.css" />
  </head>

  <body id="index-page">
    <div id="root"></div>

    <!-- Vite entry script -->
    <script type="module" crossorigin src="<?= htmlspecialchars($jsSrc, ENT_QUOTES, 'UTF-8') ?>"></script>
  </body>
</html>
<?php
$html = ob_get_clean();
file_put_contents($cacheFile, $html);
echo $html;
