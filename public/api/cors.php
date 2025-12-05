<?php

// Allow only the required domain, not *
$allowedOrigins = [
     'http://localhost:5173'
    ,'http://localhost:3000'
    ,'http://127.0.0.1:5173'
    , CORS_MAIN_DOMAIN
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin"); // so that the cache doesn't interfere
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
