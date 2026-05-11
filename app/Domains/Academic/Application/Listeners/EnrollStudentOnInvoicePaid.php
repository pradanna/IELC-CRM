<?php

namespace App\Domains\Academic\Application\Listeners;

use App\Domains\Finance\Domain\Events\InvoicePaid;
use App\Domains\Academic\Application\Actions\EnrollStudent;

class EnrollStudentOnInvoicePaid
{
    public function __construct(
        protected EnrollStudent $enrollStudent
    ) {}

    public function handle(InvoicePaid $event): void
    {
        $invoice = $event->invoice;
        $studentId = $invoice->student_id;

        if ($studentId && $invoice->study_class_id) {
            $this->enrollStudent->handle($invoice->studyClass, $studentId);
        }
    }
}
