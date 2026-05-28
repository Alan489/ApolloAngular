export interface IncidentInformation {
  alternate_cad: string | null;
  attachedUnits: string;
  call_details: string | null;
  call_number: string;
  call_type: string | null;
  contact_at: string | null;
  duplicate_of_incident_id: number;
  incident_id: number;
  incident_status: string | null;
  lat: number;
  log: number;
  location: string | null;
  location_num: string;
  reporting_pty: string | null;
  disposition: string | null;
  ts_arrival: Date | null;
  ts_opened: Date | null;
  ts_complete: Date | null;
  ts_dispatched: Date | null;
  unit_number: string | null;
  updated: Date;
}
