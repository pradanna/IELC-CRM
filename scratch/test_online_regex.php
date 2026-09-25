<?php
$names = [
    'Jovie & Co (Offline)',
    'Caril & Co (Online)',
    'IELTS ON',
    'IELTS OFF',
    'PRIV ON',
    'PRIV OFF',
    'Group On',
    'Group Off',
    'Ind - Karen Brilliant (PR 30 Sessions - Online)'
];

foreach ($names as $n) {
    $lower = strtolower($n);
    $isOnline = (str_contains($lower, 'online') || preg_match('/\b(on)\b/i', $n)) && !str_contains($lower, 'off');
    echo sprintf("%-50s => %s\n", $n, $isOnline ? 'ONLINE' : 'OFFLINE');
}
