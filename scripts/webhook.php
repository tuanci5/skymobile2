<?php
/**
 * GitHub Webhook Handler for aaPanel Auto-Deployment
 */

// 1. Cấu hình bảo mật
// Bạn nên thay 'skymobile_secret_123' bằng một chuỗi ký tự khó đoán
// Và điền chuỗi này vào mục "Secret" khi tạo Webhook trên GitHub.
$secret = 'skymobile_secret_123'; 

// 2. Kiểm tra chữ ký từ GitHub (Bảo mật)
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');

if (empty($signature)) {
    http_response_code(403);
    die("Error: No signature provided.");
}

$hash = "sha1=" . hash_hmac('sha1', $payload, $secret);

if (!hash_equals($hash, $signature)) {
    http_response_code(403);
    die("Error: Invalid signature.");
}

// 3. Thực thi script deploy
// Chúng ta chạy nó trong background và ghi log lại
echo "Deployment triggered successfully!";

$cmd = "bash /www/wwwroot/skymobile/scripts/auto-deploy.sh >> /www/wwwroot/skymobile/scripts/deploy.log 2>&1 &";
shell_exec($cmd);
