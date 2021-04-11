import firebase from 'firebase/app';
import 'firebase/auth';
import UserCredential = firebase.auth.UserCredential;
import {UserData} from '../models/User-data.model';
import {UserDataService} from './user-data.service';
import {Injectable} from '@angular/core';


// This service manages user sign-in, sign-up, as well as user creation and
// user deletion. It completely relies on Firebase Auth service for these
// features.
@Injectable()
export class AuthService
{
  constructor(private mUserDataService: UserDataService)
  {
  }

  // Tries to create a new Firebase user based on a email+password. This is an
  // asynchronous method because Auth.createUserWithEmailAndPassword is
  // obviously asynchronous.
  // It returns a Promise with user credentials on success.
  // Note that on success, the user will also be signed in !
  createNewUser(email: string, pwd: string): Promise<UserCredential>
  {
    return new Promise(((resolve, reject) =>
    {
      firebase.auth().createUserWithEmailAndPassword(email, pwd).then(
        // success: we get returned the new user credentials
        (cred) =>
        {
          this.mUserDataService.createNewUserData(UserData.makeEmpty());
          resolve(cred);
        },
        // error: we get a Firebase error
        (error) =>
        {
          reject(error);
        }
      );
    }));
  }

  // Tries to sign in a Firebase user of given email+pwd. This is an async
  // method.
  // It returns a Promise with user credentials on success.
  signInUser(email: string, pwd: string): Promise<UserCredential>
  {
    return new Promise(((resolve, reject) =>
    {
      firebase.auth().signInWithEmailAndPassword(email, pwd).then(
        // success: we get returned the new user credentials
        (cred) =>
        {
          resolve(cred);
        },
        // error: we get a Firebase error
        (error) =>
        {
          reject(error);
        }
      );
    }));
  }

  // Tries to sign out the current Firebase user
  signOutUser(): Promise<void>
  {
    return firebase.auth().signOut();
  }

}
