import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ConfigService, AuthenticationService } from '../../../services';
import { Session, UnitListing, IncidentInformation } from '../../../models';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


interface UnitDetails {
  incident: IncidentInformation | null,
  personnel: string | null,
  role: string | null,
  status: string | null,
  type: string | null,
  unit: string | null,
  update_ts: Date | null
}

interface SaveUnitInterface {
  session: Session,
  unit: UnitDetails
}


@Component({
  templateUrl: 'newunit.component.html',
  styleUrls: ['./newunit.css'],
  selector: 'newunit',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NewUnitComponent implements OnInit {

  //https://localhost:7208/API/Units/Units/roles
  //https://localhost:7208/API/Units/Units/get/Wheelchair%20Portable
  //
  //https://localhost:7208/API/Units/Units/update/ {session,unit}
  //https://localhost:7208/API/Units/Units/new/

 
  /*
  incident:null
  personnel:""
  role:"Supervisor"
  status:"Out Of Service"
  type:"Unit"
  unit:"EMS1"
  update_ts:"2026-05-30T12:24:32"
  */

  @Output() unitClicked = new EventEmitter<string>();

  private detailedUnit: UnitDetails = {
    incident: null,
    personnel: null,
    role: null,
    status: null,
    type: null,
    unit: null,
    update_ts: null
  };

  public unit: string = '';
  public roles: string[] = [];
  public personnel: string = '';
  public role: string = '';
  public type: string = 'Unit'; //or Generic
  private deb: boolean = false;

  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService, private http: HttpClient)
  {
    
  }

  ngOnInit(): void {
    this.getRoles();
    window.addEventListener('keydown', this.keyDownHandler);
  }

  ngOnChanges(): void {
  }

  ngOnDestroy(): void{
    window.removeEventListener('keydown', this.keyDownHandler);
  }

  getRoles(): void {
    this.http.post<string[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/roles`, this.authService.getSession()).subscribe(
      (response) => {
        this.roles = response;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  //window.addEventListener('keydown', this.keyDownHandler);
  //window.removeEventListener('keydown', this.keyDownHandler);
  private keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  handleKeyDown(event: KeyboardEvent): void {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.saveUnit()
    }
  }

  saveUnit() {
    //https://localhost:7208/API/Units/Units/new/

    if (this.deb || this.unit == '' || this.type == '' || this.role == '') return;
    this.deb = true;

    let unitNew: UnitDetails = {
      incident: null,
      personnel: this.personnel,
      role: this.role,
      status: 'Out Of Service',
      type: this.type,
      unit: this.unit,
      update_ts: new Date()
    }

    let unitSave: SaveUnitInterface = {
      unit: unitNew,
      session: this.authService.getSession() as Session
    }

    this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/new/`, unitSave).subscribe(
      (response) => {
        this.unitClicked.emit(this.unit);
      },
      (error) => {
        console.log(error);
        this.deb = false;
      }
    );

  }

  close() {
    this.unitClicked.emit('');
  }
}
