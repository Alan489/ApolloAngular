import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms';
import { sha256 } from 'js-sha256';
import { ConfigService,AuthenticationService } from '../../services';
import { LoginToken, Session } from '../../models';
import { Router } from '@angular/router';


interface LoginResponse {
  session: Session;
  errorMessage: string | undefined;
  successful: boolean;
}

@Component({
  templateUrl: 'login.component.html',
  imports: [FormsModule],
  styleUrls: ['./login.css']
})
export class LoginComponent {
  constructor(private http: HttpClient, public datepipe: DatePipe, private config: ConfigService, private router: Router, private authService: AuthenticationService) { }

  public netResponse: string = '';
  public netResponseType: string = '';
  public username: string = '';
  public password: string = '';
  private deb: boolean = false;

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
          this.netResponseType = 'success';
          this.netResponse = 'Login successful. Redirecting...';
          this.authService.login(session);
          this.router.navigate(['/test']);
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
