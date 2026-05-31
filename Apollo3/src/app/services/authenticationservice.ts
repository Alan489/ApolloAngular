import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Session } from '../models';
import { LocalStorageService } from './localstorageservice';
import { sha256 } from 'js-sha256';

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

  hash(username: string, password: string) {
    return sha256(password + username.toLowerCase());
  }


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

    const requiredAccessLevel = route.data['accessLevel'] ?? 0;

    if (this.session == null) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    if (requiredAccessLevel < 0) {//-1: MDT, -2 Map, -3 Board
      switch (requiredAccessLevel) {
        case -1:
          if (this.session.isMDT == false) {
            this.router.navigate(['/unauthorized']);
            return false;
          }
          break;
        case -2:
          if (this.session.isMDT == false || this.session.unitAssignment != 'MAP') {
            this.router.navigate(['/unauthorized']);
            return false;
          }
          break;
        case -3:
          if (this.session.isMDT == false || this.session.unitAssignment != 'BOARD') {
            this.router.navigate(['/unauthorized']);
            return false;
          }
          break;
        default:
          this.router.navigate(['/unauthorized']);
          return false;
      }
    }

    if (this.session.accessLevel >= requiredAccessLevel)
      return true;


    this.router.navigate(['/unauthorized']);
    return false;
    
  }
}
