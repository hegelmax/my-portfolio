<?php

$configFile			= ROOT_DIR . '/config.php';
$sampleConfigFile	= ROOT_DIR . '/config.sample.php';

// Check if config.php does not exist
if (!file_exists($configFile)) {
    // Check if config.sample.php exists to copy from
    if (file_exists($sampleConfigFile)) {
        // Copy config.sample.php to config.php
        if (copy($sampleConfigFile, $configFile)) {
            http_response_code(500);
            echo "config.php created successfully from config.sample.php.\n";
			exit;
        } else {
            http_response_code(500);
            echo "Error: Failed to copy config.sample.php to config.php.\n";
			exit;
        }
    } else {
        http_response_code(500);
        echo "Error: config.sample.php not found. Cannot create config.php.\n";
		exit;
    }
} elseif (defined('IS_SAMPE_CONFIG')) {
    http_response_code(500);
    echo "config.php was created successfully but not configured\n";
    exit;
} else {
    include_once $configFile;
}
