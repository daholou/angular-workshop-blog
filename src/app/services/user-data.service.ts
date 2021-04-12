import {UserData} from '../models/User-data.model';
import {Subject} from 'rxjs';
import firebase from 'firebase';
import 'firebase/database';
import 'firebase/auth';
import User = firebase.User;
import DataSnapshot = firebase.database.DataSnapshot;
import {Injectable} from '@angular/core';
import {ToastrService} from 'ngx-toastr';


function generateUserName(): string
{
  const num: number = Date.now();
  return 'User#' + num;
}

export const MAX_USR_IMG_SIZE_KB: number = 500;
export const MAX_POST_IMG_SIZE_KB: number = 800;

@Injectable()
export class UserDataService
{
  mUserData: UserData = UserData.makeEmpty();
  mUserDataSubject: Subject<UserData> = new Subject<UserData>();
  mUser: User = null;
  mUserSubject: Subject<User> = new Subject<User>();

  emitUserData(): void
  {
    this.mUserDataSubject.next(this.mUserData);
  }

  emitUser(): void
  {
    this.mUserSubject.next(this.mUser);
  }


  constructor(private mToast: ToastrService)
  {
    firebase.auth().onAuthStateChanged(
      // next
      (user: User) =>
      {
        // 1. Notify observers that user has changed
        this.mUser = user;
        this.emitUser();

        // 2. Notify observers that user data has changed
        if (user)
        {
          mToast.success('You are signed in.');
          // user is signed in !
          // Give the user a name when he doesn't have one
          if (!this.mUser.displayName)
          {
            this.updateUserProfile({displayName: generateUserName()})
              .then(() =>
              {
                this.emitUser();
              });
          }
          this.getUserDataFromServer();
        }
        else
        {
          mToast.warning('You are not signed in.');
          // no user is signed in !
          this.resetUserData();
        }
      }
    );
  }

  updateUserProfile(profile): Promise<void>
  {
    if (this.mUser)
    {
      return this.mUser.updateProfile(profile);
    }
    else
    {
      return new Promise<void>(() =>
      {
      });
    }
  }

  updateUserEmail(newEmail: string): Promise<void>
  {
    if (this.mUser)
    {
      return this.mUser.updateEmail(newEmail);
    }
    else
    {
      return new Promise<void>(() =>
      {
      });
    }
  }

  updateUserPassword(newPassword: string): Promise<void>
  {
    if (this.mUser)
    {
      return this.mUser.updatePassword(newPassword);
    }
    else
    {
      return new Promise<void>(() =>
      {
      });
    }
  }


  // Tries to permanently delete the current user, and signs him out as well
  deleteUser(): void
  {
    console.log('TODO: deleteUser');
  }


  // getOpinionOnPost(postUID: number): number
  // {
  //   if (this.mUserData.mLikedPosts.includes(postUID))
  //   {
  //     return 1;
  //   }
  //   else if (this.mUserData.mDislikedPosts.includes(postUID))
  //   {
  //     return -1;
  //   }
  //   else
  //   {
  //     return 0;
  //   }
  // }

  getOpinionOnComment(uid: number): number
  {
    if (this.mUserData.mLikedComments.includes(uid))
    {
      return 1;
    }
    else if (this.mUserData.mDislikedComments.includes(uid))
    {
      return -1;
    }
    else
    {
      return 0;
    }
  }

  cancelPost(postUID: number, wasLiked: boolean): void
  {
    if (wasLiked)
    {
      this.removeFromArray(this.mUserData.mLikedPosts, postUID);
    }
    else
    {
      this.removeFromArray(this.mUserData.mDislikedPosts, postUID);
    }
    this.saveUserDataToServer()
      .then(
        () =>
        {
          this.emitUserData();
        },
        (error) =>
        {
          this.mToast.error(error.message, error.code);
        });
  }

  likePost(postUID: number, wasDisliked: boolean): void
  {
    this.mUserData.mLikedPosts.push(postUID);
    if (wasDisliked)
    {
      this.removeFromArray(this.mUserData.mDislikedPosts, postUID);
    }
    this.saveUserDataToServer()
      .then(
        () =>
        {
          this.emitUserData();
        },
        (error) =>
        {
          this.mToast.error(error.message, error.code);
        });
  }

  dislikePost(postUID: number, wasLiked: boolean): void
  {
    this.mUserData.mDislikedPosts.push(postUID);
    if (wasLiked)
    {
      this.removeFromArray(this.mUserData.mLikedPosts, postUID);
    }
    this.saveUserDataToServer()
      .then(
        () =>
        {
          this.emitUserData();
        },
        (error) =>
        {
          this.mToast.error(error.message, error.code);
        });
  }

  removeFromArray(arr: Array<number>, target: number): void
  {
    const idx = arr.indexOf(target);
    if (idx > -1)
    {
      arr.splice(idx, 1);
    }
  }

  cancelComment(uid: number, wasLiked: boolean): void
  {
    if (wasLiked)
    {
      this.removeFromArray(this.mUserData.mLikedComments, uid);
    }
    else
    {
      this.removeFromArray(this.mUserData.mDislikedComments, uid);
    }
  }

  likeComment(uid: number, wasDisliked: boolean): void
  {
    this.mUserData.mLikedComments.push(uid);
    if (wasDisliked)
    {
      this.removeFromArray(this.mUserData.mDislikedComments, uid);
    }
    this.emitUserData();
    this.saveUserDataToServer();
  }

  dislikeComment(uid: number, wasLiked: boolean): void
  {
    this.mUserData.mDislikedComments.push(uid);
    if (wasLiked)
    {
      this.removeFromArray(this.mUserData.mLikedComments, uid);
    }
    this.emitUserData();
    this.saveUserDataToServer();
  }

  getUrlForUserData(): string
  {
    const usr: User = firebase.auth().currentUser;
    if (usr && usr.uid)
    {
      return ('/user-data/' + usr.uid);
    }
    else
    {
      return '';
    }
  }

  saveUserDataToServer(): Promise<any>
  {
    const url = this.getUrlForUserData();
    if (url)
    {
      return firebase.database().ref(url).set(this.mUserData);
    }
    else
    {
      return new Promise<any>((resolve, reject) =>
      {
        reject({
          message: 'User is not authenticated.',
          code: 'user-data-fail'
        });
      });
    }
  }

  private getUserDataFromServer(): void
  {
    const url = this.getUrlForUserData();
    if (url)
    {
      firebase.database().ref(url)
        .on('value', (data: DataSnapshot) =>
          {
            if (data.val())
            {
              this.mUserData = UserData.makeFromJSON(data.val());
            }
            else
            {
              this.mUserData = UserData.makeEmpty();
            }
            this.emitUserData();
          }
        );
    }
  }

  private resetUserData(): void
  {
    this.mUserData = UserData.makeEmpty();
    this.emitUserData();
  }

  createNewUserData(data: UserData): void
  {
    this.mUserData = data;
    this.saveUserDataToServer().then(
      () =>
      {
        this.emitUserData();
      });
  }
}
