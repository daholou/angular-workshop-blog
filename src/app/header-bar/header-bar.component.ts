import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Subscription} from 'rxjs';
import {ConsoleService} from '../services/console.service';
import firebase from 'firebase/app';
import 'firebase/auth';
import User = firebase.User;
import {UserDataService} from '../services/user-data.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss']
})
export class HeaderBarComponent implements OnInit, OnDestroy
{
  mConsoleSubscription: Subscription;
  mConsoleMsg: string = '';

  mUser: User = null;
  mUserSubscription: Subscription;

  constructor(private mAuthService: AuthService,
              private mConsoleService: ConsoleService,
              private mUserDataService: UserDataService,
              private mRouter: Router)
  {
  }

  ngOnInit(): void
  {
    this.mConsoleSubscription = this.mConsoleService.subjectMsg.subscribe(
      (data: string) =>
      {
        this.mConsoleMsg = data;
      }
    );
    this.mConsoleService.emitMsg();

    // Observe the changes of user
    this.mUserSubscription = this.mUserDataService.mUserSubject
      .subscribe((user: User) =>
      {
        this.mUser = user;
      });
    this.mUserDataService.emitUser();
  }

  ngOnDestroy(): void
  {
    if (this.mConsoleSubscription)
    {
      this.mConsoleSubscription.unsubscribe();
    }

    if (this.mUserSubscription)
    {
      this.mUserSubscription.unsubscribe();
    }
  }

  onLogout(): void
  {
    this.mAuthService.signOutUser().then(
      () =>
      {
        this.mRouter.navigate(['/sign-in']).then();
      });
  }

  get isAuth(): boolean
  {
    return this.mUser != null;
  }

  get displayName(): string
  {
    return this.isAuth ? this.mUser.displayName : '';
  }

  get photoURL(): string
  {
    return this.isAuth ? this.mUser.photoURL : '';
  }
}
