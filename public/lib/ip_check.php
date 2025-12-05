<?php

$blockedIpFile  = DATA_DIR . '/blocked_ips.txt';

// Current IP
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

// (optional) whitelist to avoid getting banned
$whitelistIps = [
	// '127.0.0.1',
	// 'x.x.x.x',
];

// =======================================
// A. CHECK: Is the IP already blocked?
// =======================================

if (!in_array($clientIp, $whitelistIps, true) && file_exists($blockedIpFile)) {
	$blockedIps = file($blockedIpFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
	if ($blockedIps && in_array($clientIp, $blockedIps, true)) {
		header('HTTP/1.1 403 Forbidden');
		header('Content-Type: text/plain; charset=utf-8');
		echo 'Forbidden';
		exit;
	}
}

// =======================================
// B. Path Normalization
// =======================================

$rawPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($rawPath === '' || $rawPath === false) {
	$path = '/';
} else {
	$path = rtrim($rawPath, '/');
	if ($path === '') {
		$path = '/';
	}
}

// =======================================
// C. DETECT SUSPICIOUS PATHWAYS → IP BAN
// =======================================

// List of patterns by which we consider a request to be an attempt at scanning/hacking
$suspiciousPatterns = [
	'#(^|/)\.env(\.|\?|$)#i',
	'#(^|/)wp-admin(\W|$)#i',
	'#wordpress_wp-admin_setup-config\.php#i',
	'#wp-admin_setup-config\.php#i',
	'#setup-config\.php#i',
	'#wp-login\.php#i',
	'#(^|/)phpmyadmin(\W|$)#i',
	'#(^|/)vendor/composer/installed\.json#i',
];

$isSuspicious = false;
foreach ($suspiciousPatterns as $re) {
	if (preg_match($re, $path)) {
		$isSuspicious = true;
		break;
	}
}

if ($isSuspicious && !in_array($clientIp, $whitelistIps, true)) {
	// add the IP to the blacklist (if not yet)
	$append = true;
	if (file_exists($blockedIpFile)) {
		$blockedIps = file($blockedIpFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
		if (in_array($clientIp, $blockedIps, true)) {
			$append = false;
		}
	}

	if ($append) {
		if (!is_dir(dirname($blockedIpFile))) {
			mkdir(dirname($blockedIpFile), 0777, true);
		}
		file_put_contents($blockedIpFile, $clientIp . PHP_EOL, FILE_APPEND);
	}

	header('HTTP/1.1 403 Forbidden');
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Forbidden';
	exit;
}
