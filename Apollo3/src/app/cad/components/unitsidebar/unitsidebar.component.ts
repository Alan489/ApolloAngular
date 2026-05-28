import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ConfigService, AuthenticationService } from '../../../services';
import { HttpClient } from '@angular/common/http';
import { Session, UnitListing } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common'

@Component({
  templateUrl: 'unitsidebar.component.html',
  styleUrls: ['./unitsidebar.css'],
  selector: 'unitsidebar',
  standalone: true,
  imports: [CommonModule]
})
export class UnitSideBarComponent implements OnInit {

  public loading: boolean = true;
  public deb: boolean = false;
  @Input() units: UnitListing[] = [];
  

  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService, private http: HttpClient)
  {
    
  }

  ngOnInit(): void {
    
  }


  get inServiceIndividual() {
    return this.units.filter(u => u.type != 'Generic' && u.status != 'Out Of Service');
  }

  get outServiceIndividual() {
    return this.units.filter(u => u.type != 'Generic' && u.status == 'Out Of Service');
  }

  outService(unit: string) {
    let u: UnitListing | undefined = this.units.find(u => u.unit == unit);

    if (u == undefined || u == null)
      return;

    u.status = 'Out Of Service';

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/status/${u.unit}/0`, this.authService.getSession()).subscribe(
      (response) => {
      },
      (error) => {
        console.log(error);
      }
    );
  }

  inService(unit: string) {
    let u: UnitListing | undefined = this.units.find(u => u.unit == unit);

    if (u == undefined || u == null)
      return;

    u.status = 'In Service';

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/status/${u.unit}/2`, this.authService.getSession()).subscribe(
      (response) => {
      },
      (error) => {
        console.log(error);
      }
    );
  }

  busy(unit: string) {
    let u: UnitListing | undefined = this.units.find(u => u.unit == unit);

    if (u == undefined || u == null)
      return;

    u.status = 'Busy';

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/status/${u.unit}/1`, this.authService.getSession()).subscribe(
      (response) => {
      },
      (error) => {
        console.log(error);
      }
    );
  }

  @Output() unitClicked = new EventEmitter<string>();

  clicked(unit: string) {
    console.log('clicky:' + unit);
    this.unitClicked.emit(unit);
  }

}
