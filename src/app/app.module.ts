import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
// module for routing
import {RouterModule, Routes} from '@angular/router';
// module for reactive forms
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

// modules for the toasts + animations
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ToastrModule} from 'ngx-toastr';

import {AppComponent} from './app.component';
import {AuthService} from './services/auth.service';
import {HeaderBarComponent} from './header-bar/header-bar.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {SignInComponent} from './sign-in/sign-in.component';
import {SignUpComponent} from './sign-up/sign-up.component';
import {CardService} from './services/card.service';
import {CardListComponent} from './card-list/card-list.component';
import {AuthGuardService} from './services/auth-guard.service';
import {ConsoleService} from './services/console.service';
import {NewCardComponent} from './new-card/new-card.component';
import {CardListItemComponent} from './card-list-item/card-list-item.component';
import {UserProfileComponent} from './user-profile/user-profile.component';
import {UserDataService} from './services/user-data.service';
import {ViewCardComponent} from './view-card/view-card.component';
import {CommentService} from './services/comment.service';
import {CommentListComponent} from './comment-list/comment-list.component';
import {CommentListItemComponent} from './comment-list-item/comment-list-item.component';

const appRoutes: Routes = [
  {path: 'posts', component: CardListComponent},
  {path: 'sign-in', component: SignInComponent},
  {path: 'sign-up', component: SignUpComponent},
  {
    path: 'new-post',
    component: NewCardComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'user-profile', component: UserProfileComponent,
    canActivate: [AuthGuardService]
  },
  {path: 'not-found', component: NotFoundComponent},
  {path: '', redirectTo: 'posts', pathMatch: 'full'},
  {path: '**', redirectTo: 'not-found'}
];

@NgModule({
  declarations: [
    AppComponent,
    HeaderBarComponent,
    NotFoundComponent,
    SignInComponent,
    SignUpComponent,
    CardListComponent,
    NewCardComponent,
    CardListItemComponent,
    UserProfileComponent,
    ViewCardComponent,
    CommentListComponent,
    CommentListItemComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    AuthService,
    AuthGuardService,
    CardService,
    ConsoleService,
    UserDataService,
    CommentService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule
{
}
