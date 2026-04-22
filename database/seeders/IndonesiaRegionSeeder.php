<?php

namespace Database\Seeders;

use App\Models\Province;
use App\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IndonesiaRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks for clean seeding if necessary
        // DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        // City::truncate();
        // Province::truncate();
        // DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $regions = [
            'Aceh' => [
                'Banda Aceh', 'Langsa', 'Lhokseumawe', 'Sabang', 'Subulussalam',
                'Kab. Aceh Barat', 'Kab. Aceh Barat Daya', 'Kab. Aceh Besar', 'Kab. Aceh Jaya', 
                'Kab. Aceh Selatan', 'Kab. Aceh Singkil', 'Kab. Aceh Tamiang', 'Kab. Aceh Tengah', 
                'Kab. Aceh Tenggara', 'Kab. Aceh Timur', 'Kab. Aceh Utara', 'Kab. Bener Meriah', 
                'Kab. Bireuen', 'Kab. Gayo Lues', 'Kab. Nagan Raya', 'Kab. Pidie', 
                'Kab. Pidie Jaya', 'Kab. Simeulue'
            ],
            'Sumatera Utara' => [
                'Medan', 'Binjai', 'Gunungsitoli', 'Padang Sidempuan', 'Pematangsiantar', 
                'Sibolga', 'Tanjungbalai', 'Tebing Tinggi',
                'Kab. Asahan', 'Kab. Batu Bara', 'Kab. Dairi', 'Kab. Deli Serdang', 
                'Kab. Humbang Hasundutan', 'Kab. Karo', 'Kab. Labuhanbatu', 'Kab. Labuhanbatu Selatan', 
                'Kab. Labuhanbatu Utara', 'Kab. Langkat', 'Kab. Mandailing Natal', 'Kab. Nias', 
                'Kab. Nias Barat', 'Kab. Nias Selatan', 'Kab. Nias Utara', 'Kab. Padang Lawas', 
                'Kab. Padang Lawas Utara', 'Kab. Pakpak Bharat', 'Kab. Samosir', 'Kab. Serdang Bedagai', 
                'Kab. Simalungun', 'Kab. Tapanuli Selatan', 'Kab. Tapanuli Tengah', 'Kab. Tapanuli Utara', 
                'Kab. Toba Samosir'
            ],
            'Sumatera Barat' => [
                'Padang', 'Bukittinggi', 'Padang Panjang', 'Pariaman', 'Payakumbuh', 
                'Sawahlunto', 'Solok',
                'Kab. Agam', 'Kab. Dharmasraya', 'Kab. Kepulauan Mentawai', 'Kab. Lima Puluh Kota', 
                'Kab. Padang Pariaman', 'Kab. Pasaman', 'Kab. Pasaman Barat', 'Kab. Pesisir Selatan', 
                'Kab. Sijunjung', 'Kab. Solok', 'Kab. Solok Selatan', 'Kab. Tanah Datar'
            ],
            'Riau' => [
                'Pekanbaru', 'Dumai',
                'Kab. Bengkalis', 'Kab. Indragiri Hilir', 'Kab. Indragiri Hulu', 'Kab. Kampar', 
                'Kab. Kepulauan Meranti', 'Kab. Kuantan Singingi', 'Kab. Pelalawan', 'Kab. Rokan Hilir', 
                'Kab. Rokan Hulu', 'Kab. Siak'
            ],
            'Kepulauan Riau' => [
                'Tanjung Pinang', 'Batam',
                'Kab. Bintan', 'Kab. Karimun', 'Kab. Kepulauan Anambas', 'Kab. Lingga', 'Kab. Natuna'
            ],
            'Jambi' => [
                'Jambi', 'Sungaipenuh',
                'Kab. Batanghari', 'Kab. Bungo', 'Kab. Kerinci', 'Kab. Merangin', 
                'Kab. Muaro Jambi', 'Kab. Sarolangun', 'Kab. Tanjung Jabung Barat', 
                'Kab. Tanjung Jabung Timur', 'Kab. Tebo'
            ],
            'Bengkulu' => [
                'Bengkulu',
                'Kab. Bengkulu Selatan', 'Kab. Bengkulu Tengah', 'Kab. Bengkulu Utara', 'Kab. Kaur', 
                'Kab. Kepahiang', 'Kab. Lebong', 'Kab. Mukomuko', 'Kab. Rejang Lebong', 'Kab. Seluma'
            ],
            'Sumatera Selatan' => [
                'Palembang', 'Lubuklinggau', 'Pagar Alam', 'Prabumulih',
                'Kab. Banyuasin', 'Kab. Empat Lawang', 'Kab. Lahat', 'Kab. Muara Enim', 
                'Kab. Musi Banyuasin', 'Kab. Musi Rawas', 'Kab. Musi Rawas Utara', 'Kab. Ogan Ilir', 
                'Kab. Ogan Komering Ilir', 'Kab. Ogan Komering Ulu', 'Kab. Ogan Komering Ulu Selatan', 
                'Kab. Ogan Komering Ulu Timur', 'Kab. Penukal Abab Lematang Ilir'
            ],
            'Kepulauan Bangka Belitung' => [
                'Pangkal Pinang',
                'Kab. Bangka', 'Kab. Bangka Barat', 'Kab. Bangka Selatan', 'Kab. Bangka Tengah', 
                'Kab. Belitung', 'Kab. Belitung Timur'
            ],
            'Lampung' => [
                'Bandar Lampung', 'Metro',
                'Kab. Lampung Barat', 'Kab. Lampung Selatan', 'Kab. Lampung Tengah', 
                'Kab. Lampung Timur', 'Kab. Lampung Utara', 'Kab. Mesuji', 'Kab. Pesawaran', 
                'Kab. Pesisir Barat', 'Kab. Pringsewu', 'Kab. Tanggamus', 'Kab. Tulang Bawang', 
                'Kab. Tulang Bawang Barat', 'Kab. Way Kanan'
            ],
            'DKI Jakarta' => [
                'Jakarta Pusat', 'Jakarta Barat', 'Jakarta Utara', 'Jakarta Timur', 'Jakarta Selatan',
                'Kab. Kepulauan Seribu'
            ],
            'Jawa Barat' => [
                'Bandung', 'Bekasi', 'Bogor', 'Cimahi', 'Cirebon', 'Depok', 'Sukabumi', 
                'Tasikmalaya', 'Banjar',
                'Kab. Bandung', 'Kab. Bandung Barat', 'Kab. Bekasi', 'Kab. Bogor', 
                'Kab. Ciamis', 'Kab. Cianjur', 'Kab. Cirebon', 'Kab. Garut', 'Kab. Indramayu', 
                'Kab. Karawang', 'Kab. Kuningan', 'Kab. Majalengka', 'Kab. Pangandaran', 
                'Kab. Purwakarta', 'Kab. Subang', 'Kab. Sukabumi', 'Kab. Sumedang', 'Kab. Tasikmalaya'
            ],
            'Banten' => [
                'Serang', 'Cilegon', 'Tangerang', 'Tangerang Selatan',
                'Kab. Lebak', 'Kab. Pandeglang', 'Kab. Serang', 'Kab. Tangerang'
            ],
            'Jawa Tengah' => [
                'Semarang', 'Magelang', 'Pekalongan', 'Salatiga', 'Surakarta', 'Tegal',
                'Kab. Banjarnegara', 'Kab. Banyumas', 'Kab. Batang', 'Kab. Blora', 
                'Kab. Boyolali', 'Kab. Brebes', 'Kab. Cilacap', 'Kab. Demak', 'Kab. Grobogan', 
                'Kab. Jepara', 'Kab. Karanganyar', 'Kab. Kebumen', 'Kab. Kendal', 'Kab. Klaten', 
                'Kab. Kudus', 'Kab. Magelang', 'Kab. Pati', 'Kab. Pekalongan', 'Kab. Pemalang', 
                'Kab. Purbalingga', 'Kab. Purworejo', 'Kab. Rembang', 'Kab. Semarang', 'Kab. Sragen', 
                'Kab. Sukoharjo', 'Kab. Tegal', 'Kab. Temanggung', 'Kab. Wonogiri', 'Kab. Wonosobo'
            ],
            'DI Yogyakarta' => [
                'Yogyakarta',
                'Kab. Bantul', 'Kab. Gunungkidul', 'Kab. Kulon Progo', 'Kab. Sleman'
            ],
            'Jawa Timur' => [
                'Surabaya', 'Batu', 'Blitar', 'Kediri', 'Madiun', 'Malang', 'Mojokerto', 
                'Pasuruan', 'Probolinggo',
                'Kab. Bangkalan', 'Kab. Banyuwangi', 'Kab. Blitar', 'Kab. Bojonegoro', 
                'Kab. Bondowoso', 'Kab. Gresik', 'Kab. Jember', 'Kab. Jombang', 'Kab. Kediri', 
                'Kab. Lamongan', 'Kab. Lumajang', 'Kab. Madiun', 'Kab. Magetan', 'Kab. Malang', 
                'Kab. Mojokerto', 'Kab. Nganjuk', 'Kab. Ngawi', 'Kab. Pacitan', 'Kab. Pamekasan', 
                'Kab. Pasuruan', 'Kab. Ponorogo', 'Kab. Probolinggo', 'Kab. Sampang', 'Kab. Sidoarjo', 
                'Kab. Situbondo', 'Kab. Sumenep', 'Kab. Trenggalek', 'Kab. Tuban', 'Kab. Tulungagung'
            ],
            'Bali' => [
                'Denpasar',
                'Kab. Badung', 'Kab. Bangli', 'Kab. Buleleng', 'Kab. Gianyar', 'Kab. Jembrana', 
                'Kab. Karangasem', 'Kab. Klungkung', 'Kab. Tabanan'
            ],
            'Nusa Tenggara Barat' => [
                'Mataram', 'Bima',
                'Kab. Bima', 'Kab. Dompu', 'Kab. Lombok Barat', 'Kab. Lombok Tengah', 
                'Kab. Lombok Timur', 'Kab. Lombok Utara', 'Kab. Sumbawa', 'Kab. Sumbawa Barat'
            ],
            'Nusa Tenggara Timur' => [
                'Kupang',
                'Kab. Alor', 'Kab. Belu', 'Kab. Ende', 'Kab. Flores Timur', 'Kab. Kupang', 
                'Kab. Lembata', 'Kab. Malaka', 'Kab. Manggarai', 'Kab. Manggarai Barat', 
                'Kab. Manggarai Timur', 'Kab. Nagekeo', 'Kab. Ngada', 'Kab. Rote Ndao', 
                'Kab. Sabu Raijua', 'Kab. Sikka', 'Kab. Sumba Barat', 'Kab. Sumba Barat Daya', 
                'Kab. Sumba Tengah', 'Kab. Sumba Timur', 'Kab. Timor Tengah Selatan', 'Kab. Timor Tengah Utara'
            ],
            'Kalimantan Barat' => [
                'Pontianak', 'Singkawang',
                'Kab. Bengkayang', 'Kab. Kapuas Hulu', 'Kab. Kayong Utara', 'Kab. Ketapang', 
                'Kab. Kubu Raya', 'Kab. Landak', 'Kab. Melawi', 'Kab. Mempawah', 'Kab. Sambas', 
                'Kab. Sanggau', 'Kab. Sekadau', 'Kab. Sintang'
            ],
            'Kalimantan Tengah' => [
                'Palangka Raya',
                'Kab. Barito Selatan', 'Kab. Barito Timur', 'Kab. Barito Utara', 'Kab. Gunung Mas', 
                'Kab. Kapuas', 'Kab. Katingan', 'Kab. Kotawaringin Barat', 'Kab. Kotawaringin Timur', 
                'Kab. Lamandau', 'Kab. Murung Raya', 'Kab. Pulang Pisau', 'Kab. Sukamara', 'Kab. Seruyan'
            ],
            'Kalimantan Selatan' => [
                'Banjarmasin', 'Banjarbaru',
                'Kab. Balangan', 'Kab. Banjar', 'Kab. Barito Kuala', 'Kab. Hulu Sungai Selatan', 
                'Kab. Hulu Sungai Tengah', 'Kab. Hulu Sungai Utara', 'Kab. Kotabaru', 'Kab. Tabalong', 
                'Kab. Tanah Bumbu', 'Kab. Tanah Laut', 'Kab. Tapin'
            ],
            'Kalimantan Timur' => [
                'Samarinda', 'Balikpapan', 'Bontang',
                'Kab. Berau', 'Kab. Kutai Barat', 'Kab. Kutai Kartanegara', 'Kab. Kutai Timur', 
                'Kab. Mahakam Ulu', 'Kab. Paser', 'Kab. Penajam Paser Utara'
            ],
            'Kalimantan Utara' => [
                'Tarakan',
                'Kab. Bulungan', 'Kab. Malinau', 'Kab. Nunukan', 'Kab. Tana Tidung'
            ],
            'Sulawesi Utara' => [
                'Manado', 'Bitung', 'Kotamobagu', 'Tomohon',
                'Kab. Bolaang Mongondow', 'Kab. Bolaang Mongondow Selatan', 'Kab. Bolaang Mongondow Timur', 
                'Kab. Bolaang Mongondow Utara', 'Kab. Kepulauan Sangihe', 'Kab. Kepulauan Siau Tagulandang Biaro', 
                'Kab. Kepulauan Talaud', 'Kab. Minahasa', 'Kab. Minahasa Selatan', 'Kab. Minahasa Tenggara', 
                'Kab. Minahasa Utara'
            ],
            'Gorontalo' => [
                'Gorontalo',
                'Kab. Boalemo', 'Kab. Bone Bolango', 'Kab. Gorontalo', 'Kab. Gorontalo Utara', 'Kab. Pohuwato'
            ],
            'Sulawesi Tengah' => [
                'Palu',
                'Kab. Banggai', 'Kab. Banggai Kepulauan', 'Kab. Banggai Laut', 'Kab. Buol', 
                'Kab. Donggala', 'Kab. Morowali', 'Kab. Morowali Utara', 'Kab. Parigi Moutong', 
                'Kab. Poso', 'Kab. Sigi', 'Kab. Tojo Una-Una', 'Kab. Tolitoli'
            ],
            'Sulawesi Barat' => [
                'Mamuju',
                'Kab. Majene', 'Kab. Mamasa', 'Kab. Mamuju Tengah', 'Kab. Mamuju Utara', 'Kab. Polewali Mandar'
            ],
            'Sulawesi Selatan' => [
                'Makassar', 'Palopo', 'Parepare',
                'Kab. Bantaeng', 'Kab. Barru', 'Kab. Bone', 'Kab. Bulukumba', 'Kab. Enrekang', 
                'Kab. Gowa', 'Kab. Jeneponto', 'Kab. Kepulauan Selayar', 'Kab. Luwu', 'Kab. Luwu Timur', 
                'Kab. Luwu Utara', 'Kab. Maros', 'Kab. Pangkajene dan Kepulauan', 'Kab. Pinrang', 
                'Kab. Sidenreng Rappang', 'Kab. Sinjai', 'Kab. Soppeng', 'Kab. Takalar', 
                'Kab. Tana Toraja', 'Kab. Toraja Utara', 'Kab. Wajo'
            ],
            'Sulawesi Tenggara' => [
                'Kendari', 'Bau-Bau',
                'Kab. Bombana', 'Kab. Buton', 'Kab. Buton Selatan', 'Kab. Buton Tengah', 
                'Kab. Buton Utara', 'Kab. Kolaka', 'Kab. Kolaka Timur', 'Kab. Kolaka Utara', 
                'Kab. Konawe', 'Kab. Konawe Kepulauan', 'Kab. Konawe Selatan', 'Kab. Konawe Utara', 
                'Kab. Muna', 'Kab. Muna Barat', 'Kab. Wakatobi'
            ],
            'Maluku' => [
                'Ambon', 'Tual',
                'Kab. Buru', 'Kab. Buru Selatan', 'Kab. Kepulauan Aru', 'Kab. Maluku Barat Daya', 
                'Kab. Maluku Tengah', 'Kab. Maluku Tenggara', 'Kab. Maluku Tenggara Barat', 
                'Kab. Seram Bagian Barat', 'Kab. Seram Bagian Timur'
            ],
            'Maluku Utara' => [
                'Ternate', 'Tidore Kepulauan',
                'Kab. Halmahera Barat', 'Kab. Halmahera Tengah', 'Kab. Halmahera Timur', 
                'Kab. Halmahera Selatan', 'Kab. Halmahera Utara', 'Kab. Kepulauan Sula', 
                'Kab. Pulau Morotai', 'Kab. Pulau Taliabu'
            ],
            'Papua' => [
                'Jayapura',
                'Kab. Biak Numfor', 'Kab. Jayapura', 'Kab. Keerom', 'Kab. Kepulauan Yapen', 
                'Kab. Mamberamo Raya', 'Kab. Sarmi', 'Kab. Supiori', 'Kab. Waropen'
            ],
            'Papua Barat' => [
                'Manokwari',
                'Kab. Fakfak', 'Kab. Kaimana', 'Kab. Manokwari', 'Kab. Manokwari Selatan', 
                'Kab. Pegunungan Arfak', 'Kab. Teluk Bintuni', 'Kab. Teluk Wondama'
            ],
            'Papua Tengah' => [
                'Nabire',
                'Kab. Deiyai', 'Kab. Dogiyai', 'Kab. Intan Jaya', 'Kab. Mimika', 
                'Kab. Nabire', 'Kab. Paniai', 'Kab. Puncak', 'Kab. Puncak Jaya'
            ],
            'Papua Pegunungan' => [
                'Wamena',
                'Kab. Jayawijaya', 'Kab. Lanny Jaya', 'Kab. Mamberamo Tengah', 'Kab. Nduga', 
                'Kab. Pegunungan Bintang', 'Kab. Tolikara', 'Kab. Yahukimo', 'Kab. Yalimo'
            ],
            'Papua Selatan' => [
                'Merauke',
                'Kab. Asmat', 'Kab. Boven Digoel', 'Kab. Mappi', 'Kab. Merauke'
            ],
            'Papua Barat Daya' => [
                'Sorong',
                'Kab. Maybrat', 'Kab. Raja Ampat', 'Kab. Sorong', 'Kab. Sorong Selatan', 
                'Kab. Tambrauw'
            ],
        ];

        foreach ($regions as $provinceName => $cities) {
            $province = Province::updateOrCreate(['name' => $provinceName]);
            
            foreach ($cities as $cityName) {
                City::updateOrCreate([
                    'province_id' => $province->id,
                    'name' => $cityName,
                ]);
            }
        }
    }
}
