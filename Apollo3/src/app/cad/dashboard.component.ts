import { Component } from '@angular/core';
import { AuthenticationService } from '../services';
import { Session } from '../models';
import { HeaderComponent, UnitSideBarComponent, IncidentsDashboardComponent } from './components';
import { CommonModule } from '@angular/common';

@Component({
  templateUrl: 'dashboard.component.html',
  standalone: true,
  imports: [HeaderComponent, CommonModule, UnitSideBarComponent, IncidentsDashboardComponent],
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {

  public state: string = 'Dashboard'; //Dashboard, I(incID), U(unit), 

  constructor(private authService: AuthenticationService)
  {

  }

  logout() {
    this.authService.logout();
  }

}
