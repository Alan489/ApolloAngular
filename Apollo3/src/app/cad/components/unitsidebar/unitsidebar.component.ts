import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ConfigService, AuthenticationService } from '../../../services';
import { HttpClient } from '@angular/common/http';
import { Session, UnitListing } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms';

@Component({
  templateUrl: 'unitsidebar.component.html',
  styleUrls: ['./unitsidebar.css'],
  selector: 'unitsidebar',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class UnitSideBarComponent implements OnInit {

  public loading: boolean = true;
  public deb: boolean = false;
  public search: string = '';

  @Input() units: UnitListing[] = [];
  @Input() state: string = '';

  @Output() unitClicked = new EventEmitter<string>();
  @Output() incidentClicked = new EventEmitter<number>();
  @Output() attachClicked = new EventEmitter<string>();
  

  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService, private http: HttpClient)
  {
    
  }

  ngOnInit(): void {
    
  }

  trackUnit(index: number, item: any) {
    return item.id;
  }

  get busyUnits() {
    return this.units.filter(u => u.type != 'Generic' && u.status != 'In Service' && !(this.search != '' && !u.unit.toLowerCase().includes(this.search.toLowerCase())));
  }

  get availableUnits() {
    return this.units.filter(u => u.type != 'Generic' && u.status == 'In Service' && !(this.search != '' && !u.unit.toLowerCase().includes(this.search.toLowerCase())));
  }

  get genericUnits() {
    return this.units.filter(u => u.type == 'Generic' && !(this.search != '' && !u.unit.toLowerCase().includes(this.search.toLowerCase())));
  }

  get inServiceIndividual() {
    return this.units.filter(u => u.type != 'Generic' && u.status != 'Out Of Service' && !(this.search != '' && !u.unit.toLowerCase().includes(this.search.toLowerCase())));
  }

  get outServiceIndividual() {
    return this.units.filter(u => u.type != 'Generic' && u.status == 'Out Of Service' && !(this.search != '' && !u.unit.toLowerCase().includes(this.search.toLowerCase())));
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

  clicked(unit: string) {
    this.search = '';
    this.unitClicked.emit(unit);
  }

  attach(unit: string) {
    this.search = '';
    this.attachClicked.emit(unit);
  }

  incident(incID: number) {
    this.search = '';
    this.incidentClicked.emit(incID);
  }

}
