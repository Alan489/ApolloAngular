import { Component } from '@angular/core';
import { AuthenticationService, ConfigService } from '../services';
import { Session, UnitListing, IncidentInformation } from '../models';
import { HeaderComponent, UnitSideBarComponent, IncidentsDashboardComponent, IncidentEditComponent, NewIncidentComponent } from './components';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

interface IncResponse {
  errorMessage: Object;
  success: boolean;
  incidents: IncidentInformation[];
}

@Component({
  templateUrl: 'dashboard.component.html',
  standalone: true,
  imports: [HeaderComponent, CommonModule, UnitSideBarComponent, IncidentsDashboardComponent, IncidentEditComponent, NewIncidentComponent],
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {

  public state: string = 'Dashboard'; //Dashboard, I(incID), U(unit),
  public units: UnitListing[] = [];
  public incidents: IncidentInformation[] = [];
  public selectedIncident: IncidentInformation | null = null;
  public deb: boolean = false;
  public attachSubject: Subject<string> = new Subject<string>();



  constructor(private config: ConfigService, private authService: AuthenticationService, private http: HttpClient)
  {
    config.loadConfig().then(() => {
      this.loadData();
    });
    setInterval(() => this.loadData(), 1000);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  loadData() {

    if (this.deb) return;
    this.deb = true;

    this.http.post <IncResponse>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/get/active`, this.authService.getSession()).subscribe(
      (response) => {
        this.incidents = response.incidents.map(x => ({
          ...x,
          updated: new Date(x.updated),
          ts_arrival: x.ts_arrival ? new Date(x.ts_arrival) : null,
          ts_opened: x.ts_opened ? new Date(x.ts_opened) : null,
          ts_complete: x.ts_complete ? new Date(x.ts_complete) : null,
          ts_dispatch: x.ts_dispatch ? new Date(x.ts_dispatch) : null
        }));
        this.deb = false;
      },
      (error) => {
        console.log(error);
        this.deb = false;
      }
    );

    this.http.post<UnitListing[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/list`, this.authService.getSession()).subscribe(
      (response) => {
        this.units = response;
        this.deb = false;
      },
      (error) => {
        console.log(error);
        this.deb = false;
      }
    );
  }

  get incident() {
    if (this.state.startsWith('I')) {
      const incidentId = parseInt(this.state.substring(1), 10);
      return this.incidents.find(inc => inc.incident_id === incidentId) || null
    }
    return null;
  }

  logout() {
    this.authService.logout();
  }

  unitClicked(unit: string) {
    if (unit == '')
      this.state = 'Dashboard';
    else
      this.state = 'U' + unit;
  }

  incidentClicked(inc: number) {

    if (inc == -2) {
      this.state = 'NewIncident';
      return;
    }

    if (inc < 0)
      this.state = 'Dashboard';
    else
      this.state = 'I' + inc;
  }

  attachClicked(attach: string) {
    this.attachSubject.next(attach);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    
    if (isModifierPressed && event.key.toLowerCase() === 's') {
      event.preventDefault();

      
    }
  }

}
