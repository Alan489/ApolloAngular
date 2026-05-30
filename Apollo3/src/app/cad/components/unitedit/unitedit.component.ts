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
  templateUrl: 'unitedit.component.html',
  styleUrls: ['./unitedit.css'],
  selector: 'unitedit',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class UnitEditComponent implements OnInit {

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

  @Input() unitListing: UnitListing | null = null;
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

  constructor(private config: ConfigService, private router: Router, public datepipe: DatePipe, private authService: AuthenticationService, private http: HttpClient)
  {
    
  }

  ngOnInit(): void {
    this.getUnitDetails();
    this.getRoles();
    this.role = this.unitListing?.role ?? '';
    this.unit = this.unitListing?.unit ?? '';
    window.addEventListener('keydown', this.keyDownHandler);
  }

  ngOnChanges(): void {
    if (this.unit == this.unitListing?.unit)
      return;

    this.unit = this.unitListing?.unit ?? '';
    this.getUnitDetails();
    this.role = this.unitListing?.role ?? '';
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.keyDownHandler);
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

  getUnitDetails() {
    this.http.post<UnitDetails>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/${this.unitListing?.unit}`, this.authService.getSession()).subscribe(
      (response) => {
        this.detailedUnit = response;
        this.role = response.role ?? '';
        this.personnel = response.personnel ?? '';
        console.log(this.role);
      },
      (error) => {
        console.log(error);
      }
    );
  }

  saveUnit() {
    this.http.post<UnitDetails>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/${this.unitListing?.unit}`, this.authService.getSession()).subscribe(
      (response) => {
        if (response.status == "Attached to Incident") {
          return;
        }
        response.personnel = this.personnel;
        response.role = this.role;
        response.update_ts = new Date();

        let unitSave: SaveUnitInterface = {
          unit: response,
          session: this.authService.getSession() as Session
        }

        this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/update/`, unitSave).subscribe(
          (response) => {
          },
          (error) => {
            console.log(error);
          }
        );

      },
      (error) => {
        console.log(error);
      }
    );
  }

  close() {
    this.unitClicked.emit('');
  }

  get isAttached(): boolean {
    return (this.unitListing?.status == "Attached to Incident") || (this.detailedUnit.status == "Attached to Incident");
  }
}
