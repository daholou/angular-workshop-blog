import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import {Card} from '../models/Card.model';
import {
  CardService,
  makeUploadTaskImgPost,
} from '../services/card.service';
import firebase from 'firebase';
import 'firebase/auth';

import {
  MAX_POST_IMG_SIZE_KB,
  UserDataService
} from '../services/user-data.service';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import User = firebase.User;
import UploadTask = firebase.storage.UploadTask;
import TaskState = firebase.storage.TaskState;


export function b2kb(byteSize: number): number
{
  return Math.round(byteSize / 1024);
}

@Component({
  selector: 'app-new-card',
  templateUrl: './new-card.component.html',
  styleUrls: ['./new-card.component.scss']
})
export class NewCardComponent implements OnInit, OnDestroy
{
  mUser: User = null;
  mUserSubscription: Subscription;

  mNewCardForm: FormGroup;

  mUploadTask: UploadTask = null;

  mFile: File = null;
  mPreviewImageURL: string = null;
  mSafePreviewImageURL: SafeUrl = null;

  constructor(private mToast: ToastrService,
              private mUserDataService: UserDataService,
              private mCardService: CardService,
              private mFormBuilder: FormBuilder,
              private mRouter: Router,
              private mSanitizer: DomSanitizer)
  {
  }

  ngOnInit(): void
  {
    this.initForm();

    this.mUserSubscription = this.mUserDataService.mUserSubject
      .subscribe((user: User) =>
      {
        this.mUser = user;
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

  initForm(): void
  {
    this.mNewCardForm = this.mFormBuilder.group({
      fTitle: ['My awesome post', [Validators.required]],
      fTextContent: ['', []],
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
        resolve('');
      }
      else if (b2kb(f.size) > MAX_POST_IMG_SIZE_KB)
      {
        const msg = ('File "' + f.name + '" is too large!' +
          ' It is ' + b2kb(f.size) + ' KB, which exceeds the size' +
          ' limit of ' + MAX_POST_IMG_SIZE_KB + ' KB. Please try again' +
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
        this.mUploadTask = makeUploadTaskImgPost(f);
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

  // When the user clicks on submit, we want to:
  // - check whether we need to upload a file or not.
  // - to do that we call a method that will try to upload mFile and
  // eventually return an url.
  // - if there is no file to upload, the url will be empty
  // - if there is a file to upload and that the upload fails, we need to
  //   cancel the submission and error-toast the problem.
  // - when the resulting url is returned to us (empty or not) we then
  //   success-toast and navigate back to the post page.
  // Not sure what happens if the user quits the page mid-upload, or
  // refreshes, or sign out. In those cases we would like to completely
  // cancel the upload and the post publication.
  onSubmitNewCardForm(): void
  {
    if (!this.isAuth)
    {
      this.mToast.error('You are not signed in!');
      return;
    }

    const postUID: number = Date.now();
    const title = this.fTitle.value;
    const textContent = this.fTextContent.value;
    const name = this.mUser.displayName;
    const authorUID = this.mUser.uid;
    const date = new Date().toJSON();

    // mFile is modified through the form with image file input. If it's
    // null then getUploadURL will just resolve with an empty url, no
    // worries there.
    this.getUploadURL(this.mFile).then(
      (resURL) =>
      {
        const card = new Card(postUID, title, textContent,
          name, authorUID, date, resURL);
        this.mCardService.createNewCard(card).then(
          () =>
          {
            this.mToast.success('Post created.');
            this.mRouter.navigate(['/posts']).then();
          },
          (error) =>
          {
            this.mToast.error(error.message, error.code);
          });
      },
      (error) =>
      {
        this.mToast.error(error.message, error.code);
      }
    );
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

  get fTextContent(): AbstractControl
  {
    return this.mNewCardForm.get('fTextContent');
  }

  get fTitle(): AbstractControl
  {
    return this.mNewCardForm.get('fTitle');
  }

  get maxCharCount(): number
  {
    return 100;
  }

  get curCharCount(): number
  {
    const txt: string = this.fTextContent.value;
    return txt.length;
  }

  get isAuth(): boolean
  {
    return this.mUser != null;
  }

  get fileSizeKB(): number
  {
    return this.mFile ? b2kb(this.mFile.size) : 0;
  }

  get isFileTooBig(): boolean
  {
    return this.fileSizeKB > MAX_POST_IMG_SIZE_KB;
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
