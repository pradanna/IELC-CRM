<?php

namespace App\Http\Controllers\Admin\System;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DatabaseBackupController extends Controller
{
    protected string $backupDir;

    public function __construct()
    {
        $this->backupDir = storage_path('app/backups');
    }

    /**
     * Display a listing of database backups and database statistics.
     */
    public function index(): Response
    {
        File::ensureDirectoryExists($this->backupDir);

        $files = File::files($this->backupDir);
        $backups = collect($files)
            ->filter(fn($file) => in_array($file->getExtension(), ['sql', 'gz']))
            ->map(function ($file) {
                return [
                    'name' => $file->getFilename(),
                    'size' => $this->formatBytes($file->getSize()),
                    'raw_size' => $file->getSize(),
                    'created_at' => date('d M Y H:i:s', $file->getMTime()),
                    'timestamp' => $file->getMTime(),
                    'download_url' => route('admin.system.backup.download', ['filename' => $file->getFilename()]),
                ];
            })
            ->sortByDesc('timestamp')
            ->values()
            ->all();

        // Calculate database stats
        $dbName = DB::connection()->getDatabaseName();
        $dbStats = DB::select("
            SELECT 
                COUNT(*) as table_count,
                COALESCE(SUM(data_length), 0) as data_bytes,
                COALESCE(SUM(index_length), 0) as index_bytes,
                COALESCE(SUM(data_length + index_length), 0) as total_bytes
            FROM information_schema.TABLES 
            WHERE table_schema = ?
        ", [$dbName]);

        $tableCount = $dbStats[0]->table_count ?? 0;
        $totalBytes = (int) ($dbStats[0]->total_bytes ?? 0);
        $dataBytes = (int) ($dbStats[0]->data_bytes ?? 0);
        $indexBytes = (int) ($dbStats[0]->index_bytes ?? 0);

        $stats = [
            'database_name' => $dbName,
            'table_count' => (int) $tableCount,
            'database_size' => $this->formatBytes($totalBytes),
            'data_size' => $this->formatBytes($dataBytes),
            'index_size' => $this->formatBytes($indexBytes),
            'raw_database_size' => $totalBytes,
            'total_backups' => count($backups),
            'last_backup' => count($backups) > 0 ? $backups[0]['created_at'] : null,
        ];

        return Inertia::render('Admin/System/Backup', [
            'backups' => $backups,
            'stats' => $stats,
        ]);
    }

    /**
     * Generate a new database backup.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'format' => 'nullable|in:sql,sql.gz',
            'download_now' => 'nullable|boolean',
        ]);

        File::ensureDirectoryExists($this->backupDir);

        $format = $request->input('format', 'sql');
        $isGzip = ($format === 'sql.gz');
        $extension = $isGzip ? 'sql.gz' : 'sql';
        $filename = 'backup_' . config('app.name', 'ielc') . '_' . date('Y_m_d_His') . '.' . $extension;
        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;

        // Run backup generator (hybrid: attempts mysqldump, fallbacks to PDO)
        $this->exportDatabase($filePath, $isGzip);

        if ($request->boolean('download_now')) {
            return response()->download($filePath, $filename);
        }

        return redirect()->route('admin.system.backup.index')->with('success', "Backup database berhasil dibuat: {$filename}");
    }

    /**
     * Download an existing backup file.
     */
    public function download(string $filename): BinaryFileResponse
    {
        $cleanFilename = basename($filename);
        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $cleanFilename;

        abort_unless(File::exists($filePath), 404, 'File backup tidak ditemukan.');

        return response()->download($filePath, $cleanFilename);
    }

    /**
     * Delete a backup file from storage.
     */
    public function destroy(string $filename)
    {
        $cleanFilename = basename($filename);
        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $cleanFilename;

        if (File::exists($filePath)) {
            File::delete($filePath);
            return redirect()->back()->with('success', "File backup '{$cleanFilename}' berhasil dihapus.");
        }

        return redirect()->back()->with('error', 'File backup tidak ditemukan.');
    }

    /**
     * Export database with fallback mechanism.
     */
    protected function exportDatabase(string $outputPath, bool $isGzip): void
    {
        File::ensureDirectoryExists(dirname($outputPath));

        // Try mysqldump first if possible
        $dumpSuccess = $this->tryMysqldump($outputPath, $isGzip);

        if (!$dumpSuccess) {
            $this->pdoExport($outputPath, $isGzip);
        }
    }

    /**
     * Attempt to run mysqldump command.
     */
    protected function tryMysqldump(string $outputPath, bool $isGzip): bool
    {
        $host = config('database.connections.mysql.host', '127.0.0.1');
        $port = config('database.connections.mysql.port', '3306');
        $db   = config('database.connections.mysql.database');
        $user = config('database.connections.mysql.username', 'root');
        $pass = config('database.connections.mysql.password', '');

        // Test if mysqldump is executable
        $testCmd = (DIRECTORY_SEPARATOR === '\\') ? 'where mysqldump 2>nul' : 'which mysqldump 2>/dev/null';
        @exec($testCmd, $output, $returnVar);

        if ($returnVar !== 0) {
            return false;
        }

        $tempSql = $isGzip ? tempnam(sys_get_temp_dir(), 'sql_') : $outputPath;

        $cmd = sprintf(
            'mysqldump --host=%s --port=%s --user=%s %s --single-transaction --quick --skip-lock-tables %s > %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($user),
            $pass !== '' ? '--password=' . escapeshellarg($pass) : '',
            escapeshellarg($db),
            escapeshellarg($tempSql)
        );

        @exec($cmd, $cmdOutput, $cmdResult);

        if ($cmdResult === 0 && file_exists($tempSql) && filesize($tempSql) > 0) {
            if ($isGzip) {
                $data = file_get_contents($tempSql);
                file_put_contents($outputPath, gzencode($data, 9));
                @unlink($tempSql);
            }
            return true;
        }

        if ($isGzip && file_exists($tempSql)) {
            @unlink($tempSql);
        }

        return false;
    }

    /**
     * Fallback PDO Database Exporter.
     * Generates a complete, valid SQL dump with CREATE TABLE and chunked INSERT statements.
     */
    protected function pdoExport(string $outputPath, bool $isGzip): void
    {
        // Increase time and memory limits for backup execution
        @set_time_limit(300);
        @ini_set('memory_limit', '512M');

        $pdo = DB::connection()->getPdo();
        $dbName = DB::connection()->getDatabaseName();

        $handle = fopen($isGzip ? 'php://temp' : $outputPath, 'w+');

        // Header comments and config
        fwrite($handle, "-- ========================================================\n");
        fwrite($handle, "-- IELC-CRM Database Backup\n");
        fwrite($handle, "-- Generation Date: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "-- Database: {$dbName}\n");
        fwrite($handle, "-- ========================================================\n\n");
        fwrite($handle, "SET NAMES utf8mb4;\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 0;\n");
        fwrite($handle, "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n");
        fwrite($handle, "SET AUTOCOMMIT = 0;\n");
        fwrite($handle, "START TRANSACTION;\n\n");

        // Fetch all base tables
        $tablesStmt = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        $tables = [];
        while ($row = $tablesStmt->fetch(\PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }

        foreach ($tables as $table) {
            fwrite($handle, "\n-- --------------------------------------------------------\n");
            fwrite($handle, "-- Table structure for `{$table}`\n");
            fwrite($handle, "-- --------------------------------------------------------\n");
            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");

            // Create Table SQL
            $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
            $createRow = $createStmt->fetch(\PDO::FETCH_ASSOC);
            if (!empty($createRow['Create Table'])) {
                fwrite($handle, $createRow['Create Table'] . ";\n\n");
            }

            // Dump Table Data in batches
            fwrite($handle, "-- Dumping data for `{$table}`\n");

            $countStmt = $pdo->query("SELECT COUNT(*) FROM `{$table}`");
            $rowCount = (int) $countStmt->fetchColumn();

            if ($rowCount > 0) {
                $batchSize = 250;
                $offset = 0;

                while ($offset < $rowCount) {
                    $dataStmt = $pdo->query("SELECT * FROM `{$table}` LIMIT {$batchSize} OFFSET {$offset}");
                    $rows = $dataStmt->fetchAll(\PDO::FETCH_ASSOC);

                    if (empty($rows)) {
                        break;
                    }

                    $columns = array_keys($rows[0]);
                    $quotedCols = array_map(fn($c) => "`{$c}`", $columns);
                    $insertPrefix = "INSERT INTO `{$table}` (" . implode(', ', $quotedCols) . ") VALUES\n";

                    $valueLines = [];
                    foreach ($rows as $row) {
                        $values = [];
                        foreach ($columns as $col) {
                            $val = $row[$col];
                            if (is_null($val)) {
                                $values[] = 'NULL';
                            } elseif (is_numeric($val) && !preg_match('/^0\d+/', (string)$val)) {
                                $values[] = $val;
                            } else {
                                $values[] = $pdo->quote($val);
                            }
                        }
                        $valueLines[] = "(" . implode(', ', $values) . ")";
                    }

                    fwrite($handle, $insertPrefix . implode(",\n", $valueLines) . ";\n");

                    $offset += $batchSize;
                }
            }

            fwrite($handle, "\n");
        }

        // Footer
        fwrite($handle, "COMMIT;\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");

        if ($isGzip) {
            rewind($handle);
            $content = stream_get_contents($handle);
            fclose($handle);
            file_put_contents($outputPath, gzencode($content, 9));
        } else {
            fclose($handle);
        }
    }

    /**
     * Helper to format bytes to human readable form.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
