import {Subject} from 'rxjs';
import firebase from 'firebase/app';
import 'firebase/database';
import DataSnapshot = firebase.database.DataSnapshot;
import {CommentModel} from '../models/Comment.model';

export class CommentService
{
  constructor()
  {
    this.reset();
  }

  private mPostUID: number;
  mComments: CommentModel[];
  mCommentsSubject: Subject<CommentModel[]> = new Subject<CommentModel[]>();

  emitComments(): void
  {
    this.mCommentsSubject.next(this.mComments.slice());
  }

  reset(): void
  {
    this.mPostUID = 0;
    this.mComments = [];
    this.emitComments();
  }

  // Load comment data for a post of specific uid. Regardless of whether the
  // post is found or not, this method will call 'emitComments' at some
  // point (remember that reading from DB is an async operation!). Should
  // the required post not be found (deleted, nonexistent or whatever), the
  // comments array will simply be set to empty before firing emitComments.
  setPost(uid): void
  {
    this.mPostUID = uid;
    this.loadCommentsForPost();
  }

  addComment(comment: CommentModel): void
  {
    this.mComments.push(comment);
    this.emitComments();
    this.saveCommentsToServer();
  }

  private getUrlForComments(): string
  {
    if (this.mPostUID)
    {
      return '/comments/' + this.mPostUID.toString();
    }
    else
    {
      return '';
    }
  }

  private loadCommentsForPost(): void
  {
    const url = this.getUrlForComments();
    if (url)
    {
      firebase.database().ref(url)
        .on('value', (data: DataSnapshot) =>
          {
            this.mComments = data.val() ? data.val() : [];
            this.emitComments();
          }
        );
    }
    else
    {
      this.mComments = [];
      this.emitComments();
    }
  }

  private saveCommentsToServer(): void
  {
    const url: string = this.getUrlForComments();
    if (url)
    {
      firebase.database().ref(url).set(this.mComments)
        .then(
          () =>
          {
            console.log('CommentService: comments saved!');
          },
          () =>
          {
            console.error('CommentService: cannot save comments!');
          });
    }
  }

  deleteComments(deadUID: number): void
  {
    const url: string =  '/comments/' + deadUID;
    console.log('deleteComments', url);
    if (deadUID)
    {
      firebase.database().ref(url).remove()
        .then(
          () =>
          {
            console.log('CommentService: comments deleted!');
          },
          () =>
          {
            console.log('CommentService: cannot delete comments!');
          },
        );
      this.reset();
    }
  }

  updateVote(index: number, addLike: number, addDislike): void
  {
    if (index >= 0 && index < this.mComments.length)
    {
      this.mComments[index].mNbLikes += addLike;
      this.mComments[index].mNbDislikes += addDislike;
      this.emitComments();
      this.saveCommentsToServer();
    }
  }

}
