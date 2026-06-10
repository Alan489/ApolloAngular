import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms';
import { sha256 } from 'js-sha256';
import { ConfigService,AuthenticationService } from '../../services';
import { LoginToken, Session } from '../../models';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


interface LoginResponse {
  session: Session;
  errorMessage: string | undefined;
  successful: boolean;
}

interface ChangePasswordRequest {
  token: LoginToken,
  timeStamp: Date,
  newHashword: string,
  signature: string
}

@Component({
  templateUrl: 'login.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./login.css']
})
export class LoginComponent {
  constructor(private http: HttpClient, public datepipe: DatePipe, private config: ConfigService, private router: Router, private authService: AuthenticationService) { }

  public netResponse: string = '';
  public netResponseType: string = '';
  public username: string = '';
  public password: string = '';
  private deb: boolean = false;
  public cp1: string = '';
  public cp2: string = '';
  public cpr: boolean = false;

  cancelCPR() {
    this.cpr = false;
    this.username = '';
    this.password = '';
    this.netResponse = '';
  }

  //https://localhost:7208/API/Sys/User/User/changePassword
  cp() {
    this.netResponse = '';
    if (this.cp1 != this.cp2) {
      this.netResponse = 'Passwords must match';
      this.netResponseType = 'error';
      return;
    }

    if (this.cp1 == '') {
      this.netResponse = 'Passwords must not be empty';
      this.netResponseType = 'error';
      return;
    }


    const hashword = sha256(this.password + this.username.toLowerCase());

    const date = new Date();
    date.setDate(date.getDate() + 2);

    const formatted = this.datepipe.transform(date, 'hh:mm:ss dd/MM/yyyy', "+0");

    const formattedString = hashword + formatted;

    const hash = sha256(formattedString);

    const token: LoginToken = {
      username: this.username.toLowerCase(),
      expiration: date,
      hash: hash
    };

    const newHashword = this.authService.hash(this.username, this.cp1);
    const newDate: Date = new Date();
    const newFormatted = this.datepipe.transform(newDate, 'YY-MM-DD HH:mm:ss', "+0");
    const newFormattedString = newHashword + token.hash + newFormatted;
    const signature = sha256(newFormattedString);

    const cprequest: ChangePasswordRequest = {
      token: token,
      timeStamp: newDate,
      newHashword: newHashword,
      signature: signature
    }

    //API/Sys/User/User/changePassword

    this.http.post<LoginResponse>(`https://${this.config.systemURL.trim()}/API/Sys/User/User/changePassword`, cprequest).subscribe(
      (response) => {
        if (response.successful) {
          this.netResponseType = 'success';
          this.netResponse = 'Password updated. Please login to continue.';
          this.cpr = false;
          this.cp1 = '';
          this.cp2 = '';
          this.password = '';
        }
      },
      (error) => {
        console.log(error);
        this.netResponseType = 'error';
        if (error.status === 401) {
          this.netResponse = error.error.errorMessage;
        } else {
          this.netResponse = 'An error occurred while trying to change password. Please check your network connection and try again.';
        }
        this.deb = false;
      }
    );

  }

  loginMDT() {
    //localhost:7208/API/Sys/Unit/Login

    if (this.deb)
      return;

    this.deb = true;

    if (this.username.trim() === '' || this.password.trim() === '') {
      this.netResponse = 'Please fill in all fields.';
      this.netResponseType = 'error';
      this.deb = false;
      return;
    }

    this.netResponse = 'Loading system information...';
    this.netResponseType = '';


    this.config.loadConfig().then(() => {
      this.netResponse = 'Logging in as ' + this.username + '@' + this.config.systemURL;
      this.netResponseType = '';

      let hashword = sha256(this.password + this.username.toLowerCase());

      let date = new Date();
      date.setDate(date.getDate() + 2);

      const formatted = this.datepipe.transform(date, 'hh:mm:ss dd/MM/yyyy', "+0");

      let formattedString = hashword + formatted;

      let hash = sha256(formattedString);

      let token: LoginToken = {
        username: this.username.toLowerCase(),
        expiration: date,
        hash: hash
      };

      this.http.post<LoginResponse>(`https://${this.config.systemURL.trim()}/API/Sys/Unit/Login`, token).subscribe(
        (response) => {
          let session = response.session as Session;
          this.deb = false;
          //KZRYVC
          if (response.errorMessage == 'CHANGEPASSWORD') {
            this.cpr = true;
            this.cp1 = '';
            this.cp2 = '';
            this.netResponseType = 'error';
            this.netResponse = 'Your password has expired and must be changed.';
            return;
          }


          this.netResponseType = 'success';
          this.netResponse = 'Login successful. Redirecting...';
          this.authService.login(session);

          if (session.unitAssignment == 'BOARD')
            this.router.navigate(['/board']);
          if (session.unitAssignment == 'MAP')
            this.router.navigate(['/map']);

        },
        (error) => {
          console.log(error);
          this.netResponseType = 'error';
          if (error.status === 401) {
            this.netResponse = error.error.errorMessage;
          } else {
            this.netResponse = 'An error occurred while trying to log in. Please check your network connection and try again.';
          }
          this.deb = false;
        }
      );
    })

  }


  login() {

    if (this.deb)
      return;

    this.deb = true;

    if (this.username.trim() === '' || this.password.trim() === '') {
      this.netResponse = 'Please fill in all fields.';
      this.netResponseType = 'error';
      this.deb = false;
      return;
    }

    this.netResponse = 'Loading system information...';
    this.netResponseType = '';


    this.config.loadConfig().then(() => {
      this.netResponse = 'Logging in as ' + this.username + '@' + this.config.systemURL;
      this.netResponseType = '';

      let hashword = sha256(this.password + this.username.toLowerCase());

      let date = new Date();
      date.setDate(date.getDate() + 2);

      const formatted = this.datepipe.transform(date, 'hh:mm:ss dd/MM/yyyy', "+0");

      let formattedString = hashword + formatted;

      let hash = sha256(formattedString);

      let token: LoginToken = {
        username: this.username.toLowerCase(),
        expiration: date,
        hash: hash
      };

      this.http.post <LoginResponse>(`https://${this.config.systemURL.trim()}/API/Sys/User/Login`, token).subscribe(
        (response) => {
          let session = response.session as Session;
          this.deb = false;
          //KZRYVC
          if (response.errorMessage == 'CHANGEPASSWORD') {
            this.cpr = true;
            this.cp1 = '';
            this.cp2 = '';
            this.netResponseType = 'error';
            this.netResponse = 'Your password has expired and must be changed.';
            return;
          }


          this.netResponseType = 'success';
          this.netResponse = 'Login successful. Redirecting...';
          this.authService.login(session);
          this.router.navigate(['/cad']);
        },
        (error) => {
          console.log(error);
          this.netResponseType = 'error';
          if (error.status === 401) {
            this.netResponse = error.error.errorMessage;
          } else {
            this.netResponse = 'An error occurred while trying to log in. Please check your network connection and try again.';
          }
          this.deb = false;
        }
      );
    })
  }
}
