import { Component } from '@angular/core';
import { AuthenticationService, ConfigService } from '../services';
import { Session, UnitListing, IncidentInformation } from '../models';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface UnitInformation {
  personnel: string | null,
  role: string | null,
  status: string | null,
  type: string | null,
  unit: string | null,
  update_ts: Date | null,
  incident: IncidentInformation | null
}


@Component({
  templateUrl: 'board.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./board.css']
})
export class BoardComponent {
  private refreshToken: ReturnType<typeof setInterval> | undefined = undefined;
  private deb: boolean = false;
  public clockString: string = '00:00:00';

  public units: UnitInformation[] = []

  constructor(private config: ConfigService, public authService: AuthenticationService, private http: HttpClient, public datepipe: DatePipe, private router: Router)
  {
    config.loadConfig().then(() => {
      this.loadData();
    });
    this.refreshToken = setInterval(() => this.loadData(), 1000);
    
  }

  trackIncident(index: number, item: any) {
    return item.unit;
  }
  loadData() {

    const now = Date();
    const formatted = this.datepipe.transform(now, 'HH:mm:ss');
    this.clockString = formatted || "00:00:00";

    if (this.deb) return;
    this.deb = true;

    //API/Units/Units/getAllDetails/
    this.http.post<UnitInformation[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/getAllDetails`, this.authService.getSession()).subscribe(
      (response) => {
        
        this.deb = false;
        this.units = response;
      },
      (error) => {
        console.log(error);
        this.deb = false;
        if (error.status == 401)
          this.authService.logout();
      }
    );

    /*
    //API/Incidents/Incidents/get/paging/all/
    this.http.post<UnitListing[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/list`, this.authService.getSession()).subscribe(
      (response) => {
        this.deb = false;
      },
      (error) => {
        console.log(error);
        this.deb = false;
        if (error.status == 401)
          this.authService.logout();
      }
    );*/
  }

  get unitunits() {
    return this.units.filter(u => u.type == 'Unit' && u.status != 'Out Of Service');
  }

  ngOnDestroy() {
    clearInterval(this.refreshToken);
  }


  logout() {
    this.authService.logout();
  }

  get sysname(): string{
    return this.authService.getSession()?.sysName ?? '???'
  }

}
