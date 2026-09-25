<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\Finance\Domain\Events\InvoiceGenerated;
use App\Domains\Finance\Domain\Models\Invoice;
use Illuminate\Support\Facades\DB;

class TransferStudentClass
{
    public function __construct(
        protected CalculateClassTransferDifference $calculator
    ) {}

    /**
     * Handle the transfer of a student from one study class to another.
     * Generates an invoice if the destination class has longer duration than remaining source sessions.
     *
     * @param Student $student
     * @param string $fromClassId
     * @param string $toClassId
     * @param string|null $effectiveDate
     * @param string|null $reason
     * @return array
     */
    public function handle(
        Student $student,
        string $fromClassId,
        string $toClassId,
        ?string $effectiveDate = null,
        ?string $reason = null
    ): array {
        return DB::transaction(function () use ($student, $fromClassId, $toClassId, $effectiveDate, $reason) {
            $effectiveDate = $effectiveDate ?: now()->toDateString();
            $fromClass = StudyClass::with('priceMaster')->findOrFail($fromClassId);
            $toClass = StudyClass::with('priceMaster')->findOrFail($toClassId);

            $fromClassName = $fromClass->name;
            $toClassName = $toClass->name;

            // 1. Calculate duration and remaining session difference
            $calculation = $this->calculator->handle($student, $fromClass, $toClass, $effectiveDate);

            // 2. Generate Invoice if target class has longer duration / more remaining sessions
            $invoice = null;
            if ($calculation['requires_invoice'] && $calculation['invoice_amount'] > 0) {
                $yearMonth = now()->format('ym');
                $count = Invoice::where('invoice_number', 'like', "INV-{$yearMonth}-%")->count() + 1;
                do {
                    $sequence = str_pad($count, 4, '0', STR_PAD_LEFT);
                    $invoiceNumber = "INV-{$yearMonth}-{$sequence}";
                    $exists = Invoice::where('invoice_number', $invoiceNumber)->exists();
                    if ($exists) {
                        $count++;
                    }
                } while ($exists);

                $transferNotes = "Pindah kelas dari {$fromClassName} (Sisa {$calculation['from_remaining']} sesi) ke {$toClassName} (Sisa {$calculation['to_remaining']} sesi). Tagihan selisih {$calculation['difference_sessions']} sesi." . ($reason ? " Alasan: {$reason}" : "");

                $invoice = Invoice::create([
                    'invoice_number' => $invoiceNumber,
                    'student_id'     => $student->id,
                    'lead_id'        => $student->lead_id,
                    'study_class_id' => $toClass->id,
                    'total_amount'   => $calculation['invoice_amount'],
                    'discount_amount'=> 0,
                    'session_count'  => $calculation['difference_sessions'],
                    'start_date'     => $effectiveDate,
                    'status'         => 'pending',
                    'due_date'       => now()->addDays(7),
                    'type'           => 'transfer_class',
                    'notes'          => $transferNotes,
                ]);

                $invoice->items()->create([
                    'price_master_id' => $toClass->price_master_id ?: $fromClass->price_master_id,
                    'name' => "Biaya Selisih Pindah Kelas: {$toClassName} (+{$calculation['difference_sessions']} Sesi)",
                    'quantity' => 1,
                    'unit_price' => $calculation['invoice_amount'],
                    'subtotal' => $calculation['invoice_amount'],
                ]);

                InvoiceGenerated::dispatch($invoice, [
                    'student_id' => $student->id,
                    'lead_id' => $student->lead_id,
                    'study_class_id' => $toClass->id,
                    'action' => 'transfer_class',
                ]);
            }

            // 3. Mark existing active enrollment(s) for the old class as stopped/transferred
            $transferNote = "Pindah ke kelas {$toClassName} per {$effectiveDate}" . ($reason ? " (Alasan: {$reason})" : "");

            $oldEnrollments = LeadEnrollment::where('student_id', $student->id)
                ->where('study_class_id', $fromClassId)
                ->whereIn('status', ['active', 'pending_invoice', 'pending_payment'])
                ->get();

            foreach ($oldEnrollments as $enrollment) {
                $existingNotes = trim($enrollment->notes ?? '');
                $updatedNotes = $existingNotes === '' ? $transferNote : "{$existingNotes} | {$transferNote}";
                $enrollment->update([
                    'status' => 'stopped',
                    'stopped_at' => $effectiveDate,
                    'notes' => $updatedNotes,
                ]);
            }

            // 4. Create / sync new active enrollment in target class
            $syncData = [
                'lead_id' => $student->lead_id,
                'joined_at' => $effectiveDate,
                'end_date' => $toClass->end_session_date?->format('Y-m-d'),
                'status' => 'active',
                'cycle_number' => $toClass->current_session_number ?? 1,
                'notes' => "Pindahan dari kelas {$fromClassName}" . ($reason ? " (Alasan: {$reason})" : ""),
            ];

            if ($invoice) {
                $syncData['invoice_id'] = $invoice->id;
            }

            $student->studyClasses()->syncWithoutDetaching([
                $toClassId => $syncData,
            ]);

            // 5. Log Activity
            if (function_exists('activity')) {
                activity()
                    ->performedOn($student)
                    ->causedBy(auth()->user())
                    ->withProperties([
                        'from_class_id' => $fromClassId,
                        'from_class_name' => $fromClassName,
                        'to_class_id' => $toClassId,
                        'to_class_name' => $toClassName,
                        'effective_date' => $effectiveDate,
                        'reason' => $reason,
                        'invoice_id' => $invoice?->id,
                        'invoice_number' => $invoice?->invoice_number,
                        'difference_sessions' => $calculation['difference_sessions'],
                        'invoice_amount' => $calculation['invoice_amount'],
                    ])
                    ->log("Siswa {$student->student_number} dipindahkan dari kelas '{$fromClassName}' ke '{$toClassName}'" . ($invoice ? " dengan tagihan selisih Rp " . number_format($invoice->total_amount, 0, ',', '.') : ''));
            }

            return [
                'transferred' => true,
                'invoice' => $invoice,
                'calculation' => $calculation,
            ];
        });
    }
}
