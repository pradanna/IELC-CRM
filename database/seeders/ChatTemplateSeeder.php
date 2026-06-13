<?php

namespace Database\Seeders;

use App\Domains\Master\Domain\Models\ChatTemplate;
use App\Domains\Master\Domain\Models\LeadPhase;
use Illuminate\Database\Seeder;

class ChatTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing templates to keep DB synchronized
        ChatTemplate::query()->delete();

        // 2. Phase-Specific Templates
        $phaseTemplates = [
            'lead' => [
                [
                    'title' => '[Lead] WA Template Greeting',
                    'message' => "Terima kasih telah menghubungi IELC 😊\n\nSaya {{admin_name}}, IELC Course Consultant dan saya akan membantu mencarikan kelas yang tepat sesuai kebutuhan Anda. Apakah boleh tanya saya bicara dengan siapa? 😊 🙏",
                ],
                [
                    'title' => '[Lead] WA Template Location',
                    'message' => "Halo {{name}}\n\nBoleh tahu {{name}} dari kota mana? 😊 🙏",
                ],
            ],
            'prospect' => [
                [
                    'title' => '[Prospect] Kids Send Product Info',
                    'message' => "Terima kasih atas infonya 🙏\n\nUntuk anak, kami ada kelas group maupun kelas private. Keduanya bisa diambil secara Online atau On Campus. 😊\n\nSilahkan klik link berikut ini untuk melihat rincian harga untuk kelas anak kami 😊\nhttps://ielc.co.id/IELC-Kids-Course.pdf",
                ],
                [
                    'title' => '[Prospect] Teens Send Product Info',
                    'message' => "Terima kasih atas infonya 🙏\n\nUntuk remaja, kami ada kelas group maupun kelas private. Keduanya bisa diambil secara Online atau On Campus. 😊\n\nSilahkan klik link berikut ini untuk melihat rincian harga untuk kelas remaja kami 😊\nhttps://ielc.co.id/IELC-Teens-Course.pdf",
                ],
                [
                    'title' => '[Prospect] Adults Send Product Info',
                    'message' => "Terima kasih atas infonya 🙏\n\nUntuk dewasa, kami ada kelas group maupun kelas private. Keduanya bisa diambil secara Online atau On Campus. 😊\n\nSilahkan klik link berikut ini untuk melihat rincian harga untuk kelas kami 😊\nhttps://ielc.co.id/IELC-Adults-Course.pdf",
                ],
                [
                    'title' => '[Prospect] IELTS Send Product Info',
                    'message' => "IELC menyediakan kelas persiapan IELTS secara Online dan On Campus. Kelas IELTS kami adalah kelas private agar siswa mendapat pengalaman belajar yang paling optimal untuk mencapai target IELTS dalam waktu yang sesingkat mungkin 😊\n\nSilahkan klik link berikut untuk melihat rincian harga dan PROMO HEBAT kami khusus bulan ini 😊\nhttps://ielc.co.id/IELC-IELTS-Course.pdf",
                ],
                [
                    'title' => '[Prospect] TOEFL PBT Send Product Info',
                    'message' => "Terima kasih sudah menghubungi IELC 😊\n\nIELC menyediakan kursus persiapan TOEFL secara Online dan On Campus. Kursus TOEFL kami adalah kelas private agar siswa mendapat pengalaman belajar yang paling optimal untuk mencapai target TOEFL dalam waktu yang sesingkat mungkin 😊\n\nSilahkan klik link berikut untuk melihat rincian harga dan PROMO HEBAT kami khusus bulan ini 😊\nhttps://ielc.co.id/IELC-TOEFL-Course.pdf",
                ],
                [
                    'title' => '[Prospect] TOEFL iBT Send Product Info',
                    'message' => "Terima kasih sudah menghubungi IELC 😊\n\nIELC menyediakan kelas persiapan TOEFL iBT secara Online dan On Campus. Kelas TOEFL iBT kami adalah kelas private agar siswa mendapat pengalaman belajar yang paling optimal untuk mencapai target TOEFL iBT dalam waktu yang sesingkat mungkin 😊\n\nSilahkan klik link berikut untuk melihat rincian harga dan PROMO HEBAT kami khusus bulan ini 😊\nhttps://ielc.co.id/IELC-TOEFL-iBT-Course.pdf",
                ],
            ],
            'consultation' => [
                [
                    'title' => '[Consultation] Kids Send Consultation Schedule Link',
                    'message' => "Baik, terima kasih 🙏\nBerikut saya kirimkan link zoom untuk Free Consultation pada [JADWAL] 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[Consultation] Kids Send Product Brochure',
                    'message' => "Berikut saya kirimkan brosur dengan informasi lebih lanjut tentang kursus kids kami\nhttps://ielc.co.id/IELC-Kids-Brochure.pdf\n\nApakah mau saya jadwalkan untuk FREE Placement Test? 😊 🙏",
                ],
                [
                    'title' => '[Consultation] Teens Send Consultation Schedule Link',
                    'message' => "Baik, terima kasih 🙏\nBerikut saya kirimkan link zoom untuk Free Consultation pada [JADWAL] 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[Consultation] Teens Send Product Brochure',
                    'message' => "Berikut saya kirimkan brosur dengan informasi lebih lanjut tentang kursus teens kami\nhttps://ielc.co.id/IELC-Teens-Brochure.pdf\n\nApakah mau saya jadwalkan untuk FREE Placement Test? 😊 🙏",
                ],
                [
                    'title' => '[Consultation] Adults Send Consultation Schedule Link',
                    'message' => "Baik, terima kasih 🙏\nBerikut saya kirimkan link zoom untuk Free Consultation pada [JADWAL] 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[Consultation] Adults Send Product Brochure',
                    'message' => "Berikut saya kirimkan brosur dengan informasi lebih lanjut tentang kursus adults kami\nhttps://ielc.co.id/IELC-Adults-Brochure.pdf\n\nApakah mau saya jadwalkan untuk FREE Placement Test? 😊 🙏",
                ],
                [
                    'title' => '[Consultation] IELTS Send Consultation Schedule Link',
                    'message' => "Baik, terima kasih 🙏\nBerikut saya kirimkan link zoom untuk Free Consultation pada [JADWAL] 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[Consultation] IELTS Send Product Brochure',
                    'message' => "Terima kasih telah berminat dengan program IELTS di IELC 🙏 Apabila ada pertanyaan jangan ragu untuk menghubungi saya 😊 Silahkan klik link di bawah untuk mendapat brosur mengenai kursus persiapan IELTS di IELC 😊\n\nhttps://ielc.co.id/IELC-IELTS-Brochure.pdf",
                ],
                [
                    'title' => '[Consultation] TOEFL PBT Send Consultation Schedule Link',
                    'message' => "Baik, terima kasih 🙏\nBerikut saya kirimkan link zoom untuk Free Consultation pada [JADWAL] 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[Consultation] TOEFL PBT Send Product Brochure',
                    'message' => "Terima kasih telah berminat dengan program TOEFL di IELC 🙏 Apabila ada pertanyaan jangan ragu untuk menghubungi saya 😊 Silahkan klik link di bawah untuk mendapat brosur mengenai kursus persiapan TOEFL di IELC 😊\n\nhttps://ielc.co.id/IELC-TOEFL-Brochure.pdf",
                ],
                [
                    'title' => '[Consultation] TOEFL iBT Send Consultation Schedule Link',
                    'message' => "Baik, terima kasih 🙏\nBerikut saya kirimkan link zoom untuk Free Consultation pada [JADWAL] 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[Consultation] TOEFL iBT Send Product Brochure',
                    'message' => "Terima kasih telah berminat dengan program TOEFL iBT di IELC 🙏 Apabila ada pertanyaan jangan ragu untuk menghubungi saya 😊 Silahkan klik link di bawah untuk mendapat brosur mengenai kursus persiapan TOEFL iBT di IELC 😊\n\nhttps://ielc.co.id/IELC-TOEFL-iBT-Brochure.pdf",
                ],
            ],
            'placement-test' => [
                [
                    'title' => '[PT] Kids Send Customer Data Form',
                    'message' => "Sebelum Placement Test, boleh saya minta bantuan {{name}} untuk mengisi data pada form berikut:\n\n[LINK_ZOHO]",
                ],
                [
                    'title' => '[PT] Kids Send Zoom and PT Link',
                    'message' => "Terima kasih telah mengisi data 🙏\n\nBerikut saya kirimkan Zoom link agar saya bisa menjelaskan cara Placement Test sebelum mengerjakan soalnya. Kira-kira kapan ada waktu untuk bertemu dengan saya via Zoom?\n\nTerimakasih 😊 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[PT] Kids Group Send Course Offer',
                    'message' => "Terima kasih telah menunggu hasil Placement Test {{name}} 🙏\n\nBerdasarkan hasil Placement Test, kami ada group yang sangat cocok untuk {{name}} di [LEVEL]. Kami yakin {{name}} pasti akan nyaman di group ini.\n\nJadwal group tersebut adalah setiap [JADWAL].\n\nSilahkan klik link berikut untuk mendapat informasi tentang level di IELC 😊 🙏\nhttps://ielc.co.id/IELC-Levels.pdf",
                ],
                [
                    'title' => '[PT] Kids Private Send Course Offer',
                    'message' => "Terima kasih telah menunggu hasil Placement Test {{name}} 🙏\n\nBerdasarkan hasil Placement Test, kami ada course yang tepat sekali untuk {{name}} di [LEVEL].\nSilahkan klik link berikut untuk brosur dan informasi tentang level di IELC 🙏\nhttps://ielc.co.id/IELC-Levels.pdf\n\nUntuk kelas private, siswa bisa mengatur jadwal sendiri antara hari Senin-Jumat pukul 10.00-20.00 dan Sabtu pukul 10.00-17.00.\n\nKira kira {{name}} ingin booking jadwal les hari apa dan jam berapa? 😊 🙏",
                ],
                [
                    'title' => '[PT] Teens Send Customer Data Form',
                    'message' => "Sebelum Placement Test, boleh saya minta bantuan {{name}} untuk mengisi data pada form berikut:\n\n[LINK_ZOHO]",
                ],
                [
                    'title' => '[PT] Teens Send Zoom and PT Link',
                    'message' => "Terima kasih telah mengisi data 🙏\n\nBerikut saya kirimkan Zoom link agar saya bisa menjelaskan cara Placement Test sebelum mengerjakan soalnya. Kira-kira kapan ada waktu untuk bertemu dengan saya via Zoom?\n\nTerimakasih 😊 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[PT] Teens Group Send Course Offer',
                    'message' => "Terima kasih telah menunggu hasil Placement Test {{name}} 🙏\n\nBerdasarkan hasil Placement Test, kami ada group yang sangat cocok untuk {{name}} di [LEVEL]. Kami yakin {{name}} pasti akan nyaman di group ini.\n\nJadwal group tersebut adalah setiap [JADWAL].\n\nSilahkan klik link berikut untuk mendapat informasi tentang level di IELC 😊 🙏\nhttps://ielc.co.id/IELC-Levels.pdf",
                ],
                [
                    'title' => '[PT] Teens Private Send Course Offer',
                    'message' => "Terima kasih telah menunggu hasil Placement Test {{name}} 🙏\n\nBerdasarkan hasil Placement Test, kami ada course yang tepat sekali untuk {{name}} di [LEVEL]. Silahkan klik link berikut untuk brosur dan informasi tentang level di IELC 🙏\nhttps://ielc.co.id/IELC-Levels.pdf\n\nUntuk kelas private, siswa bisa mengatur jadwal sendiri antara hari Senin-Jumat pukul 10.00-20.00 dan Sabtu pukul 10.00-17.00.\n\nKira kira {{name}} ingin booking jadwal les hari apa dan jam berapa? 😊 🙏",
                ],
                [
                    'title' => '[PT] Adult Send Customer Data Form',
                    'message' => "Sebelum Placement Test, boleh saya minta bantuan {{name}} untuk mengisi data pada form berikut:\n\n[LINK_ZOHO]",
                ],
                [
                    'title' => '[PT] Adult Send Zoom and PT Link',
                    'message' => "Terima kasih telah mengisi data 🙏\n\nBerikut saya kirimkan Zoom link agar saya bisa menjelaskan cara Placement Test sebelum mengerjakan soalnya. Kira-kira kapan ada waktu untuk bertemu dengan saya via Zoom?\n\nTerimakasih 😊 🙏\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[PT] Adult Group Send Course Offer',
                    'message' => "Terima kasih telah menunggu hasil Placement Test {{name}} 🙏\n\nBerdasarkan hasil Placement Test, kami ada group yang sangat cocok untuk {{name}} di [LEVEL]. Kami yakin {{name}} pasti akan nyaman di group ini.\n\nJadwal group tersebut adalah setiap [JADWAL].\n\nSilahkan klik link berikut untuk mendapat informasi tentang level di IELC 😊 🙏\nhttps://ielc.co.id/IELC-Levels.pdf",
                ],
                [
                    'title' => '[PT] Adult Private Send Course Offer',
                    'message' => "Terima kasih telah menunggu hasil Placement Test {{name}} 🙏\n\nBerdasarkan hasil Placement Test, kami ada course yang tepat sekali untuk {{name}} di [LEVEL]. Silahkan klik link berikut untuk brosur dan informasi tentang level di IELC 🙏\nhttps://ielc.co.id/IELC-Levels.pdf\n\nUntuk kelas private, siswa bisa mengatur jadwal sendiri antara hari Senin-Jumat pukul 10.00-20.00 dan Sabtu pukul 10.00-17.00.\n\nKira kira {{name}} ingin booking jadwal les hari apa dan jam berapa? 😊 🙏",
                ],
                [
                    'title' => '[PT] IELTS Send WA IELTS Fee Template',
                    'message' => "Sebelum mengambil kursus IELTS, siswa akan diminta melakukan test simulasi untuk menentukan level yang tepat. Soal simulasi IELTS akan kami kirimkan via email dan siswa harus mengumpulkan hasilnya sesuai dengan batas waktu yang telah ditentukan 😊 🙏\n\nDurasi simulasi tes adalah sebagai berikut:\nListening Module (30 min)\nReading Module (60 min)\nWriting Module (60 min)\nSpeaking Module (15 min) - optional\n\nBiaya simulasi tes IELTS adalah Rp. 300.000 (tanpa Speaking Module) termasuk feedback mendetail untuk Writing Module.\n\nBiaya simulasi tes IELTS komplit termasuk Speaking Module bersama IELC IELTS expert yang akan memberi feedback mendetail untuk hasil speaking adalah Rp. 500.000\n\nhttps://ielc.co.id/Simulation-Test-IELTS.pdf",
                ],
                [
                    'title' => '[PT] IELTS Send IELTS PT Invoice',
                    'message' => "Berikut saya kirimkan invoice untuk biaya simulasi tes IELTS 😊\n\nPembayaran dapat dilakukan secara tunai di IELC Campus atau melalui transfer ke nomor rekening berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[PT] IELTS Send Customer Data Form',
                    'message' => "Sebelum Placement Test, boleh saya minta bantuan {{name}} untuk mengisi data pada form berikut:\n\n[LINK_ZOHO]",
                ],
                [
                    'title' => '[PT] IELTS Schedule AD Consultation',
                    'message' => "Untuk hasil placement test akan dibahas saat konsultasi dengan IELTS expert kami 😊\n\nKira-kira bisa dijadwalkan konsultasi pada hari apa dan jam berapa? 😊 🙏",
                ],
                [
                    'title' => '[PT] IELTS Send Consultation Schedule Link',
                    'message' => "Berikut saya kirimkan link zoom untuk konsultasi dengan IELTS expert kami\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[PT] IELTS Post Consultation Follow Up',
                    'message' => "Halo {{name}}, semoga pembahasan hasil placement test dengan IELTS expert kami bermanfaat 😊 Kami percaya bahwa IELC merupakan solusi terbaik untuk IELTS preparation {{name}}! 🤩\n\nMenurut IELTS expert kami dengan hasil PT dan target skor IELTS {{name}}, kami menyarankan untuk mengambil paket [PAKET].\n\nApakah {{name}} berkenan mengambil paket ini atau ingin mengambil paket yang lain?",
                ],
                [
                    'title' => '[PT] TOEFL iBT Send WA TOEFL iBT Fee Template',
                    'message' => "Sebelum mengambil kursus TOEFL iBT, siswa akan diminta melakukan test simulasi untuk menentukan level yang tepat. Soal simulasi TOEFL iBT akan kami kirimkan via email dan siswa harus mengumpulkan hasilnya sesuai dengan batas waktu yang telah ditentukan 😊 🙏\n\nDurasi simulasi tes adalah sebagai berikut:\nListening Module (60 min)\nReading Module (60 min)\nWriting Module (50 min)\nSpeaking Module (15 min) - optional\n\nBiaya simulasi tes TOEFL iBT adalah Rp. 300.000 (tanpa Speaking Module) termasuk feedback mendetail untuk Writing Module.\n\nBiaya simulasi tes TOEFL iBT komplit termasuk Speaking Module bersama IELC TOEFL iBT expert yang akan memberi feedback mendetail untuk hasil speaking adalah Rp. 500.000\n\nhttps://ielc.co.id/Simulation-Test-TOEFL-iBT.pdf",
                ],
                [
                    'title' => '[PT] TOEFL iBT Send TOEFL iBT PT Invoice',
                    'message' => "Berikut saya kirimkan invoice untuk biaya simulasi tes TOEFL iBT 😊\n\nPembayaran dapat dilakukan secara tunai di IELC Campus atau melalui transfer ke nomor rekening berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[PT] TOEFL iBT Send Customer Data Form',
                    'message' => "Sebelum Placement Test, boleh saya minta bantuan {{name}} untuk mengisi data pada form berikut:\n\n[LINK_ZOHO]",
                ],
                [
                    'title' => '[PT] TOEFL iBT Send Consultation Schedule Link',
                    'message' => "Berikut saya kirimkan link zoom untuk konsultasi dengan TOEFL iBT expert kami\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[PT] TOEFL iBT Send Course Offer',
                    'message' => "Halo {{name}}, semoga pembahasan hasil placement test dengan TOEFL iBT expert kami bermanfaat 😊 Kami percaya bahwa IELC merupakan solusi terbaik untuk TOEFL iBT preparation {{name}}! 🤩\n\nMenurut TOEFL iBT expert kami dengan hasil PT dan target skor TOEFL iBT {{name}}, kami menyarankan untuk mengambil paket [PAKET].\n\nApakah {{name}} berkenan mengambil paket ini atau ingin mengambil paket yang lain?",
                ],
                [
                    'title' => '[PT] TOEFL PBT Send WA TOEFL PBT Fee Template',
                    'message' => "Sebelum mengambil kursus TOEFL PBT, siswa akan diminta melakukan test simulasi untuk menentukan level yang tepat. File soal simulasi TOEFL PBT akan kami kirimkan via email dan siswa harus mengumpulkan hasilnya sesuai dengan batas waktu yang telah ditentukan 😊 🙏\n\nDurasi simulasi tes adalah sebagai berikut:\nListening Section (35 min)\nReading Section (55 min)\nStructure (25 min)\n\nBiaya simulasi tes TOEFL PBT sebesar Rp. 150.000.- 😊 🙏\n\nhttps://ielc.co.id/Simulation-Test-TOEFL.pdf",
                ],
                [
                    'title' => '[PT] TOEFL PBT Send TOEFL PBT PT Invoice',
                    'message' => "Berikut saya kirimkan invoice untuk biaya simulasi tes TOEFL 😊\n\nPembayaran dapat dilakukan secara tunai di IELC Campus atau melalui transfer ke nomor rekening berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[PT] TOEFL PBT Send Customer Data Form',
                    'message' => "Sebelum Placement Test, boleh saya minta bantuan {{name}} untuk mengisi data pada form berikut:\n\n[LINK_ZOHO]",
                ],
                [
                    'title' => '[PT] TOEFL PBT Send Consultation Schedule Link',
                    'message' => "Berikut saya kirimkan link zoom untuk konsultasi dengan TOEFL PBT expert kami\n\n[LINK_ZOOM]",
                ],
                [
                    'title' => '[PT] TOEFL PBT Send Course Offer',
                    'message' => "Halo {{name}}, semoga pembahasan hasil placement test dengan TOEFL expert kami bermanfaat 😊 Kami percaya bahwa IELC merupakan solusi terbaik untuk TOEFL preparation {{name}}! 🤩\n\nMenurut TOEFL expert kami dengan hasil PT dan target skor TOEFL {{name}}, kami menyarankan untuk mengambil paket [PAKET].\n\nApakah {{name}} berkenan mengambil paket ini atau ingin mengambil paket yang lain?",
                ],
            ],
            'invoice' => [
                [
                    'title' => '[Invoice] Kids Send Invoice',
                    'message' => "Kepada Yth. orang tua {{name}}\n\nBerikut kami kirimkan invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL]\nPembayaran dapat dilakukan secara tunai di IELC Campus maupun transfer, dengan nomor rekening sebagai berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[Invoice] Kids Send Proof of Payment',
                    'message' => "Kepada Yth. orang tua {{name}}\n\nTerima kasih atas pembayaran invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL] melalui transfer [BANK] 🙏\n\nBerikut kami kirimkan kwitansi pembayaran invoice tersebut.\nSelamat bergabung di IELC 😊 🙏\n\n[LINK_KWITANSI]",
                ],
                [
                    'title' => '[Invoice] Teens Send Invoice',
                    'message' => "Kepada Yth. orang tua {{name}}\n\nBerikut kami kirimkan invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL]\nPembayaran dapat dilakukan secara tunai di IELC Campus maupun transfer, dengan nomor rekening sebagai berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[Invoice] Teens Send Proof of Payment',
                    'message' => "Kepada Yth. orang tua {{name}}\n\nTerima kasih atas pembayaran invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL] melalui transfer [BANK] 🙏\n\nBerikut kami kirimkan kwitansi pembayaran invoice tersebut.\nSelamat bergabung di IELC 😊 🙏\n\n[LINK_KWITANSI]",
                ],
                [
                    'title' => '[Invoice] Adult Send Invoice',
                    'message' => "Kepada Yth. {{name}}\n\nBerikut kami kirimkan invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL]\nPembayaran dapat dilakukan secara tunai di IELC Campus maupun transfer, dengan nomor rekening sebagai berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[Invoice] Adult Send Proof of Payment',
                    'message' => "Kepada Yth. orang tua {{name}}\n\nTerima kasih atas pembayaran invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL] melalui transfer [BANK] 🙏\n\nBerikut kami kirimkan kwitansi pembayaran invoice tersebut.\nSelamat bergabung di IELC 😊 🙏\n\n[LINK_KWITANSI]",
                ],
                [
                    'title' => '[Invoice] IELTS Send Invoice',
                    'message' => "Kepada Yth. {{name}}\n\nBerikut kami kirimkan invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL]\nPembayaran dapat dilakukan secara tunai di IELC Campus maupun transfer, dengan nomor rekening sebagai berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[Invoice] IELTS Send Proof of Payment',
                    'message' => "Kepada Yth. orang tua {{name}}\n\nTerima kasih atas pembayaran invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL] melalui transfer [BANK] 🙏\n\nBerikut kami kirimkan kwitansi pembayaran invoice tersebut.\nSelamat bergabung di IELC 😊 🙏\n\n[LINK_KWITANSI]",
                ],
                [
                    'title' => '[Invoice] TOEFL iBT Send Invoice',
                    'message' => "Kepada Yth. {{name}}\n\nBerikut kami kirimkan invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL]\nPembayaran dapat dilakukan secara tunai di IELC Campus maupun transfer, dengan nomor rekening sebagai berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[Invoice] TOEFL iBT Send Proof of Payment',
                    'message' => "Kepada Yth. orang tua {{name}}\n\nTerima kasih atas pembayaran invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL] melalui transfer [BANK] 🙏\n\nBerikut kami kirimkan kwitansi pembayaran invoice tersebut.\nSelamat bergabung di IELC 😊 🙏\n\n[LINK_KWITANSI]",
                ],
                [
                    'title' => '[Invoice] TOEFL PBT Send Invoice',
                    'message' => "Kepada Yth. {{name}}\n\nBerikut kami kirimkan invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL]\nPembayaran dapat dilakukan secara tunai di IELC Campus maupun transfer, dengan nomor rekening sebagai berikut:\nBCA 7850 418 211\nBNI 027 5277 683\nMANDIRI 138-000-011-2214\natas nama PT. Lingua Munda.\n\nTerima kasih 😊 🙏\n\n[LINK_INVOICE]",
                ],
                [
                    'title' => '[Invoice] TOEFL PBT Send Proof of Payment',
                    'message' => "Kepada Yth. orang tua {{name}}\n\nTerima kasih atas pembayaran invoice [DESKRIPSI_INVOICE] sebesar [NOMINAL] melalui transfer [BANK] 🙏\n\nBerikut kami kirimkan kwitansi pembayaran invoice tersebut.\nSelamat bergabung di IELC 😊 🙏\n\n[LINK_KWITANSI]",
                ],
            ],
        ];

        foreach ($phaseTemplates as $phaseCode => $templates) {
            $phase = LeadPhase::where('code', $phaseCode)->first();
            if (!$phase) {
                continue;
            }

            foreach ($templates as $tpl) {
                $template = ChatTemplate::updateOrCreate(['title' => $tpl['title']], [
                    'message' => $tpl['message']
                ]);

                $template->leadPhases()->syncWithoutDetaching([$phase->id]);
            }
        }
    }
}

