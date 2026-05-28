import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestComponent } from './test';
import { LoginComponent } from './unauthorized/login';
import { AuthenticationService } from './services';
import { DashboardComponent } from './cad';

const routes: Routes = [
  { path: 'cad', component: DashboardComponent, canActivate: [AuthenticationService] },
  { path: 'unauthorized', component: LoginComponent },
  { path: 'unauthorized/login', component: LoginComponent },

  // We want to redirect to the login page if the user is unauthenticated, otherwise redirect to the test page.
  { path: '**', redirectTo: 'cad'},
  { path: '', pathMatch: 'full', redirectTo: 'cad'},
  //{ path: '**', redirectTo: 'unauthorized/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
