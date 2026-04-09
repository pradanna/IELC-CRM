<?php

use App\Models\Lead;
use App\Events\WhatsappMessageReceived;

// Simulasi nomor asli WA (yang sering bikin pusing karena format 62)
$incomingPhone = '628975050520'; 

// 1. Logika 'Cerdas' (Sama dengan di Controller)
$clean = preg_replace('/[^0-9]/', '', $incomingPhone);
$searchSuffix = substr($clean, -10);

// Cari lead berdasarkan 10 digit terakhir
$lead = Lead::where('phone', 'like', "%$searchSuffix")->first();

if (!$lead) {
    echo "❌ ERROR: Tetap tidak ketemu! Cek apakah nomor berakhiran $searchSuffix ada di DB.\n";
    $allLeads = Lead::limit(5)->get();
    echo "Contoh 5 nomor di DB:\n";
    foreach($allLeads as $l) echo "- " . $l->phone . "\n";
    return;
}

echo "✅ KEMENANGAN! Lead ditemukan: " . $lead->name . "\n";
echo "Meskipun inputnya $incomingPhone, kita berhasil cocokkan dengan nomor " . $lead->phone . " di database via suffix $searchSuffix.\n";

// 2. Trigger Event
event(new WhatsappMessageReceived($lead, "LOGIKA SUDAH CERDAS! 🔥"));

echo "🚀 Cek dashboard, notifikasi WA harusnya muncul sekarang.\n";
