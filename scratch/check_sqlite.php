<?php
$paths = [
    'C:/PROJECT/WEBSITE/wa-baileys/sessions/solo/database.sqlite',
    'C:/PROJECT/WEBSITE/wa-baileys/sessions/semarang/database.sqlite',
    'C:/PROJECT/WEBSITE/wa-baileys/sessions/smg/database.sqlite',
];

foreach ($paths as $path) {
    if (file_exists($path)) {
        echo "Found: $path\n";
        $pdo = new PDO("sqlite:" . $path);
        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
        echo "Tables: " . implode(', ', $tables) . "\n";
        
        if (in_array('messages', $tables)) {
            $cols = $pdo->query("PRAGMA table_info(messages)")->fetchAll(PDO::FETCH_ASSOC);
            echo "Columns in messages:\n";
            foreach ($cols as $c) {
                echo "  - {$c['name']} ({$c['type']})\n";
            }
            
            $sample = $pdo->query("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
            echo "Sample messages count: " . count($sample) . "\n";
            print_r($sample);
        }
    }
}
