import { ConfigService, AuthenticationService } from '../../../services';
import { Session, IncidentInformation, UnitAttachment, Note } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common'
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface SaveIncidentRequest {
  session: Session;
  incident: IncidentInformation;
}
interface Dictionary {
  [key: string]: boolean;
}

@Component({
  templateUrl: 'incidentedit.component.html',
  styleUrls: ['./incidentedit.css'],
  selector: 'incidentedit',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class IncidentEditComponent implements OnInit {

  @Input() incident: IncidentInformation | null = null;
  @Output() incidentClicked = new EventEmitter<number>();

  public currIncident: IncidentInformation | null = null;

  public incTypes: string[] = [];
  public dispTypes: string[] = [];

  public attachments: UnitAttachment[] = [];
  public notes: Note[] = [];

  public changeTrack: Dictionary = {};
  public overwriteTrack: Dictionary = {};

  private refreshTokenUnits: ReturnType<typeof setInterval> | undefined = undefined;
  private refreshTokenNotes: ReturnType<typeof setInterval> | undefined = undefined;


  //https://localhost:7208/API/Incidents/Incidents/get/inctypes
  //https://localhost:7208/API/Incidents/Incidents/get/dispotypes
  //https://localhost:7208/API/Units/Units/get/attachment/123
  //https://localhost:7208/API/Incidents/Incidents/get/incnotes/123
  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService, private http: HttpClient)
  {
    
  }

  oi(inc: number) {
    this.incidentClicked.emit(inc);
  }

  trackIncident(index: number, item: any) {
    return item.id;
  }

  time(date: Date | null): string {
    if (date == null || date == undefined) return '';
    const formatted = this.datepipe.transform(date, 'HH:mm');
    return formatted || "00:00:00";
  }

  get warningTime() {
    let dateWarn = new Date();
    dateWarn.setMinutes(dateWarn.getMinutes() - 10);
    return dateWarn;
  }

  get alertTime() {
    let dateWarn = new Date();
    dateWarn.setMinutes(dateWarn.getMinutes() - 15);
    return dateWarn;
  }

  ngOnInit(): void {
    this.currIncident = this.incident;
    this.getincTypes();
    this.getdispTypes();
    this.getUnits();
    this.getNotes();
    

    this.refreshTokenUnits = setInterval(() => this.getUnits(), 1000);
    this.refreshTokenNotes = setInterval(() => this.getNotes(), 1000);
  }

  ngOnChanges() {
    if (this.currIncident == null || this.incident == null) return;
    if (this.incident?.location_num == this.currIncident.location_num) return;

    this.currIncident.ts_arrival = this.incident.ts_arrival;
    this.currIncident.ts_complete = this.incident.ts_complete;
    this.currIncident.ts_dispatch = this.incident.ts_dispatch;
    this.currIncident.ts_opened = this.incident.ts_opened;

    console.log(this.currIncident);

    let changed = false;

    for (const key in this.incident) {

      if (key == "location_num" || key == "updated") continue;

      const aValue = this.currIncident[key as keyof IncidentInformation];
      const bValue = this.incident[key as keyof IncidentInformation];

      if (aValue instanceof Date && bValue instanceof Date) {

        if (aValue.getTime() !== bValue.getTime()) {
          if (this.isChanged(key)) {
            this.overwriteTrack[key] = true;
            changed = true;
          }
          else {
            (this.currIncident as any)[key] = bValue;
          }
        } else {
          this.overwriteTrack[key] = false;
          this.changeTrack[key] = false;
        }

      }
      else if (aValue !== bValue) {
        if (this.isChanged(key)) {
          this.overwriteTrack[key] = true;
          changed = true;
        }
        else {
          (this.currIncident as any)[key] = bValue;

        }
      } else {
        this.overwriteTrack[key] = false;
        this.changeTrack[key] = false;
      }

    }

    if (!changed) {
      this.currIncident.location_num = this.incident.location_num;
      console.log("updated lock token");
    }

  }

  getincTypes() {
    this.http.post<string[]>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/get/inctypes`, this.authService.getSession()).subscribe(
      (response) => {
        this.incTypes = response;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getdispTypes() {
    this.http.post<string[]>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/get/dispotypes`, this.authService.getSession()).subscribe(
      (response) => {
        this.dispTypes = response;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getUnits() {
    this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${this.currIncident?.incident_id}`, this.authService.getSession()).subscribe(
      (response) => {

        this.attachments = response.map(x => ({
          ...x,
          dispatch_time: x.dispatch_time ?new Date(x.dispatch_time) : null,
          ts_arrival: x.arrival_time ? new Date(x.arrival_time) : null,
          ts_opened: x.transport_time ? new Date(x.transport_time) : null,
          ts_complete: x.transportdone_time ? new Date(x.transportdone_time) : null
        }));
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getNotes() {
    this.http.post<Note[]>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/get/incnotes/${this.currIncident?.incident_id}`, this.authService.getSession()).subscribe(
      (response) => {

        this.notes = response.map(x => ({
          ...x,
          ts: new Date(x.ts)
        }));
      },
      (error) => {
        console.log(error);
      }
    );
  }

  changed(item: string, event?: Event) {
    if (this.currIncident == null || this.incident == null) return

    if (event?.target) {

      let value: any = (event.target as HTMLSelectElement).value;

      if (value == "null") {
        value = null;
        (this.currIncident as any)[item as keyof IncidentInformation] = null;
      }

      if (value == this.incident[item as keyof IncidentInformation]) {
        this.overwriteTrack[item] = false;
        this.changeTrack[item] = false;
      }
      else
        this.changeTrack[item] = true;

      return;
    }


    if ((this.currIncident[item as keyof IncidentInformation] == this.incident[item as keyof IncidentInformation])) {
      this.overwriteTrack[item] = false;
      this.changeTrack[item] = false;
    }
    else
      this.changeTrack[item] = true;
  }

  irreconcilable(item: string): boolean {
    if (this.currIncident == null || this.incident == null) return false

    return this.overwriteTrack[item] == true;
    //return this.isChanged(item) && (this.currIncident[item as keyof IncidentInformation] != this.incident[item as keyof IncidentInformation])
  }

  isChanged(item: string): boolean {
    if (this.currIncident == null || this.incident == null) return false

    return this.changeTrack[item] == true;
  }

  get hasChanges(): boolean {
    if (this.currIncident == null || this.incident == null) return false;

    for (var index in this.changeTrack) {
      if (this.changeTrack[index] == true) return true;
    }

    return false;
  }

  get hasOverwrites(): boolean {
    if (this.currIncident == null || this.incident == null) return false;

    for (var index in this.changeTrack) {
      if (this.overwriteTrack[index] == true) return true;
    }

    return false;
  }

  get attachedUnits() {
    return this.attachments.filter(u => u.cleared_time == null);
  }

  get clearedUnits() {
    return this.attachments.filter(u => u.cleared_time != null);
  }

  get isDispositioned() {
    return this.incident?.disposition != null && this.incident?.disposition != '';
  }

  get openedTS() {
    const formatted = this.datepipe.transform(this.currIncident?.ts_opened, 'HH:mm');
    return formatted || "--:--";
  }

  get dispatchedTS() {
    const formatted = this.datepipe.transform(this.currIncident?.ts_dispatch, 'HH:mm');
    return formatted || "--:--";
  }
  get osTS() {
    const formatted = this.datepipe.transform(this.currIncident?.ts_arrival, 'HH:mm');
    return formatted || "--:--";
  }
  get clTS() {
    const formatted = this.datepipe.transform(this.currIncident?.ts_complete, 'HH:mm');
    return formatted || "--:--";
  }

  close() {
    clearInterval(this.refreshTokenNotes);
    clearInterval(this.refreshTokenUnits);
    this.incidentClicked.emit(-1);
  }

}
