import { Badge } from "@/components/ui/Badge";
import { TimesheetStatus, PayPeriodStatus } from "@/lib/enums";

export function TimesheetStatusBadge({ status }: { status: string }) {
  switch (status) {
    case TimesheetStatus.DRAFT:
      return <Badge variant="default">Draft</Badge>;
    case TimesheetStatus.PENDING:
      return <Badge variant="warning">Pending</Badge>;
    case TimesheetStatus.VERIFIED:
      return <Badge variant="info">Verified</Badge>;
    case TimesheetStatus.APPROVED:
      return <Badge variant="success">Approved</Badge>;
    case TimesheetStatus.REJECTED:
      return <Badge variant="danger">Rejected</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function PayPeriodStatusBadge({ status }: { status: string }) {
  switch (status) {
    case PayPeriodStatus.OPEN:
      return <Badge variant="success">Open</Badge>;
    case PayPeriodStatus.CLOSED:
      return <Badge variant="default">Closed</Badge>;
    case PayPeriodStatus.PROCESSING:
      return <Badge variant="navy">Processing</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
