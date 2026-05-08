<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true) ?? [];
$configFile = __DIR__ . '/db_config.php';

if ($action === 'check_setup') {
    echo json_encode(['setup' => file_exists($configFile)]);
    exit;
}

if ($action === 'setup') {
    $db_host = $data['db_host'] ?? 'localhost';
    $db_name = $data['db_name'] ?? '';
    $db_user = $data['db_user'] ?? '';
    $db_pass = $data['db_pass'] ?? '';
    $admin_email = strtolower($data['admin_email'] ?? 'highprofiled@gmail.com');
    $admin_pass = password_hash($data['admin_pass'] ?? '', PASSWORD_DEFAULT);
    
    try {
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        $configContent = "<?php\n\$DB_HOST = " . var_export($db_host, true) . ";\n\$DB_NAME = " . var_export($db_name, true) . ";\n\$DB_USER = " . var_export($db_user, true) . ";\n\$DB_PASS = " . var_export($db_pass, true) . ";\n";
        file_put_contents($configFile, $configContent);
        
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            email VARCHAR(255) PRIMARY KEY,
            password VARCHAR(255),
            role VARCHAR(50),
            token VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
        
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(255) PRIMARY KEY,
            setting_value TEXT
        )");
        
        $stmt = $pdo->prepare("INSERT IGNORE INTO users (email, password, role) VALUES (?, ?, 'superadmin')");
        $stmt->execute([$admin_email, $admin_pass]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

if (!file_exists($configFile)) {
    echo json_encode(['error' => 'Not installed']);
    exit;
}

require $configFile;
try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Database connection failed. Please check db_config.php on your server.']);
    exit;
}

function get_auth_header() {
    if (isset($_SERVER['Authorization'])) return trim($_SERVER["Authorization"]);
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) return trim($_SERVER["HTTP_AUTHORIZATION"]);
    return null;
}

$user = null;
$auth_header = get_auth_header();
if ($auth_header && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
    $token = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM users WHERE token = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
}

if ($action === 'login') {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row && password_verify($password, $row['password'])) {
        $token = bin2hex(random_bytes(32));
        $pdo->prepare("UPDATE users SET token = ? WHERE email = ?")->execute([$token, $email]);
        echo json_encode(['success' => true, 'token' => $token, 'user' => ['email' => $email, 'role' => $row['role']]]);
    } else {
        echo json_encode(['error' => 'Invalid credentials']);
    }
    exit;
}

if ($action === 'magic_link') {
    $email = $data['email'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        $token = bin2hex(random_bytes(32));
        $pdo->prepare("UPDATE users SET token = ? WHERE email = ?")->execute([$token, $email]);
        $link = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]/?magic_token=$token";
        
        $subject = "Your Magic Login Link";
        $message = "Please click the following link to log in and set up your password:\n\n$link\n\nIf you did not request this, please ignore this email.";
        $headers = "From: noreply@" . $_SERVER['HTTP_HOST'];
        
        mail($email, $subject, $message, $headers);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'User not found. A superadmin must invite you first.']);
    }
    exit;
}

if ($action === 'login_with_token') {
    $token = $data['token'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM users WHERE token = ?");
    $stmt->execute([$token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo json_encode(['success' => true, 'token' => $token, 'user' => ['email' => $row['email'], 'role' => $row['role']]]);
    } else {
        echo json_encode(['error' => 'Invalid or expired magic link']);
    }
    exit;
}

if ($action === 'get_me') {
    if ($user) {
        echo json_encode(['user' => ['email' => $user['email'], 'role' => $user['role']]]);
    } else {
        echo json_encode(['error' => 'Unauthorized']);
    }
    exit;
}

if ($action === 'set_password') {
    if (!$user) { echo json_encode(['error' => 'Unauthorized']); exit; }
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = ? WHERE email = ?")->execute([$password, $user['email']]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'get_settings') {
    $stmt = $pdo->query("SELECT * FROM settings");
    $settings = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
    }
    echo json_encode(['settings' => $settings]);
    exit;
}

if ($action === 'save_settings') {
    if (!$user || $user['role'] !== 'superadmin') { echo json_encode(['error' => 'Unauthorized']); exit; }
    $key = $data['key'];
    $value = json_encode($data['value']);
    $stmt = $pdo->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)");
    $stmt->execute([$key, $value]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'get_users') {
    if (!$user) { echo json_encode(['error' => 'Unauthorized']); exit; }
    $stmt = $pdo->query("SELECT email, role, created_at FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['users' => $users]);
    exit;
}

if ($action === 'add_user') {
    if (!$user) { echo json_encode(['error' => 'Unauthorized']); exit; }
    $email = strtolower($data['email']);
    $user_pass = password_hash($data['password'] ?? '', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT IGNORE INTO users (email, password, role) VALUES (?, ?, 'member')");
    $stmt->execute([$email, $user_pass]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_user') {
    if (!$user || $user['role'] !== 'superadmin') { echo json_encode(['error' => 'Unauthorized']); exit; }
    $email = strtolower($data['email']);
    if ($email === 'highprofiled@gmail.com') { echo json_encode(['error' => 'Cannot delete superadmin']); exit; }
    $stmt = $pdo->prepare("DELETE FROM users WHERE email = ?");
    $stmt->execute([$email]);
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Invalid action']);
