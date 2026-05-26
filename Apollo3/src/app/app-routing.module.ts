import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestComponent } from './test';
import { LoginComponent } from './unauthorized/login';
import { AuthGuard } from './authentication/auth.guard';

const routes: Routes = [
  { path: 'test', component: TestComponent, canActivate: [AuthGuard] },
  { path: 'unauthorized', component: LoginComponent },
  { path: 'unauthorized/login', component: LoginComponent },

  // We want to redirect to the login page if the user is unauthenticated, otherwise redirect to the test page.
  { path: '**', redirectTo: 'test'},
  { path: '', pathMatch: 'full', redirectTo: 'test'},
  //{ path: '**', redirectTo: 'unauthorized/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
