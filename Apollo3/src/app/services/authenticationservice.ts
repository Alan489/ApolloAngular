import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Session } from '../models';
import { LocalStorageService } from './localstorageservice';

@Injectable({ providedIn: 'root' })
export class AuthenticationService implements CanActivate {
  private session: Session | null = null;

  constructor(private http: HttpClient, private router: Router, private localStorageService: LocalStorageService)
  {

    this.session = this.localStorageService.getLocal('session');
  }

  getSession(): Session | null {
    if (this.session == null) {
      this.session = this.localStorageService.getLocal('session');
    }
    return this.session;
  }

  login(session: Session) {
    this.session = session;
    this.localStorageService.set('session', session);
  }

  logout() {
    this.session = null;
    this.localStorageService.set('session', null);
    this.router.navigate(['/unauthorized']);
  }


  canActivate(): boolean {
    if (this.session != null)
      return true;
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
