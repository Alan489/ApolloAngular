import { ConfigService, AuthenticationService } from '../../../services';
import { Session, IncidentInformation, UnitAttachment, Note } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common'
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

interface NotePost {
  creator: null,
  message: string,
  sess: Session,
  ts: Date,
  unit: string
}
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
  @Input() attachSubject: Observable<string> = new Observable<string>();

  public currIncident: IncidentInformation | null = null;

  public incTypes: string[] = [];
  public dispTypes: string[] = [];
  public dispUnitTypes: string[] = [];

  public dispositioning: Record<string, string> = {}
;

  public attachments: UnitAttachment[] = [];
  public notes: Note[] = [];

  public changeTrack: Dictionary = {};
  public overwriteTrack: Dictionary = {};

  private refreshTokenUnits: ReturnType<typeof setInterval> | undefined = undefined;
  private refreshTokenNotes: ReturnType<typeof setInterval> | undefined = undefined;

  private attachSubscription: Subscription = new Subscription();

  private noteDeb: boolean = false;
  public noteInput: string = '';



  //https://localhost:7208/API/Incidents/Incidents/get/inctypes
  //https://localhost:7208/API/Incidents/Incidents/get/dispotypes
  //https://localhost:7208/API/Units/Units/get/attachment/123
  //https://localhost:7208/API/Incidents/Incidents/get/incnotes/123
  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService, private http: HttpClient)
  {
    
  }

  ngOnInit(): void {
    this.currIncident = this.incident;
    this.getincTypes();
    this.getdispTypes();
    this.getunitDispTypes();
    this.getUnits();
    this.getNotes();
    
    this.attachSubscription = this.attachSubject.subscribe((str) => this.attach(str));

    this.refreshTokenUnits = setInterval(() => this.getUnits(), 1000);
    this.refreshTokenNotes = setInterval(() => this.getNotes(), 1000);
    window.addEventListener('keydown', this.keyDownHandler);
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


  ngOnChanges() {
    if (this.incident == null) return;

    if (this.currIncident == null)
     this.currIncident = this.incident;

    this.currIncident.ts_arrival = this.incident.ts_arrival;
    this.currIncident.ts_complete = this.incident.ts_complete;
    this.currIncident.ts_dispatch = this.incident.ts_dispatch;
    this.currIncident.ts_opened = this.incident.ts_opened;

    if (this.incident?.location_num == this.currIncident.location_num) return;
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
    }

  }

  ngOnDestroy() {
    clearInterval(this.refreshTokenNotes);
    clearInterval(this.refreshTokenUnits);
    this.attachSubscription.unsubscribe();
    window.removeEventListener('keydown', this.keyDownHandler);
  }

  //window.addEventListener('keydown', this.keyDownHandler);
  //window.removeEventListener('keydown', this.keyDownHandler);
  private keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  handleKeyDown(event: KeyboardEvent): void {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      const inputElement = document.querySelector('#loginput') as HTMLInputElement | null;
      if (inputElement) {
        inputElement.focus();
      }
    }

    if (isModifierPressed && event.key.toLowerCase() === 'g') {
      event.preventDefault();
      this.googleTheAddress();
    }


    if (isModifierPressed && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.hasChanges)
        if (this.hasOverwrites)
          this.forceSave()
        else
          this.save()
    }
  }

  attach(unit: string) {
    //https://localhost:7208/API/Units/Units/new/attachment/123/134Y
    //https://localhost:7208/API/Incidents/Incidents/post/timestamp/dp/125

    if (this.attachedUnits.filter(u => u.unit == unit).length > 0 || this.isDispositioned) return;

    this.attachments.push({
      unit: unit,
      dispatch_time: new Date(),
      attachmentID: "-1",
      arrival_time: null,
      transport_time: null,
      transportdone_time: null,
      cleared_time: null,
      color: '',
      unit_disposition: null
    });

    if (this.currIncident) {
      this.currIncident.disposition = null;
      this.changed("disposition");
    }

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/new/attachment/${this.currIncident?.incident_id}/${unit}`, this.authService.getSession()).subscribe(
      (response) => {
        
      },
      (error) => {
        console.log(error);
      }
    );

    if (this.incident?.ts_dispatch == null) {
      this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/timestamp/dp/${this.currIncident?.incident_id}`, this.authService.getSession()).subscribe(
        (response) => {
          
        },
        (error) => {
          console.log(error);
        }
      );
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

  getunitDispTypes() {
    this.http.post<string[]>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/get/dispounittypes`, this.authService.getSession()).subscribe(
      (response) => {
        this.dispUnitTypes = response;
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
          dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
          arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
          transport_time: x.transport_time ? new Date(x.transport_time) : null,
          transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
          cleared_time: x.cleared_time ? new Date(x.cleared_time) : null,
          unit_disposition: x.unit_disposition ?? 'NULL'
        }));

        this.attachments.forEach(a => {
          if (this.dispositioning[a.unit] == null && a.cleared_time == null) {
            this.dispositioning[a.unit] = 'NULL';
          }
        });

        if (this.currIncident && this.attachedUnits.length > 0) {
          this.currIncident.disposition = null;
          this.changed("disposition");
        }

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
        })).reverse();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  googleTheAddress() {
    if (this.currIncident == null) return;
   

    this.http.post<any>(`https://maps.googleapis.com/maps/api/geocode/json?key=${this.authService.getSession()?.googleLink}&address=${this.currIncident.location}`, null).subscribe(
      (response) => {
        if (response.results && (response.results as any[]).length == 1 && this.currIncident) {
          this.currIncident.location = (response.results[0].formatted_address as string).replace(', USA', '');
          this.changed('location');
          this.currIncident.lat = response.results[0].geometry.location.lat
          this.currIncident.log = response.results[0].geometry.location.lng
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  save() {
    //https://localhost:7208/API/Incidents/Incidents/post/save

    if (this.authService.getSession() == null) return;

    if (this.incident?.disposition != null && this.incident?.disposition != '')
      return;

    if (this.currIncident?.disposition != null && this.currIncident?.disposition != '') {
      this.currIncident.ts_complete = new Date();
    }

    let sir: SaveIncidentRequest = {
      session: this.authService.getSession() as Session,
      incident: this.currIncident as IncidentInformation
    }
    this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/save`, sir).subscribe(
      (response) => {
      },
      (error) => {
        console.log(error);
      }
    );
  }

  saveClose() {
    //https://localhost:7208/API/Incidents/Incidents/post/save

    if (this.authService.getSession() == null) return;

    if (this.incident?.disposition != null && this.incident?.disposition != '')
      return;

    if (this.currIncident?.disposition != null && this.currIncident?.disposition != '') {
      this.currIncident.ts_complete = new Date();
    }

    let sir: SaveIncidentRequest = {
      session: this.authService.getSession() as Session,
      incident: this.currIncident as IncidentInformation
    }
    this.http.post<string>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/save`, sir).subscribe(
      (response) => {
        this.incidentClicked.emit(-1);
        console.log('???');
      },
      (error) => {
        this.incidentClicked.emit(-1);
        console.log(error);
      }
    );
  }

  forceSave() {
    //https://localhost:7208/API/Incidents/Incidents/post/save
    if (this.authService.getSession() == null || this.currIncident == null || this.incident == null) return;

    this.currIncident.location_num = this.incident.location_num;

    if (this.authService.getSession() == null) return;

    if (this.incident?.disposition != null && this.incident?.disposition != '')
      return;

    if (this.currIncident?.disposition != null && this.currIncident?.disposition != '') {
      this.currIncident.ts_complete = new Date();
    }

    let sir: SaveIncidentRequest = {
      session: this.authService.getSession() as Session,
      incident: this.currIncident as IncidentInformation
    }
    this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/save`, sir).subscribe(
      (response) => {
      },
      (error) => {
        console.log(error);
      }
    );
  }

  postMessage() {
    if (this.noteDeb || this.noteInput.trim() == '') return;
    this.noteDeb = true;
    //https://localhost:7208/API/Incidents/Incidents/post/incnotes/127

    let message = this.noteInput.trim();

    if (this.noteInput.startsWith('/') && this.config.shorthands[this.noteInput.substring(1).toLowerCase()]) {
      message = this.config.shorthands[this.noteInput.substring(1).toLowerCase()];
    }

    let np: NotePost = {
      creator: null,
      message: message,
      sess: this.authService.getSession() as Session,
      ts: new Date(),
      unit: ''
    }
    this.noteInput = '';
    this.noteDeb = false;

    this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/incnotes/${this.currIncident?.incident_id}`, np).subscribe(
      (response) => {
        
        
      },
      (error) => {
        console.log(error);
      }
    );

    const inputElement = document.querySelector('#loginput') as HTMLInputElement | null;
    if (inputElement) {
      inputElement.focus();
    }


  }

  applyShorthand(key: string) {
    this.noteInput = "/" + key;
    this.postMessage();
  }

  trackAttachment(index: number, item: any) {
    return item.attachmentID;
  }

  getFormattedTS(date: Date | null) {
    const formatted = this.datepipe.transform(date, 'HH:mm');
    return formatted || "--:--";
  }

  close() {
    
    this.incidentClicked.emit(-1);
  }

  irreconcilable(item: string): boolean {
    if (this.currIncident == null || this.incident == null) return false

    return this.overwriteTrack[item] == true;
    //return this.isChanged(item) && (this.currIncident[item as keyof IncidentInformation] != this.incident[item as keyof IncidentInformation])
  }

  changed(item: string, event?: Event) {
    if (this.currIncident == null || this.incident == null) return

    

    if (event?.target) {

      if (((event.target as HTMLSelectElement).value == 'null' || (event.target as HTMLSelectElement).value == null) && ((this.incident as any)[item as keyof IncidentInformation] == '' || (this.incident as any)[item as keyof IncidentInformation] == null)) {
          this.overwriteTrack[item] = false;
          this.changeTrack[item] = false;
        }
      let value: any = (event.target as HTMLSelectElement).value;

      if (value == "null") {
        value = null;
        (this.currIncident as any)[item as keyof IncidentInformation] = '';
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

  isChanged(item: string): boolean {
    if (this.currIncident == null || this.incident == null) return false

    return this.changeTrack[item] == true;
  }

  OS(attachment: UnitAttachment) {
    //https://localhost:7208/API/Units/Units/post/attachment/431/arrived
    //https://localhost:7208/API/Incidents/Incidents/post/timestamp/os/124

    attachment.arrival_time = new Date();

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/arrived`, this.authService.getSession()).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);
      }
    );


    if (this.incident?.ts_arrival == null) {
      this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/timestamp/os/${this.currIncident?.incident_id}`, this.authService.getSession()).subscribe(
        (response) => {

        },
        (error) => {
          console.log(error);
        }
      );
    }
  }

  ENR(attachment: UnitAttachment) {
    //https://localhost:7208/API/Units/Units/post/attachment/431/transport

    attachment.transport_time = new Date();

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/transport`, this.authService.getSession()).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);
      }
    );
  }

  ARR(attachment: UnitAttachment) {
    //https://localhost:7208/API/Units/Units/post/attachment/431/transportdone

    attachment.transportdone_time = new Date();

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/transportdone`, this.authService.getSession()).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);
      }
    );
  }

  CLR(attachment: UnitAttachment) {
    //https://localhost:7208/API/Units/Units/post/attachment/431/cleared

    if (this.dispositioning[attachment.unit] == null || this.dispositioning[attachment.unit] == 'NULL') return;

    attachment.cleared_time = new Date();
    attachment.unit_disposition = this.dispositioning[attachment.unit];

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/cleared/${this.dispositioning[attachment.unit].replaceAll('/', '|')}`, this.authService.getSession()).subscribe(
      (response) => {
        this.dispositioning[attachment.unit] = 'NULL';
      },
      (error) => {
        console.log(error);
      }
    );
  }

  get shorthands() {

    const entries = Object.entries(this.config.shorthands) as [string, string][];

    const keyMatches = entries.filter(([key]) =>
      key.toLowerCase().startsWith(this.noteInput.toLowerCase().substring(1))
    );

    const valMatches = entries.filter(([key, value]) =>
      !key.toLowerCase().startsWith(this.noteInput.toLowerCase().substring(1)) &&
      value.toLowerCase().includes(this.noteInput.toLowerCase().substring(1))
    );


    return Object.fromEntries([
      ...keyMatches,
      ...valMatches
    ]);
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
    return this.incident == null || (this.incident?.disposition != null && this.incident?.disposition != '') || (this.currIncident?.disposition != null && this.currIncident?.disposition != '' && this.currIncident?.disposition != 'null');
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
  get filteredNotes() {
    return this.notes.filter(n => !n.message.startsWith('UPDATED INCIDENT') && n.message != 'On Scene' && n.message != 'Dispatched' && n.message != 'In Service' && n.message != 'Transporting' && n.message != 'Arrived' && !n.message.startsWith('Cleared Unit From Scene with Disposition'));
  }
}
