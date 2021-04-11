import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {Subscription} from 'rxjs';
import {
  MAX_POST_IMG_SIZE_KB,
  MAX_USR_IMG_SIZE_KB,
  UserDataService
} from '../services/user-data.service';

import firebase from 'firebase/app';
import 'firebase/auth';
import {
  deleteFileAtURL, makeUploadTaskImgUser
} from '../services/card.service';

import {ToastrService} from 'ngx-toastr';
import User = firebase.User;
import UploadTask = firebase.storage.UploadTask;
import TaskState = firebase.storage.TaskState;

import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {b2kb} from '../new-card/new-card.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy
{
  mUser: User = null;
  mUserSubscription: Subscription;

  // Forms for changing email, pwd, name, photo
  mEmailForm: FormGroup;
  mPasswordForm: FormGroup;
  mNameForm: FormGroup;
  mPhotoForm: FormGroup;

  mIsShowingDeleteAccount: boolean = false;

  mUploadTask: UploadTask = null;

  mFile: File = null;
  mPreviewImageURL: string = null;
  mSafePreviewImageURL: SafeUrl = null;

  constructor(private mToast: ToastrService,
              private mFormBuilder: FormBuilder,
              private mUserDataService: UserDataService,
              private mSanitizer: DomSanitizer)
  {
  }

  ngOnInit(): void
  {
    // Create the 3 forms
    this.initEmailForm();
    this.initPasswordForm();
    this.initNameForm();
    this.initPhotoForm();

    // Email form will observe changes to User
    this.mUserSubscription = this.mUserDataService.mUserSubject
      .subscribe((user: User) =>
      {
        this.mUser = user;
        this.onResetEmail();
        this.onResetName();
        this.onResetPassword();
      });
    this.mUserDataService.emitUser();
  }

  ngOnDestroy(): void
  {
    if (this.mUserSubscription)
    {
      this.mUserSubscription.unsubscribe();
    }
  }

  initEmailForm(): void
  {
    this.mEmailForm = this.mFormBuilder.group({
      fEmail: ['', [Validators.required, Validators.email, this.sameEmail]]
    });
  }

  // Arrow fn is used here to properly bind 'this'
  sameEmail = (c: FormControl) =>
  {
    return c.value === this.email ? {sameEmail: true} : null;
  }

  initPasswordForm(): void
  {
    this.mPasswordForm = this.mFormBuilder.group(
      {
        fPassword: ['', [Validators.required, Validators.minLength(6)]],
        fPassword2: ['', [Validators.required]],
      },
      // validator for the whole group !
      {validators: this.samePasswords});
  }

  samePasswords(fg: FormGroup): any
  {
    const pwd1 = fg.value.fPassword;
    const pwd2 = fg.value.fPassword2;
    return pwd1 === pwd2 ? null : {notSame: true};
  }

  initNameForm(): void
  {
    this.mNameForm = this.mFormBuilder.group({
      fDisplayName: ['', [Validators.required, this.sameName]]
    });
  }

  // Arrow fn is used here to properly bind 'this'
  sameName = (c: FormControl) =>
  {
    return c.value === this.displayName ? {sameName: true} : null;
  }

  initPhotoForm(): void
  {
    this.mPhotoForm = this.mFormBuilder.group({
      fPhotoURL: ['', [Validators.required]]
    });
  }

  // Free memory (revoke the blob) once the url has been used to display the
  // image
  onPreviewImageLoad(): void
  {
    URL.revokeObjectURL(this.mPreviewImageURL);
  }

  previewImage(event): void
  {
    this.mFile = event.target.files[0];
    this.mPreviewImageURL = URL.createObjectURL(this.mFile);
    this.mSafePreviewImageURL =
      this.mSanitizer.bypassSecurityTrustUrl(this.mPreviewImageURL);
  }

  clearImage(): void
  {
    this.mFile = null;
    this.mSafePreviewImageURL = null;
  }

  getUploadURL(f: File): Promise<string>
  {
    return new Promise<string>((resolve, reject) =>
    {
      if (!f)
      {
        reject({
          message: 'There is no file to upload.',
          code: 'no-file-to-upload'
        });
      }
      else if (b2kb(f.size) > MAX_USR_IMG_SIZE_KB)
      {
        const msg = ('File "' + f.name + '" is too large!' +
          ' It is ' + b2kb(f.size) + ' KB, which exceeds the size' +
          ' limit of ' + MAX_USR_IMG_SIZE_KB + ' KB. Please try again' +
          ' with a smaller file.');
        reject({message: msg, code: 'file-too-large'});
      }
      else if (this.hasUploadTask)
      {
        reject({
          message: 'A file upload is already in progress.',
          code: 'upload-in-progress'
        });
      }
      else
      {
        this.mUploadTask = makeUploadTaskImgUser(f);
        this.mUploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
          () =>
          {
            console.log(this.mUploadTask.snapshot.state,
              this.mUploadTask.snapshot.bytesTransferred);
          },
          (error) =>
          {
            reject(error);
          },
          () =>
          {
            const storageRef = this.mUploadTask.snapshot.ref;
            storageRef.getDownloadURL().then(
              (val) =>
              {
                resolve(val);
              },
              (error) =>
              {
                reject(error);
              }
            );
          });
      }
    });
  }

  // When the user clicks submit we need to:
  // - verify that there is a file to upload, if not we can error-toast or
  //   do nothing (the file, if any, is accessed through mFile)
  // - try to upload the file and getting a download url back, eventually.
  //   When we do get it, we can update the photoURL for the user.
  // - should the upload fail, just error-toast the problem and don't update.
  onSubmitChangePhoto(): void
  {
    // Keep the old photo url, to delete it from the DB after the change
    const oldPhotoURL = this.photoURL;
    // Try to upload the new file and obtain the new storage url
    this.getUploadURL(this.mFile).then(
      (resURL) =>
      {
        // Update user photoURL with the newly obtained url
        this.mUserDataService.updateUserProfile({photoURL: resURL})
          .then(
            () =>
            {
              this.mToast.success('Profile picture updated.');
              if (oldPhotoURL)
              {
                deleteFileAtURL(oldPhotoURL)
                  .then(
                    () =>
                    {
                      this.mToast.success('Deleted previous file.');
                    },
                    (error) =>
                    {
                      this.mToast.error(error.message, error.code);
                    }
                  );
              }
            },
            (error) =>
            {
              this.mToast.error(error.message, error.code);
            });
      },
      (error) =>
      {
        this.mToast.error(error.message, error.code);
      });
  }


  // processFiles(event): void
  // {
  //   const f: File = event.target.files[0];
  //
  //   if (!f)
  //   {
  //     this.mToast.error('No file was selected.');
  //     return;
  //   }
  //   else if (f.size > MAX_USR_IMG_SIZE_KB * 1024)
  //   {
  //     const curSizeKB: number = Math.round(f.size / 1024);
  //     this.mToast.error('File "' + f.name + '" is too large! ' +
  //       'It takes ' + curSizeKB + ' KB, which exceeds the size limit  of' +
  //       ' ' + MAX_USR_IMG_SIZE_KB + ' KB. Please try again with a' +
  //       ' smaller file.');
  //     return;
  //   }
  //
  //   // Start uploading the file
  //   this.mUploadTask = makeUploadTaskImgUser(f);
  //   this.mUploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, () =>
  //     {
  //     },
  //     (error) =>
  //     {
  //       this.mUploadTask = null;
  //       this.mToast.error(error.message, error.code);
  //     },
  //     () =>
  //     {
  //       const storageRef = this.mUploadTask.snapshot.ref;
  //       const oldPhotoURL = this.photoURL;
  //       this.mUploadTask = null;
  //       // Upload completed successfully, now we can get the download URL
  //       storageRef.getDownloadURL()
  //         .then(
  //           (downloadURL) =>
  //           {
  //             // Found the download url
  //             this.mUserDataService
  //               .updateUserProfile({photoURL: downloadURL})
  //               .then(
  //                 () =>
  //                 {
  //                   this.mToast.success('Profile picture updated.');
  //                   if (oldPhotoURL)
  //                   {
  //                     deleteFileAtURL(oldPhotoURL)
  //                       .then(
  //                         () =>
  //                         {
  //                           this.mToast.success('Deleted previous file.');
  //                         },
  //                         (error) =>
  //                         {
  //                           this.mToast.error('Could not delete old file.', error.code);
  //                         }
  //                       );
  //                   }
  //                 }
  //                 ,
  //                 (error) =>
  //                 {
  //                   this.mToast.error(error.message, error.code);
  //                 });
  //           });
  //     });
  // }

  onResetEmail(): void
  {
    this.fEmail.setValue(this.email);
  }

  onResetName(): void
  {
    this.fDisplayName.setValue(this.displayName);
  }

  onResetPassword(): void
  {
    this.fPassword.setValue('');
    this.fPassword2.setValue('');
  }

  onSubmitEmailForm(): void
  {
    const newEmail: string = this.mEmailForm.value.fEmail;
    this.mUserDataService.updateUserEmail(newEmail)
      .then(() =>
      {
        // Update successful.
        this.mToast.success('Email address updated.');
        this.fEmail.updateValueAndValidity();
      })
      .catch((error) =>
      {
        this.mToast.error(error.message, error.code);
      });
  }

  onSubmitPasswordForm(): void
  {
    const newPwd: string = this.mPasswordForm.value.fPassword;
    this.mUserDataService.updateUserPassword(newPwd)
      .then(() =>
      {
        this.mToast.success('Password updated.');
        this.fPassword.setValue('');
        this.fPassword2.setValue('');
      })
      .catch((error) =>
      {
        this.mToast.error(error.message, error.code);
      });
  }

  onSubmitNameForm(): void
  {
    const newName: string = this.mNameForm.value.fDisplayName;
    this.mUserDataService.updateUserProfile({displayName: newName})
      .then(() =>
      {
        // Update successful.
        this.mToast.success('User name updated.');
        this.fDisplayName.updateValueAndValidity();
      })
      .catch((error) =>
      {
        this.mToast.error(error.message, error.code);
      });
  }

  onDeletePhotoURL(): void
  {
    const oldPhotoURL = this.photoURL;
    if (oldPhotoURL)
    {
      this.mUserDataService.updateUserProfile({photoURL: null})
        .then(
          () =>
          {
            deleteFileAtURL(oldPhotoURL)
              .then(
                () =>
                {
                  this.mToast.success('Profile picture deleted.');
                },
                (error) =>
                {
                  this.mToast.error(error.message, error.code);
                });
          });
    }
  }

  onAskDeleteAccount(): void
  {
    this.mIsShowingDeleteAccount = !this.mIsShowingDeleteAccount;
  }

  onDeleteAccount(): void
  {
    this.mUserDataService.deleteUser();
  }

  get isAuth(): boolean
  {
    return this.mUser != null;
  }

  get email(): string
  {
    return this.mUser ? this.mUser.email : 'no user connected';
  }

  get displayName(): string
  {
    return this.mUser ? this.mUser.displayName : 'no user connected';
  }

  get photoURL(): string
  {
    return this.mUser ? this.mUser.photoURL : '';
  }

  get fEmail(): AbstractControl
  {
    return this.mEmailForm.get('fEmail');
  }

  get fPassword(): AbstractControl
  {
    return this.mPasswordForm.get('fPassword');
  }

  get fPassword2(): AbstractControl
  {
    return this.mPasswordForm.get('fPassword2');
  }

  get fDisplayName(): AbstractControl
  {
    return this.mNameForm.get('fDisplayName');
  }

  get fileSizeKB(): number
  {
    return this.mFile ? b2kb(this.mFile.size) : 0;
  }

  get isFileTooBig(): boolean
  {
    return this.fileSizeKB > MAX_USR_IMG_SIZE_KB;
  }

  get hasUploadTask(): boolean
  {
    if (this.mUploadTask)
    {
      const state: TaskState = this.mUploadTask.snapshot.state;
      return [TaskState.RUNNING, TaskState.PAUSED].includes(state);
    }
    else
    {
      return false;
    }
  }

  get taskProgressPercent(): number
  {
    if (this.mUploadTask)
    {
      return Math.round(100 * this.mUploadTask.snapshot.bytesTransferred
        / this.mUploadTask.snapshot.totalBytes);
    }
    else
    {
      return 0;
    }
  }
}
