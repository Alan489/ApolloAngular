import { Component } from '@angular/core';
import { AuthenticationService, ConfigService } from '../../../services';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface IncidentType {
  type: string,
  active: string
}


@Component({
  templateUrl: 'incidenttypes.component.html',
  standalone: true,
  selector: 'incidenttypes',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./incidenttypes.css']
})
export class IncidentTypesComponent {

  private deb: boolean = false;
  private refreshToken: ReturnType<typeof setInterval> | undefined = undefined;
  public dispos: IncidentType[] = [];
  public newDispo: string = '';

  constructor(private config: ConfigService, private authService: AuthenticationService, private http: HttpClient, private router: Router)
  {
    config.loadConfig().then(() => {
      this.loadData();
    });
    //this.refreshToken = setInterval(() => this.loadData(), 1000);
    //window.addEventListener('keydown', this.keyDownHandler);
    
  }

  //V API/Incidents/Incidents/get/dispotypes/modification
  //V API/Incidents/Incidents/modify/dispotypes/Standby+Event/Y
  //V API/Incidents/Incidents/create/dispotypes/TEST

  loadData() {

    if (this.deb) return;
    this.deb = true;

    this.http.post<IncidentType[]>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/get/inctypes/modification`, this.authService.getSession()).subscribe(
      (response) => {
        this.dispos = response;
        this.deb = false;
      },
      (error) => {
        this.deb = false;
        console.log(error);
      }
    );

  }

  createDisposition() {
    if (this.newDispo.trim() === '') return;
    const newD: string = this.newDispo.trim().replaceAll('/', '|');
    this.newDispo = '';

    this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/create/inctypes/${newD}`, this.authService.getSession()).subscribe(
      (response) => {
        this.dispos.push({ type: newD, active: 'Y' });
      },
      (error) => {
        console.log(error);
      }
    );

  }

  switchDisposition(dispo: IncidentType) {
    if (dispo.active == 'Y')
      this.setDispositionInactive(dispo.type);
    else
      this.setDispositionActive(dispo.type);
  }

  setDispositionInactive(dispo: string) {
    if (dispo.trim() === '') return;

    this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/modify/inctypes/${dispo.replaceAll('/', '|') }/N`, this.authService.getSession()).subscribe(
      (response) => {
        const dispoObj: IncidentType | null = this.dispos.find(d => d.type === dispo) ?? null;
        if (dispoObj == null) return;
        dispoObj.active = 'N';
      },
      (error) => {
        console.log(error);
      }
    );

  }

  setDispositionActive(dispo: string) {
    if (dispo.trim() === '') return;

    this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/modify/inctypes/${dispo.replaceAll('/', '|') }/Y`, this.authService.getSession()).subscribe(
      (response) => {
        const dispoObj: IncidentType | null = this.dispos.find(d => d.type === dispo) ?? null;
        if (dispoObj == null) return;
        dispoObj.active = 'Y';
      },
      (error) => {
        console.log(error);
      }
    );

  }

  trackIncident(index: number, item: any) {
    return item.type;
  }

  ngOnDestroy() {
    //clearInterval(this.refreshToken);
    //window.removeEventListener('keydown', this.keyDownHandler);
  }

  get accessLevel() {
    return this.authService.getSession()?.accessLevel ?? 0;
  }

  logout() {
    this.authService.logout();
  }

  private keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  handleKeyDown(event: KeyboardEvent): void {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.key.toLowerCase() === 'e') {
      event.preventDefault();
    }
    
    if (isModifierPressed && event.key.toLowerCase() === 's') {
      event.preventDefault();
      
    }
  }



}
