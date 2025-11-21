<?php
require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=utf-8');

// ===== SETTINGS =====

const SEND_TO_EMAIL = "nadia@hegel.uk"; // куда отправлять письма
const SEND_TO_NAME  = "Paley Website Admin";

const FROM_EMAIL   = "no-reply@hegel.uk"; // должен принадлежать домену
const FROM_NAME    = "Contact Form";

try {
	include_once(__DIR__ . '/../../config.php');
	
	if (!defined('BREVO_API_KEY')) {
		http_response_code(405);
		echo json_encode(['success' => false, 'error' => 'API key is not set']);
		exit;
	}
	
	// Allow only POST
	if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
		http_response_code(405);
		echo json_encode(['success' => false, 'error' => 'Method not allowed']);
		exit;
	}

	// Читаем сырой JSON
	$raw = file_get_contents('php://input');
	$data = json_decode($raw, true);
	
	// Read form fields
	$name       = trim($data['name'] ?? '');
	$email      = trim($data['email'] ?? '');
	$location   = trim($data['location'] ?? '');
	$project    = trim($data['projectType'] ?? '');
	$message    = trim($data['message'] ?? '');
	$newsletter = !empty($data['newsletter']) ? 'yes' : 'no';
	
	// Простая валидация
	if ($name === '' || $email === '' || $message === '') {
		http_response_code(400);
		echo json_encode(['success' => false, 'errors' => 'Missing required fields']);
		exit;
	}
	
	if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
		http_response_code(400);
		echo json_encode(['success' => false, 'errors' => 'Invalid email']);
		exit;
	}
	
	// Build the payload for Brevo
	$payload = array(
		'sender' => [
			'email' => FROM_EMAIL,
			'name'  => FROM_NAME
		],
		'to' => [
			[
				'email' => SEND_TO_EMAIL,
				'name'  => SEND_TO_NAME
			]
		],
		'replyTo' => [
			'email' => $email,   // клиентский email
			'name'  => $name
		],
		'subject' => "New message from contact form",
		'htmlContent' => 
			 "<h3>New message from your website</h3>"
			."<p><strong>Name:</strong> "		.htmlspecialchars($name)			."</p>"
			."<p><strong>Email:</strong> "		.htmlspecialchars($email)			."</p>"
			."<p><strong>Location:</strong> "	.htmlspecialchars($location)		."</p>"
			."<p><strong>Project:</strong> "	.htmlspecialchars($project)			."</p>"
			."<p><strong>Newsletter:</strong> "	.htmlspecialchars($newsletter)		."</p>"
			."<p><strong>Message:</strong><br>"	.nl2br(htmlspecialchars($message))	."</p>"
	);
	
	// Send request to Brevo
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "https://api.brevo.com/v3/smtp/email");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, [
		"Content-Type: application/json",
		"accept: application/json",
		"api-key:".BREVO_API_KEY
	]);
	curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

	$response = curl_exec($ch);
	$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);

	// Check response
	if ($httpCode >= 200 && $httpCode < 300) {
		echo json_encode(['success' => true, 'message' => "Message sent successfully"]);
	} else {
		http_response_code(500);
		echo json_encode([
			'success' => false,
			'error' => 'Brevo API error',
			'debug' => $response
		]);
	}
} catch(Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Server error',
        'debug' => $e->getMessage(), // включить только на dev
    ], JSON_UNESCAPED_UNICODE);
}
