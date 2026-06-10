import { Component } from '@angular/core';
import { AuthenticationService, ConfigService } from '../services';
import { HeaderComponent } from '../cad/components';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IncidentDispositionsComponent, UnitDispositionsComponent, IncidentTypesComponent } from './components/';


@Component({
  templateUrl: 'systemmanagement.component.html',
  standalone: true,
  imports: [HeaderComponent, CommonModule, FormsModule, IncidentDispositionsComponent, UnitDispositionsComponent, IncidentTypesComponent],
  styleUrls: ['./systemmanagement.css']
})
export class SystemManagementComponent {

  private deb: boolean = false;
  private refreshToken: ReturnType<typeof setInterval> | undefined = undefined;
  public state: string = 'None';

  constructor(private config: ConfigService, private authService: AuthenticationService, private http: HttpClient, private router: Router)
  {
    config.loadConfig().then(() => {
      this.loadData();
    });
    this.refreshToken = setInterval(() => this.loadData(), 1000);
    window.addEventListener('keydown', this.keyDownHandler);
    
  }

  loadData() {

    if (this.deb) return;
    this.deb = true;

  }

  trackUser(index: number, item: any) {
    return item.id;
  }

  ngOnDestroy() {
    clearInterval(this.refreshToken);
    window.removeEventListener('keydown', this.keyDownHandler);
  }

  back() {
    this.router.navigate(['/cad']);
  }

  get accessLevel() {
    return this.authService.getSession()?.accessLevel ?? 0;
  }

  logout() {
    this.authService.logout();
  }

  openIncidentDispositions() {
    if (this.accessLevel >= 7) {
      this.state = 'incidentdispositions';
    }
  }

  openUnitDispositions() {
    if (this.accessLevel >= 7) {
      this.state = 'unitdispositions';
    }
  }

  openIncidentTypes() {
    if (this.accessLevel >= 7) {
      this.state = 'incidenttypes';
    }
  }

  private keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  handleKeyDown(event: KeyboardEvent): void {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.key.toLowerCase() === 'e') {
      event.preventDefault();
    }
    
    if (isModifierPressed && event.key.toLowerCase() === 's') {
      event.preventDefault();
      
    }
  }



}
