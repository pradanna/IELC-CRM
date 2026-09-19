<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            [
                'name'           => 'Cash / Tunai',
                'type'           => 'cash',
                'account_number' => null,
                'account_holder' => 'Kasir / Frontdesk',
                'notes'          => 'Penerimaan pembayaran tunai di frontdesk cabang',
                'is_active'      => true,
            ],
            [
                'name'           => 'Bank BCA',
                'type'           => 'bank',
                'account_number' => '7850 418 211',
                'account_holder' => 'PT. Lingua Munda',
                'notes'          => 'Rekening utama transfer BCA',
                'is_active'      => true,
            ],
            [
                'name'           => 'Bank Mandiri',
                'type'           => 'bank',
                'account_number' => '138-000-011-2214',
                'account_holder' => 'PT. Lingua Munda',
                'notes'          => 'Rekening transfer Bank Mandiri',
                'is_active'      => true,
            ],
            [
                'name'           => 'Bank BNI',
                'type'           => 'bank',
                'account_number' => '027 5277 683',
                'account_holder' => 'PT. Lingua Munda',
                'notes'          => 'Rekening transfer Bank BNI',
                'is_active'      => true,
            ],
            [
                'name'           => 'Bank BRI',
                'type'           => 'bank',
                'account_number' => '001201001234509',
                'account_holder' => 'IELC Official',
                'notes'          => 'Rekening transfer Bank BRI',
                'is_active'      => true,
            ],
            [
                'name'           => 'QRIS',
                'type'           => 'qris',
                'account_number' => 'NMID123456789',
                'account_holder' => 'IELC QRIS',
                'notes'          => 'Pembayaran digital via barcode QRIS',
                'is_active'      => true,
            ],
            [
                'name'           => 'Mesin EDC / Kartu',
                'type'           => 'edc',
                'account_number' => null,
                'account_holder' => 'EDC Terminal',
                'notes'          => 'Gesek kartu debit/kredit melalui mesin EDC di cabang',
                'is_active'      => true,
            ],
        ];

        foreach ($accounts as $acc) {
            $exists = DB::table('payment_accounts')->where('name', $acc['name'])->exists();
            if (!$exists) {
                DB::table('payment_accounts')->insert([
                    'id'             => (string) Str::uuid(),
                    'name'           => $acc['name'],
                    'type'           => $acc['type'],
                    'account_number' => $acc['account_number'],
                    'account_holder' => $acc['account_holder'],
                    'branch_id'      => null, // Global for all branches
                    'is_active'      => $acc['is_active'],
                    'notes'          => $acc['notes'],
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }
        }
    }
}
