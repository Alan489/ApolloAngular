import { Component } from '@angular/core';
import { AuthenticationService, ConfigService } from '../services';
import { Session, UnitListing, IncidentInformation, UnitAttachment } from '../models';
import { HeaderComponent } from '../cad/components';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


interface UserManagementObject {
  id: number,
  username: string,
  newHashword: string | null,
  name: string,
  access_level: number,
  timeout: number,
  change_password: number,
  locked_out: number,
  failed_login_count: number,
  assignment: string
}

interface CreateUserObject {
  Session: Session,
  umo: UserManagementObject
}


@Component({
  templateUrl: 'usermanagement.component.html',
  standalone: true,
  imports: [HeaderComponent, CommonModule, FormsModule],
  styleUrls: ['./usermanagement.css']
})
export class UserManagementComponent {

  private deb: boolean = false;
  public users: UserManagementObject[] = [];
  public selectedUser: UserManagementObject | null = null;
  private refreshToken: ReturnType<typeof setInterval> | undefined = undefined;
  public units: UnitListing[] = [];
  public selectedMDT: string = 'NULL';
  public newPassword: string = '5C8D742C';


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

    this.http.post<UserManagementObject[]>(`https://${this.config.systemURL.trim()}/API/Sys/User/User/get/umos`, this.authService.getSession()).subscribe(
      (response) => {
        this.users = response;

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

  userClicked(id: number) {
    if (id == -1) {
      this.selectedUser = null;
      this.selectedMDT = '';
      this.newPassword = '';
      return;
    }

    if (id == -2) {
      this.selectedMDT = '';
      this.selectedUser = {
        id: -1, 
        username: '', 
        newHashword: '', 
        name: '', 
        access_level: 1, 
        timeout: 3000, 
        change_password: 1, 
        locked_out: 0, 
        failed_login_count: 0, 
        assignment : '', 
      }
      this.newPassword = this.generateNewPassword();
      return;
    }

    this.selectedUser = this.users.find(u => u.id == id) ?? null;
    this.selectedMDT = this.selectedUser?.assignment ?? 'NULL';
    this.newPassword = '';
    if (this.selectedMDT == '')
      this.selectedMDT = 'NULL';
    
  }

  saveName() {
    if (this.selectedUser == null || this.selectedUser.name.trim() == '') return;
    this.http.post(`https://${this.config.systemURL.trim()}/API/Sys/User/User/post/name/${this.selectedUser.id}/${this.selectedUser.name}`, this.authService.getSession()).subscribe(
      (response) => {
        
      },
      (error) => {
        console.log(error);
        
      }
    );
  }

  saveMDT() {
    if (this.selectedUser == null || this.selectedMDT.trim() == '') return;
    this.http.post(`https://${this.config.systemURL.trim()}/API/Sys/User/User/post/assignment/${this.selectedUser.id}/${this.selectedMDT}`, this.authService.getSession()).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);

      }
    );
  }

  saveAccess() {
    if (this.selectedUser == null) return;
    this.http.post(`https://${this.config.systemURL.trim()}/API/Sys/User/User/post/access/${this.selectedUser.id}/${this.selectedUser.access_level}`, this.authService.getSession()).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);

      }
    );
  }

  lockUser() {
    if (this.selectedUser == null) return;

    if (this.selectedUser.locked_out == 1)
      this.selectedUser.locked_out = 0;
    else
      this.selectedUser.locked_out = 1;
    //                       API/Sys/Users/User/post/lock/
    //https://localhost:7208/API/Sys/User/User/post/lock/1/1
    this.http.post(`https://${this.config.systemURL.trim()}/API/Sys/User/User/post/lock/${this.selectedUser.id}/${this.selectedUser.locked_out}`, this.authService.getSession()).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);

      }
    );
  }

  expirePassword() {
    if (this.selectedUser == null) return;

    this.selectedUser.change_password = 1;

    this.http.post(`https://${this.config.systemURL.trim()}/API/Sys/User/User/post/expired/${this.selectedUser.id}/1`, this.authService.getSession()).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);

      }
    );
  }

  generateNewPassword(): string {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  saveNewPassword() {
    if (this.selectedUser == null) return;

    this.expirePassword();

    this.newPassword = this.generateNewPassword();
    this.selectedUser.newHashword = this.authService.hash(this.selectedUser.username, this.newPassword);

    this.http.post(`https://${this.config.systemURL.trim()}/API/Sys/User/User/post/setpw/${this.selectedUser.id}/${this.selectedUser.newHashword}`, this.authService.getSession()).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);

      }
    );

  }

  saveNew() {
    if (this.selectedUser == null) return;
    if (this.selectedUser.username.trim() == '' || this.selectedUser.username.indexOf(' ') != -1) return;
    if (this.users.find(u => u.username.toLowerCase() == this.selectedUser?.username.toLowerCase().trim()) != null) return;
    this.selectedUser.newHashword = this.authService.hash(this.selectedUser.username.trim(), this.newPassword);
    const cnur: CreateUserObject = {
      Session: this.authService.getSession() as Session,
      umo: this.selectedUser
    }

    this.http.post(`https://${this.config.systemURL.trim()}/API/Sys/User/User/create`, cnur).subscribe(
      (response) => {

      },
      (error) => {
        console.log(error);

      }
    );

    this.userClicked(-1);
  }

  //V API/Sys/User/User/get/umos:Session level 5
  //V API/Sys/User/User/post/assignment/{id}/{assignment}:Session level 5

  //V API/Sys/User/User/post/setpw/{myUser.id}/{hashword}:Session level 8
  //V API/Sys/User/User/post/lock/{myUser.id}/{myUser.locked_out}:Session level 8 / 1:locked 0:unlocked
  //V API/Sys/User/User/post/expired/{myUser.id}/{myUser.change_password}:Session level 8 / 1:passwordexpired 0:notexpired
  //V API/Sys/User/User/post/name/{id}/{name}:Session level 8
  //V API/Sys/User/User/post/access/{id}/{access}:Session level 8

  //V API/Sys/User/User/create:CreateUser level 8


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



}
