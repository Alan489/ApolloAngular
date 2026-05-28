import { Component } from '@angular/core';
import { AuthenticationService, ConfigService } from '../services';
import { Session, UnitListing } from '../models';
import { HeaderComponent, UnitSideBarComponent, IncidentsDashboardComponent } from './components';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: 'dashboard.component.html',
  standalone: true,
  imports: [HeaderComponent, CommonModule, UnitSideBarComponent, IncidentsDashboardComponent],
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {

  public state: string = 'Dashboard'; //Dashboard, I(incID), U(unit),
  public units: UnitListing[] = [];
  public deb: boolean = false;

  constructor(private config: ConfigService, private authService: AuthenticationService, private http: HttpClient)
  {
    config.loadConfig().then(() => {
      this.loadData();
    });
    setInterval(() => this.loadData(), 1000);
  }

  loadData() {

    if (this.deb) return;
    this.deb = true;

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

  logout() {
    this.authService.logout();
  }

  unitClicked(unit: string) {
    console.log("I got the unit clicked: " + unit);
    this.state = 'U' + unit;
  }

}
