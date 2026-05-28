import { Component, OnInit } from '@angular/core';
import { ConfigService, AuthenticationService } from '../../../services';
import { Session } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common'

@Component({
  templateUrl: 'header.component.html',
  styleUrls: ['./header.css'],
  selector: 'apolloheader',
  standalone: true
})
export class HeaderComponent implements OnInit {

  public clockString: string = "00:00:00";

  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService)
  {
    setInterval(() => this.updateClock(), 1000);
  }

  ngOnInit(): void {
    
  }

  logout() {
    this.authService.logout();
  }

  updateClock() {
    const now = Date();
    const formatted = this.datepipe.transform(now, 'HH:mm:ss');
    this.clockString = formatted || "00:00:00";
  }

  get sysName() {
    return this.authService.getSession()?.sysName || "Unknown";
  }
  get loginName() {
    return this.authService.getSession()?.username || "Unknown";
  }
  get userName() {
    return this.authService.getSession()?.name || "Unknown";
  }
}
