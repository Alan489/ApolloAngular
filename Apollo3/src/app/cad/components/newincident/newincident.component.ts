import { ConfigService, AuthenticationService } from '../../../services';
import { Session, IncidentInformation, UnitAttachment, Note } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common'
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

interface SaveIncidentRequest {
  session: Session;
  incident: IncidentInformation;
}
interface Dictionary {
  [key: string]: boolean;
}

@Component({
  templateUrl: 'newincident.component.html',
  styleUrls: ['./newincident.css'],
  selector: 'newincident',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NewIncidentComponent implements OnInit {

  public currIncident: IncidentInformation | null = null;
  @Output() incidentClicked = new EventEmitter<number>();

  public incTypes: string[] = [];



  //https://localhost:7208/API/Incidents/Incidents/get/inctypes
  //https://localhost:7208/API/Incidents/Incidents/get/dispotypes
  //https://localhost:7208/API/Units/Units/get/attachment/123
  //https://localhost:7208/API/Incidents/Incidents/get/incnotes/123
  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService, private http: HttpClient)
  {
    this.currIncident = {} as IncidentInformation;
  }

  ngOnInit(): void {
    this.getincTypes();
  }


  ngOnChanges() {
    

  }

  ngOnDestroy() {
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


  save() {
    //https://localhost:7208/API/Incidents/Incidents/post/save
    //https://localhost:7208/API/Incidents/Incidents/post/new

    if (this.authService.getSession() == null) return;

    if (this.currIncident?.disposition != null && this.currIncident?.disposition != '') {
      this.currIncident.ts_complete = new Date();
    }

    let sir: SaveIncidentRequest = {
      session: this.authService.getSession() as Session,
      incident: this.currIncident as IncidentInformation
    }
    this.http.post <IncidentInformation>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/new`, sir).subscribe(
      (response) => {
        this.incidentClicked.emit(response.incident_id);
      },
      (error) => {
        console.log(error);
      }
    );
  }

  saveClose() {
    //https://localhost:7208/API/Incidents/Incidents/post/save

    if (this.authService.getSession() == null) return;

    if (this.currIncident?.disposition != null && this.currIncident?.disposition != '') {
      this.currIncident.ts_complete = new Date();
    }

    let sir: SaveIncidentRequest = {
      session: this.authService.getSession() as Session,
      incident: this.currIncident as IncidentInformation
    }
    this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/save`, sir).subscribe(
      (response) => {
        this.incidentClicked.emit(-1);
      },
      (error) => {
        console.log(error);
      }
    );
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
  

}
