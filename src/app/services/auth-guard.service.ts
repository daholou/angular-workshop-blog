// This is a guarding service for any route that requires authentication,
// such as accessing the list of cards of a particular user.

import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot, UrlTree
} from '@angular/router';
import {Observable} from 'rxjs';

import firebase from 'firebase/app';
import 'firebase/auth';
import User = firebase.User;
import {Injectable} from '@angular/core';
import {ConsoleService} from './console.service';


@Injectable()
export class AuthGuardService implements CanActivate
{
  constructor(private mConsoleService: ConsoleService,
              private mRouter: Router)
  {
  }

  canActivate(route: ActivatedRouteSnapshot,
              state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree>
    | boolean | UrlTree
  {
    return new Promise(((resolve, reject) =>
    {
      firebase.auth().onAuthStateChanged(
        // next
        (user: User) =>
        {
          if (user)
          {
            // user is signed in
            resolve(true);
          }
          else
          {
            // user signed out
            resolve(false);
            this.mConsoleService.log(
              'Sorry, but you need to sign in to do that!');
            this.mRouter.navigate(['/sign-in']);
          }
        },
        // error
        () =>
        {
        },
        // complete
        () =>
        {
        }
      );
    }));
  }


}

