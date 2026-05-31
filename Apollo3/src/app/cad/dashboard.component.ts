import { Component } from '@angular/core';
import { AuthenticationService, ConfigService } from '../services';
import { Session, UnitListing, IncidentInformation, UnitAttachment } from '../models';
import { HeaderComponent, UnitSideBarComponent, IncidentsDashboardComponent, IncidentEditComponent, NewIncidentComponent, UnitEditComponent, NewUnitComponent } from './components';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface IncResponse {
  errorMessage: Object;
  success: boolean;
  incidents: IncidentInformation[];
}

interface NotePost {
  creator: null,
  message: string,
  sess: Session,
  ts: Date,
  unit: string
}

@Component({
  templateUrl: 'dashboard.component.html',
  standalone: true,
  imports: [HeaderComponent, CommonModule, UnitSideBarComponent, IncidentsDashboardComponent, IncidentEditComponent, NewIncidentComponent, UnitEditComponent, NewUnitComponent, FormsModule],
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {

  public state: string = 'Dashboard'; //Dashboard, I(incID), U(unit),
  public units: UnitListing[] = [];
  public incidents: IncidentInformation[] = [];
  public selectedIncident: IncidentInformation | null = null;
  public deb: boolean = false;
  public attachSubject: Subject<string> = new Subject<string>();
  public command: string = '';
  private refreshToken: ReturnType<typeof setInterval> | undefined = undefined;

  

  constructor(private config: ConfigService, private authService: AuthenticationService, private http: HttpClient, private router: Router)
  {
    config.loadConfig().then(() => {
      this.loadData();
    });
    this.refreshToken = setInterval(() => this.loadData(), 1000);
    window.addEventListener('keydown', this.keyDownHandler);
    
  }

  get accessLevel() {
    return this.authService.getSession()?.accessLevel ?? 0;
  }

  gotoUsers() {
    this.router.navigate(['/users']);
  }

  gotoSystem() {
    this.router.navigate(['/system']);
  }

  loadData() {

    if (this.deb) return;
    this.deb = true;

    this.http.post <IncResponse>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/get/active`, this.authService.getSession()).subscribe(
      (response) => {
        this.incidents = response.incidents.map(x => ({
          ...x,
          updated: new Date(x.updated),
          ts_arrival: x.ts_arrival ? new Date(x.ts_arrival) : null,
          ts_opened: x.ts_opened ? new Date(x.ts_opened) : null,
          ts_complete: x.ts_complete ? new Date(x.ts_complete) : null,
          ts_dispatch: x.ts_dispatch ? new Date(x.ts_dispatch) : null
        }));
        this.deb = false;
      },
      (error) => {
        console.log(error);
        this.deb = false;
      }
    );

    this.http.post<UnitListing[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/list`, this.authService.getSession()).subscribe(
      (response) => {
        this.units = response;
        this.deb = false;
      },
      (error) => {
        console.log(error);
        this.deb = false;
        if (error.status == 401)
          this.authService.logout();
      }
    );
  }

  ngOnDestroy() {
    clearInterval(this.refreshToken);
    window.removeEventListener('keydown', this.keyDownHandler);
  }

  get incident() {
    if (this.state.startsWith('I')) {
      const incidentId = parseInt(this.state.substring(1), 10);
      return this.incidents.find(inc => inc.incident_id === incidentId) || null
    }
    return null;
  }

  logout() {
    this.authService.logout();
  }

  unitClicked(unit: string) {

    if (unit == '!-New') {
      this.state = 'NewUnit';
      return;
    }

    if (unit == '')
      this.state = 'Dashboard';
    else
      this.state = 'U' + unit;
  }

  incidentClicked(inc: number) {

    if (inc == -2) {
      this.state = 'NewIncident';
      return;
    }

    if (inc < 0)
      this.state = 'Dashboard';
    else
      this.state = 'I' + inc;
  }

  attachClicked(attach: string) {
    this.attachSubject.next(attach);
  }

  submitCommand() {
    if (this.command.trim() == '') return;

    const command: string = this.command.trim();
    const normalized: string = command.toLowerCase();
    const commandSplit: string[] = command.split(' ');
    const commandSplitNormalized: string[] = normalized.split(' ');

    if (normalized == 'dash' || normalized == 'dashboard' || normalized == 'd' || normalized == 'exit' || normalized == 'x') {
      this.state = 'Dashboard';
      this.command = '';
      return;
    }

    if (normalized == 'new') {
      this.state = 'NewIncident';
      this.command = '';
      return;
    }

    //Handle Unit Commands
    if (normalized.startsWith('u')) {
      
      const targetUnit = this.units.find(u => u.unit.toLowerCase().endsWith(commandSplitNormalized[0].substring(1)));
      if (targetUnit == null) return;

      //Open Unit
      if (commandSplitNormalized.length == 1) {
        this.unitClicked(targetUnit.unit);
        this.command = '';
        return;
      }
      //Open Unit End

      //Single param commands
      if (commandSplitNormalized.length == 2) {

        if (commandSplitNormalized[1] == 'i') {

          if (targetUnit.attachment) {
            const oi = this.incidents.find(i => i.incident_id == targetUnit.incID)
            if (oi)
              this.incidentClicked(oi.incident_id);
            this.command = '';
          }

          return;

        }//Open incident end

        if (commandSplitNormalized[1] == 'os') {
          if (targetUnit.attachment) {

            const oi = this.incidents.find(i => i.incident_id == targetUnit.incID)
            if (oi == null) {
              this.command = '';
              return;
            }
            this.command = '';

            this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${oi.incident_id}`, this.authService.getSession()).subscribe(
              (response) => {

                const attachments = response.map(x => ({
                  ...x,
                  dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
                  arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
                  transport_time: x.transport_time ? new Date(x.transport_time) : null,
                  transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
                  cleared_time: x.cleared_time ? new Date(x.cleared_time) : null
                }));

                const attachment = attachments.find(a => a.unit == targetUnit.unit && a.cleared_time == null);

                if (attachment == null) {
                  return;
                }

                if (attachment.arrival_time != null) return;

                attachment.arrival_time = new Date();

                this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/arrived`, this.authService.getSession()).subscribe(
                  (response) => {

                  },
                  (error) => {
                    console.log(error);
                  }
                );


                if (oi.ts_arrival == null) {
                  this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/timestamp/os/${oi.incident_id}`, this.authService.getSession()).subscribe(
                    (response) => {

                    },
                    (error) => {
                      console.log(error);
                    }
                  );
                }


              },
              (error) => {
                console.log(error);
              }
            );

          }

          return;

        }//End mark on scene

        if (commandSplitNormalized[1] == 'enr' || commandSplitNormalized[1] == 'er') {
          if (targetUnit.attachment) {

            const oi = this.incidents.find(i => i.incident_id == targetUnit.incID)
            if (oi == null) {
              this.command = '';
              return;
            }
            this.command = '';

            this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${oi.incident_id}`, this.authService.getSession()).subscribe(
              (response) => {

                const attachments = response.map(x => ({
                  ...x,
                  dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
                  arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
                  transport_time: x.transport_time ? new Date(x.transport_time) : null,
                  transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
                  cleared_time: x.cleared_time ? new Date(x.cleared_time) : null
                }));

                const attachment = attachments.find(a => a.unit == targetUnit.unit && a.cleared_time == null);

                if (attachment == null) {
                  return;
                }

                if (attachment.transport_time != null) return;
                

                this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/transport`, this.authService.getSession()).subscribe(
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

          return;

        }//End mark enr

        if (commandSplitNormalized[1] == 'arr') {
          if (targetUnit.attachment) {

            const oi = this.incidents.find(i => i.incident_id == targetUnit.incID)
            if (oi == null) {
              this.command = '';
              return;
            }
            this.command = '';

            this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${oi.incident_id}`, this.authService.getSession()).subscribe(
              (response) => {

                const attachments = response.map(x => ({
                  ...x,
                  dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
                  arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
                  transport_time: x.transport_time ? new Date(x.transport_time) : null,
                  transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
                  cleared_time: x.cleared_time ? new Date(x.cleared_time) : null
                }));

                const attachment = attachments.find(a => a.unit == targetUnit.unit && a.cleared_time == null);

                if (attachment == null) {
                  return;
                }

                if (attachment.transportdone_time != null) return;

                attachment.arrival_time = new Date();

                this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/transportdone`, this.authService.getSession()).subscribe(
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

          return;

        }//End mark dest

        if (commandSplitNormalized[1] == 'clr') {
          if (targetUnit.attachment) {

            const oi = this.incidents.find(i => i.incident_id == targetUnit.incID)
            if (oi == null) {
              this.command = '';
              return;
            }
            this.command = '';

            this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${oi.incident_id}`, this.authService.getSession()).subscribe(
              (response) => {

                const attachments = response.map(x => ({
                  ...x,
                  dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
                  arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
                  transport_time: x.transport_time ? new Date(x.transport_time) : null,
                  transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
                  cleared_time: x.cleared_time ? new Date(x.cleared_time) : null
                }));

                const attachment = attachments.find(a => a.unit == targetUnit.unit && a.cleared_time == null);

                if (attachment == null) {
                  return;
                }

                if (attachment.cleared_time != null) return;

                attachment.cleared_time = new Date();

                this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/cleared`, this.authService.getSession()).subscribe(
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

          return;

        }//End mark clear
        
      }
      //Single param commands End

      //Two param commands
      if (commandSplitNormalized.length == 3) {

        if (commandSplitNormalized[1] == 'a') {

          if (targetUnit.status != 'In Service') {
            return;
          }

          let targetIncident: number = -1;

          if (commandSplitNormalized[2].startsWith('i')) {
            targetIncident = this.incidents.find(i => i.call_number.endsWith(commandSplitNormalized[2].substring(1)))?.incident_id ?? -1;
          }

          if (commandSplitNormalized[2].startsWith('u')) {
            const unitA = this.units.find(u => u.unit.toLowerCase().endsWith(commandSplitNormalized[2].substring(1)));
            if (unitA && unitA.incID)
              targetIncident = unitA.incID;
          }

          if (targetIncident == -1)
            return;

          const targetInc = this.incidents.find(i => i.incident_id == targetIncident);

          if (targetInc == null)
            return;

          this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/new/attachment/${targetIncident}/${targetUnit.unit}`, this.authService.getSession()).subscribe(
            (response) => {

            },
            (error) => {
              console.log(error);
            }
          );

          if (targetInc.ts_dispatch == null) {
            this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/timestamp/dp/${targetIncident}`, this.authService.getSession()).subscribe(
              (response) => {

              },
              (error) => {
                console.log(error);
              }
            );
          }

          this.command = '';
          return;

        }//Attach command end

      }//end 2 param commands


      //notes
      if (commandSplitNormalized[1] == 'n' && targetUnit.incID > 0) {

        let message = commandSplit.slice(2).join(' ');

        if (message.startsWith('/') && this.config.shorthands[message.substring(1).toLowerCase()]) {
          message = this.config.shorthands[message.substring(1).toLowerCase()];
        }

        let np: NotePost = {
          creator: null,
          message: message,
          sess: this.authService.getSession() as Session,
          ts: new Date(),
          unit: targetUnit.unit
        }

        this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/incnotes/${targetUnit.incID}`, np).subscribe(
          (response) => {


          },
          (error) => {
            console.log(error);
          }
        );

        this.command = '';
      }



    }//End Unit Commands

    //Incident Commands
    if (normalized.startsWith('i')) {
      const targetIncident = this.incidents.find(i => i.call_number.toLowerCase().endsWith(commandSplitNormalized[0].substring(1)));
      if (targetIncident == null) return;

      if (commandSplitNormalized.length == 1) {
        //Open Incident
          this.incidentClicked(targetIncident.incident_id);
          this.command = '';
        return;
        //End Open Incident
      }

      //Note Add
      if (commandSplitNormalized[1] == 'n' && commandSplitNormalized.length > 2) {
        let message = commandSplit.slice(2).join(' ');

        if (message.startsWith('/') && this.config.shorthands[message.substring(1).toLowerCase()]) {
          message = this.config.shorthands[message.substring(1).toLowerCase()];
        }

        let np: NotePost = {
          creator: null,
          message: message,
          sess: this.authService.getSession() as Session,
          ts: new Date(),
          unit: ''
        }

        this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/incnotes/${targetIncident.incident_id}`, np).subscribe(
          (response) => {


          },
          (error) => {
            console.log(error);
          }
        );

        this.command = '';
      }//End Note Add

    }//End Incident Commands

    //Context Commands
    if (this.incident) {

      if (commandSplitNormalized.length == 2) {

        //Attach
        if (commandSplitNormalized[0] == 'a' && commandSplitNormalized[1].startsWith('u')) {
          const targetUnit = this.units.find(u => u.unit.toLowerCase().endsWith(commandSplitNormalized[1].substring(1)));
          if (targetUnit == null) return;
          console.log(targetUnit);
          console.log(commandSplitNormalized[1]);
          if (targetUnit.status != 'In Service') return;


          this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/new/attachment/${this.incident.incident_id}/${targetUnit.unit}`, this.authService.getSession()).subscribe(
            (response) => {

            },
            (error) => {
              console.log(error);
            }
          );

          if (this.incident.ts_dispatch == null) {
            this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/timestamp/dp/${this.incident.incident_id}`, this.authService.getSession()).subscribe(
              (response) => {

              },
              (error) => {
                console.log(error);
              }
            );
          }

          this.command = '';

          return
        }//End Attach

        //On Scene
        if (commandSplitNormalized[0] == 'os' && commandSplitNormalized[1].startsWith('u')) {
          const targetUnit = this.units.find(u => u.unit.toLowerCase().endsWith(commandSplitNormalized[1].substring(1)));
          if (targetUnit == null) return;
          if (targetUnit.incID != this.incident.incident_id) return;


          this.command = '';

          this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${this.incident.incident_id}`, this.authService.getSession()).subscribe(
            (response) => {

              const attachments = response.map(x => ({
                ...x,
                dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
                arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
                transport_time: x.transport_time ? new Date(x.transport_time) : null,
                transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
                cleared_time: x.cleared_time ? new Date(x.cleared_time) : null
              }));

              const attachment = attachments.find(a => a.unit == targetUnit.unit && a.cleared_time == null);

              if (attachment == null) {
                return;
              }

              if (attachment.arrival_time != null) return;

              attachment.arrival_time = new Date();

              this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/arrived`, this.authService.getSession()).subscribe(
                (response) => {

                },
                (error) => {
                  console.log(error);
                }
              );


              if (this.incident?.ts_arrival == null) {
                this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/timestamp/os/${this.incident?.incident_id}`, this.authService.getSession()).subscribe(
                  (response) => {

                  },
                  (error) => {
                    console.log(error);
                  }
                );
              }


            },
            (error) => {
              console.log(error);
            }
          );

          return;

        }//End On Scene

        //Transport
        if ((commandSplitNormalized[0] == 'enr' || commandSplitNormalized[0] == 'er') && commandSplitNormalized[1].startsWith('u')) {
          const targetUnit = this.units.find(u => u.unit.toLowerCase().endsWith(commandSplitNormalized[1].substring(1)));
          if (targetUnit == null) return;
          if (targetUnit.incID != this.incident.incident_id) return;


          this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${this.incident?.incident_id}`, this.authService.getSession()).subscribe(
            (response) => {

              const attachments = response.map(x => ({
                ...x,
                dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
                arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
                transport_time: x.transport_time ? new Date(x.transport_time) : null,
                transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
                cleared_time: x.cleared_time ? new Date(x.cleared_time) : null
              }));

              const attachment = attachments.find(a => a.unit == targetUnit.unit && a.cleared_time == null);

              if (attachment == null) {
                return;
              }

              if (attachment.transport_time != null) return;

              attachment.transport_time = new Date();

              this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/transport`, this.authService.getSession()).subscribe(
                (response) => {

                },
                (error) => {
                  console.log(error);
                }
              );

              this.command = '';
            },
            (error) => {
              console.log(error);
            }
          );
          this.command = '';
          return;

        }//End Transport

        //Transport Done
        if (commandSplitNormalized[0] == 'arr' && commandSplitNormalized[1].startsWith('u')) {
          const targetUnit = this.units.find(u => u.unit.toLowerCase().endsWith(commandSplitNormalized[1].substring(1)));
          if (targetUnit == null) return;
          if (targetUnit.incID != this.incident.incident_id) return;


          this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${this.incident?.incident_id}`, this.authService.getSession()).subscribe(
            (response) => {

              const attachments = response.map(x => ({
                ...x,
                dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
                arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
                transport_time: x.transport_time ? new Date(x.transport_time) : null,
                transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
                cleared_time: x.cleared_time ? new Date(x.cleared_time) : null
              }));

              const attachment = attachments.find(a => a.unit == targetUnit.unit && a.cleared_time == null);

              if (attachment == null) {
                return;
              }

              if (attachment.transportdone_time != null) return;

              attachment.transportdone_time = new Date();

              this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/transportdone`, this.authService.getSession()).subscribe(
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
          this.command = '';
          return;

        }//End Done

        //Cleared Done
        if (commandSplitNormalized[0] == 'clr' && commandSplitNormalized[1].startsWith('u')) {
          const targetUnit = this.units.find(u => u.unit.toLowerCase().endsWith(commandSplitNormalized[1].substring(1)));
          if (targetUnit == null) return;
          if (targetUnit.incID != this.incident.incident_id) return;


          this.http.post<UnitAttachment[]>(`https://${this.config.systemURL.trim()}/API/Units/Units/get/attachment/${this.incident?.incident_id}`, this.authService.getSession()).subscribe(
            (response) => {

              const attachments = response.map(x => ({
                ...x,
                dispatch_time: x.dispatch_time ? new Date(x.dispatch_time) : null,
                arrival_time: x.arrival_time ? new Date(x.arrival_time) : null,
                transport_time: x.transport_time ? new Date(x.transport_time) : null,
                transportdone_time: x.transportdone_time ? new Date(x.transportdone_time) : null,
                cleared_time: x.cleared_time ? new Date(x.cleared_time) : null
              }));

              const attachment = attachments.find(a => a.unit == targetUnit.unit && a.cleared_time == null);

              if (attachment == null) {
                return;
              }

              if (attachment.cleared_time != null) return;

              attachment.cleared_time = new Date();

              this.http.post(`https://${this.config.systemURL.trim()}/API/Units/Units/post/attachment/${attachment.attachmentID}/cleared`, this.authService.getSession()).subscribe(
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
          this.command = '';
          return;

        }//End Done

        //Cleared Done
        



      } 

      if (commandSplitNormalized[0] == 'n') {

        let message = commandSplit.slice(1).join(' ');

        if (message.startsWith('/') && this.config.shorthands[message.substring(1).toLowerCase()]) {
          message = this.config.shorthands[message.substring(1).toLowerCase()];
        }

        let np: NotePost = {
          creator: null,
          message: message,
          sess: this.authService.getSession() as Session,
          ts: new Date(),
          unit: ''
        }

        this.http.post(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/post/incnotes/${this.incident?.incident_id}`, np).subscribe(
          (response) => {


          },
          (error) => {
            console.log(error);
          }
        );

        this.command = '';

        return;

      }//End Done

    }


    //End Context Commands


  }


  //window.addEventListener('keydown', this.keyDownHandler);
  //window.removeEventListener('keydown', this.keyDownHandler);
  private keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  handleKeyDown(event: KeyboardEvent): void {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      const inputElement = document.querySelector('#CommandBar') as HTMLInputElement | null;
      if (inputElement) {
        inputElement.focus();
      }
    }
    
    if (isModifierPressed && event.key.toLowerCase() === 's') {
      event.preventDefault();
      
    }
  }

  get unit(): UnitListing | null {
    if (this.state.startsWith('U'))
      return this.units.find(u => u.unit == this.state.substring(1)) ?? null
    return null;
  }

}
