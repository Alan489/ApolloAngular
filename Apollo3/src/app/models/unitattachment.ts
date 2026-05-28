export interface UnitAttachment {
  attachmentID: string;
  unit: string;
  dispatch_time: Date | null;
  arrival_time: Date | null;
  transport_time: Date | null;
  transportdone_time: Date | null;
  cleared_time: Date | null;
  color: string;
}
