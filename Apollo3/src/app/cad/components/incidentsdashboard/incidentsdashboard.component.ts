import { ConfigService, AuthenticationService } from '../../../services';
import { Session, IncidentInformation } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common'
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  templateUrl: 'incidentsdashboard.component.html',
  styleUrls: ['./incidentsdashboard.css'],
  selector: 'incidentsdashboard',
  standalone: true,
  imports: [CommonModule]
})
export class IncidentsDashboardComponent implements OnInit {

  @Input() incidents: IncidentInformation[] = [];
  @Output() incidentClicked = new EventEmitter<number>();

  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService)
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
    
  }

}
