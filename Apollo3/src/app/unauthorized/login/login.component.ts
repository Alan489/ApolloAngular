import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  templateUrl: 'login.component.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  constructor(private http: HttpClient) { }

  public netResponse: string = '';
  public netResponseType: string = '';
  public username: string = '';
  public password: string = '';
  public sysadd: string = '';

  login() {

  }


}
