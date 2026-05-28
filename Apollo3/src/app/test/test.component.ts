import { Component } from '@angular/core';
import { AuthenticationService } from '../services';
import { Session } from '../models';

@Component({ templateUrl: 'test.component.html' })
export class TestComponent {
  constructor(private authService: AuthenticationService) { }

  logout() {
    this.authService.logout();
  }

}
