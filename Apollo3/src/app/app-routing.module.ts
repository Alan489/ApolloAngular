import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestComponent } from './test';
import { LoginComponent } from './unauthorized/login';
import { AuthenticationService } from './services';
import { DashboardComponent } from './cad';
import { UserManagementComponent } from './usermanagement';
import { SystemManagementComponent } from './systemmanagement';
import { BoardComponent } from './board';
import { MapComponent } from './map';

const routes: Routes = [
  { path: 'cad', component: DashboardComponent, canActivate: [AuthenticationService], data: { accessLevel: 1 } },
  { path: 'users', component: UserManagementComponent, canActivate: [AuthenticationService], data: { accessLevel: 5 } },
  { path: 'mdt', component: UserManagementComponent, canActivate: [AuthenticationService], data: { accessLevel: -1 } },
  { path: 'map', component: MapComponent, canActivate: [AuthenticationService], data: { accessLevel: -2 } },
  { path: 'board', component: BoardComponent, canActivate: [AuthenticationService], data: { accessLevel: -3 } },
  { path: 'system', component: SystemManagementComponent, canActivate: [AuthenticationService], data: { accessLevel: 5 } },
  { path: 'unauthorized', component: LoginComponent },
  { path: 'unauthorized/login', component: LoginComponent },

  { path: '**', redirectTo: 'cad' },
  { path: '', pathMatch: 'full', redirectTo: 'cad'},
  //{ path: '**', redirectTo: 'unauthorized/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
