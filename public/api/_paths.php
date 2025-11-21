<?php

define('ROOT_DIR',realpath(__DIR__ . '/..'));
const API_DIR	= ROOT_DIR.'/api';
const DATA_DIR	= ROOT_DIR.'/data';
const IMG_DIR	= ROOT_DIR.'/images';

// JSON с данными сайта
const PROJECTS_FILE            = DATA_DIR.'/projects.json';
const PORTFOLIO_ITEMS_JSON     = DATA_DIR.'/portfolio-items.json';
const PUBLICATIONS_ITEMS_JSON  = DATA_DIR.'/publications-items.json';

// Конфиг администратора
define('ADMIN_CONFIG_FILE',realpath(ROOT_DIR . '/..').'/admin-config.json');