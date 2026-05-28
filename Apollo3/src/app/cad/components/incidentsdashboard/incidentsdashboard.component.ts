import { Component, OnInit } from '@angular/core';
import { ConfigService, AuthenticationService } from '../../../services';
import { Session } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common'

@Component({
  templateUrl: 'incidentsdashboard.component.html',
  styleUrls: ['./incidentsdashboard.css'],
  selector: 'incidentsdashboard',
  standalone: true
})
export class IncidentsDashboardComponent implements OnInit {

  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService)
  {
    
  }

  ngOnInit(): void {
    
  }

}
