<?php
const ENV_SECURED_DEFAULTS				= [
		['key' => 'BREVO_API_KEY','value' => '***YOUR_BREVO_API_KEY***']
	];

include_once ROOT_DIR . '/../env.php';

// ===== SECURITY =====
const CORS_MAIN_DOMAIN		 = 'http://paley.art';

// ===== BLOG SETTINGS =====
const BLOG_JOOMLA_BASE_URL	 = 'https://renew.style/'; // Joomla domain URL (where we get the original images)
const BLOG_CAT_ID			 = 20; // Filter by blog category
const BLOG_CACHE_FILE		 = ROOT_DIR . '/cache/blog_cache.json'; // Path to the article cache file
const BLOG_IMG_CACHE_DIR	 = ROOT_DIR . '/cache/blog_images'; // Image cache folder (must exist and be writable)
const BLOG_IMG_TARGET_WIDTH  = 870; // Image size
const BLOG_IMG_TARGET_HEIGHT = 491; // Image size

// ===== ADMIN PAGE =====
const MAX_PHOTO_SIZE_PX = 1800; // auto-resize for import (for example, maximum 2000px on the long side)
