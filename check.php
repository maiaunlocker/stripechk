<?php
// check.php - RETORNA LOG JUNTO COM RESULTADO
error_reporting(0);
header('Content-Type: application/json; charset=utf-8');

// POLLING
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['hash'])) {
    $hash = basename($_GET['hash']);
    $resultFile = __DIR__ . '/results/' . $hash . '.json';
    $logFile = __DIR__ . '/results/' . $hash . '_log.txt';
    
    if (file_exists($resultFile)) {
        $result = json_decode(file_get_contents($resultFile), true);
        
        // Adicionar log se existir
        if (file_exists($logFile)) {
            $result['log'] = file_get_contents($logFile);
            unlink($logFile);
        }
        
        echo json_encode($result);
        unlink($resultFile);
    } else {
        echo json_encode(['status' => 'WAIT']);
    }
    exit;
}

// ENVIAR CARTÃO
$card = $_POST['card'] ?? '';
if (!$card || !strpos($card, '|')) {
    echo json_encode(['status' => 'RECUSADA', 'message' => 'Cartão inválido']);
    exit;
}

$hash = md5($card . time() . rand());
if (!is_dir(__DIR__ . '/results')) mkdir(__DIR__ . '/results', 0777, true);
$resultFile = __DIR__ . '/results/' . $hash . '.json';

$node = "node";
$script = __DIR__ . "/checker.js";
$cardEsc = escapeshellarg($card);
$resultEsc = escapeshellarg($resultFile);

if (PHP_OS_FAMILY === 'Windows') {
    pclose(popen("start /B $node \"$script\" $cardEsc $resultEsc > NUL 2>&1", "r"));
} else {
    exec("$node \"$script\" $cardEsc $resultEsc > /dev/null 2>&1 &");
}

echo json_encode(['status' => 'WAIT', 'hash' => $hash, 'message' => 'Processando...']);