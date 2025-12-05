<?php

define('ROOT_DIR', realpath(__DIR__ . '/..'));
const API_DIR       = ROOT_DIR . '/api';
const DATA_DIR      = ROOT_DIR . '/data';
const CACHE_DIR     = ROOT_DIR . '/cache';
const LIB_DIR       = ROOT_DIR . '/lib';
const IMG_DIR       = ROOT_DIR . '/images';
const PDF_BASE_DIR  = ROOT_DIR . '/pdf';
const PDF_PAGES_DIR = PDF_BASE_DIR . '/pages';
const PDF_HTML_DIR  = PDF_BASE_DIR . '/html';

const PROJECTS_FILE           = DATA_DIR . '/projects.json';
const PORTFOLIO_ITEMS_JSON    = DATA_DIR . '/portfolio-items.json';
const PUBLICATIONS_ITEMS_JSON = DATA_DIR . '/publications-items.json';
const PDF_WORKS_JSON          = DATA_DIR . '/pdf-works.json';

define('ADMIN_CONFIG_FILE', realpath(ROOT_DIR . '/..') . '/admin-config.json');
