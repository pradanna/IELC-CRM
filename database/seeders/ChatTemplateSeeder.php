<?php

namespace Database\Seeders;

use App\Models\ChatTemplate;
use App\Models\LeadPhase;
use App\Models\LeadType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ChatTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Global Templates (General Purpose)
        $globalTemplates = [
            [
                'title' => 'Greeting Umum',
                'message' => "Halo {{name}},\n\nSelamat datang di IELC! Ada yang bisa kami bantu hari ini?\n\nSalam,\n{{admin_name}}",
            ],
            [
                'title' => 'Follow-up General',
                'message' => "Halo {{nickname}},\n\nKami mencoba menghubungi Anda kembali terkait rencana belajar Bahasa Inggris di IELC. Apakah ada waktu luang untuk berbicara hari ini?\n\nTerima kasih.",
            ],
        ];

        foreach ($globalTemplates as $tpl) {
            ChatTemplate::updateOrCreate(['title' => $tpl['title']], $tpl);
        }

        // 2. Phase-Specific Templates
        $phaseTemplates = [
            'lead' => [
                'title' => '[Lead] Welcome Message',
                'message' => "Halo {{name}}, selamat datang di IELC!\n\nTerima kasih telah menghubungi kami. Tim kami akan segera membantu Anda memilih program yang paling tepat.\n\nNomor referensi Anda: {{lead_number}}.",
            ],
            'prospect' => [
                'title' => '[Prospect] Info Program',
                'message' => "Halo {{nickname}},\n\nBerikut adalah detail program yang sesuai dengan kebutuhan Anda. Silakan kabari jika ada yang ingin ditanyakan lebih lanjut ya.",
            ],
            'placement-test' => [
                'title' => '[PT] Undangan Placement Test',
                'message' => "Halo {{nickname}},\n\nMari kita mulai dengan langkah pertama! Silakan ikuti Placement Test online kami melalui link berikut:\n\n[LINK_PT]\n\nTes ini akan membantu kami menempatkan Anda di level yang paling sesuai.",
            ],
            'consultation' => [
                'title' => '[Consul] Jadwal Konsultasi',
                'message' => "Halo {{nickname}},\n\nKami ingin mengundang Anda untuk sesi konsultasi gratis dengan konsultan akademik kami pada:\n\nHari/Tgl: [TANGGAL]\nJam: [JAM]\n\nKonfirmasi kehadiran Anda dengan membalas pesan ini ya.",
            ],
            'invoice' => [
                'title' => '[Invoice] Pemberitahuan Tagihan',
                'message' => "Halo {{name}},\n\nTagihan pendaftaran Anda untuk program IELC sudah tersedia. Anda dapat melakukan pembayaran via transfer bank.\n\nDetail tagihan dapat dilihat di lampiran atau sistem kami.",
            ],
            'enrollment' => [
                'title' => '[Closing] Selamat Bergabung',
                'message' => "Halo {{nickname}}, selamat bergabung di keluarga besar IELC!\n\nAnda telah terdaftar secara resmi. Sampai jumpa di kelas pertama Anda!",
            ],
            'cold-leads' => [
                'title' => '[Cold] Penawaran Promo',
                'message' => "Halo {{nickname}}, lama tidak terdengar kabar!\n\nKami sedang ada promo khusus bulan ini untuk alumni dan pendaftar baru. Apakah Anda masih berminat untuk meningkatkan kemampuan Bahasa Inggris bersama kami?",
            ],
        ];

        foreach ($phaseTemplates as $phaseCode => $tpl) {
            $template = ChatTemplate::updateOrCreate(['title' => $tpl['title']], [
                'message' => $tpl['message']
            ]);

            $phase = LeadPhase::where('code', $phaseCode)->first();
            if ($phase) {
                $template->leadPhases()->syncWithoutDetaching([$phase->id]);
            }
        }

        // 3. Type-Specific (Example: IELTS focus)
        $ieltsTemplate = ChatTemplate::updateOrCreate(
            ['title' => '[IELTS] Target Score Consultation'],
            [
                'message' => "Hi {{nickname}},\n\nAre you aiming for a specific IELTS score for work or study abroad? Let's discuss a customized study plan to help you reach your target!\n\nBest regards,\n{{admin_name}}"
            ]
        );

        $ieltsType = LeadType::where('code', 'ielts')->first();
        if ($ieltsType) {
            $ieltsTemplate->leadTypes()->syncWithoutDetaching([$ieltsType->id]);
        }
    }
}
