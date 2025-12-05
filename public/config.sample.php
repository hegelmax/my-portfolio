<?php
// ===== !!! EDIT THESE FILE !!! =====

// ===== DELETE AFTER DONE ! =====
const IS_SAMPE_CONFIG = true;

// ===== SECURITY =====
const CORS_MAIN_DOMAIN		 = 'http://yoursite.com';

// ===== BREVO SETTINGS =====
const BREVO_API_KEY          = "***YOUR_BREVO_API_KEY***";

// ===== BLOG SETTINGS =====
const BLOG_JOOMLA_BASE_URL	 = 'https://your.joomlasite.com/'; // Joomla domain URL (where we get the original images)
const BLOG_CAT_ID			 = -1; // Filter by blog category
const BLOG_CACHE_FILE		 = CACHE_DIR . '/blog_cache.json'; // Path to the article cache file
const BLOG_IMG_CACHE_DIR	 = CACHE_DIR . '/blog_images'; // Image cache folder (must exist and be writable)
const BLOG_IMG_TARGET_WIDTH  = 870; // Image size
const BLOG_IMG_TARGET_HEIGHT = 491; // Image size

// ===== ADMIN PAGE =====
const MAX_PHOTO_SIZE_PX = 1800; // auto-resize for import (for example, maximum 2000px on the long side)
