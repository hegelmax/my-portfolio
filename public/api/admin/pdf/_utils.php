<?php

function pdf_ensure_base_dirs(): void {
    foreach ([DATA_DIR, PDF_BASE_DIR, PDF_PAGES_DIR, PDF_HTML_DIR] as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
    }
}

function pdf_sanitize_slug(string $slug): string {
    $slug = trim($slug);
    $slug = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $slug);
    $slug = preg_replace('/-+/', '-', $slug);
    return trim(strtolower($slug), '-_');
}

function pdf_pages_dir(string $slug): string {
    return PDF_PAGES_DIR . '/' . $slug;
}

function pdf_pages_url(string $slug): string {
    return '/pdf/pages/' . $slug . '/';
}

function pdf_page_file(string $slug, int $pageNumber): string {
    return pdf_pages_dir($slug) . '/page-' . $pageNumber . '.png';
}

function pdf_page_url(string $slug, int $pageNumber): string {
    return pdf_pages_url($slug) . 'page-' . $pageNumber . '.png';
}

function pdf_html_file(string $slug): string {
    return PDF_HTML_DIR . '/' . $slug . '.html';
}

function pdf_html_url(string $slug): string {
    return '/pdf/html/' . $slug . '.html';
}

function pdf_works_file(): string {
    pdf_ensure_base_dirs();
    return PDF_WORKS_JSON;
}

function pdf_read_works(): array {
    $file = pdf_works_file();
    if (!is_file($file)) {
        return ['works' => []];
    }

    $json = file_get_contents($file);
    $data = json_decode($json, true);

    if (is_array($data) && isset($data['works']) && is_array($data['works'])) {
        return ['works' => $data['works']];
    }

    if (is_array($data) && array_keys($data) === range(0, count($data) - 1)) {
        return ['works' => $data];
    }

    return ['works' => []];
}

function pdf_write_works(array $works): bool {
    $file = pdf_works_file();
    $payload = [
        'works' => array_values($works),
    ];

    return file_put_contents(
        $file,
        json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    ) !== false;
}
