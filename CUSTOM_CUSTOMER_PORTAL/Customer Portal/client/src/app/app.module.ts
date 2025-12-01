import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { ShellComponent } from './components/shell/shell.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FinanceSheetComponent } from './components/finance-sheet/finance-sheet.component';

import { AuthService } from './services/auth.service';
import { SapApiService } from './services/sap-api.service';
import { AuthGuard } from './guards/auth.guard';
import { routes } from './app-routing.module';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    AppComponent,
    LoginComponent,
    ShellComponent,
    DashboardComponent,
    ProfileComponent,
    FinanceSheetComponent
  ],
  providers: [
    AuthService,
    SapApiService,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

