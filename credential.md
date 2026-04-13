# IELC CRM Default Credentials

Berikut adalah daftar akun default yang dapat digunakan untuk masuk ke aplikasi IELC CRM berdasarkan data seeder:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@ielc.com` | `password` |
| **Marketing** | `marketing@ielc.com` | `password` |
| **Frontdesk** | `frontdesk@ielc.com` | `password` |
| **Finance** | `finance@ielc.com` | `password` |

> [!IMPORTANT]
> Akun-akun di atas dibuat secara otomatis melalui `UserSeeder.php`. Pastikan Anda sudah menjalankan perintah `php artisan db:seed` atau `php artisan migrate:fresh --seed` jika akun-akun tersebut belum tersedia di database Anda.
