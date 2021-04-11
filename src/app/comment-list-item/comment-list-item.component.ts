import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommentModel} from '../models/Comment.model';
import {CommentService} from '../services/comment.service';
import {UserDataService} from '../services/user-data.service';
import {Subscription} from 'rxjs';
import firebase from 'firebase/app';
import User = firebase.User;

@Component({
  selector: 'app-comment-list-item',
  templateUrl: './comment-list-item.component.html',
  styleUrls: ['./comment-list-item.component.scss']
})
export class CommentListItemComponent implements OnInit, OnDestroy
{
  @Input() public mComment: CommentModel;
  @Input() public mIndex: number;

  mUser: User = null;
  mUserSubscription: Subscription;

  constructor(private mUserDataService: UserDataService,
              private mCommentService: CommentService)
  {
    this.mIndex = -1;
    this.mComment = CommentModel.makeEmpty();
  }

  date(): Date
  {
    return new Date(this.mComment.mDate);
  }

  ngOnInit(): void
  {
    // Observe the changes of user
    this.mUserSubscription = this.mUserDataService.mUserSubject
      .subscribe((user: User) =>
      {
        this.mUser = user;
      });
    this.mUserDataService.emitUser();
  }

  isAuth(): boolean
  {
    return this.mUser != null;
  }

  isLikedByUser(): boolean
  {
    return this.mUserDataService
      .getOpinionOnComment(this.mComment.mUID) === 1;
  }

  isDislikedByUser(): boolean
  {
    return this.mUserDataService
      .getOpinionOnComment(this.mComment.mUID) === -1;
  }

  onLike(): void
  {
    const uid: number = this.mComment.mUID;
    // user opinion on the comment (+1 for like, -1 for dislike, 0 otherwise)
    const opinion = this.mUserDataService.getOpinionOnComment(uid);
    // opinion === 1 --> 1    ==>  cancel the like
    // opinion === 0 --> 1    ==>  +1 like
    // opinion ===-1 --> 1    ==>  -1 dislike AND +1 like
    if (opinion === 1)
    {
      this.mCommentService.updateVote(this.mIndex, -1, 0);
      this.mUserDataService.cancelComment(uid, true);
    }
    else if (opinion === 0)
    {
      this.mCommentService.updateVote(this.mIndex, 1, 0);
      this.mUserDataService.likeComment(uid, false);
    }
    else if (opinion === -1)
    {
      this.mCommentService.updateVote(this.mIndex, 1, -1);
      this.mUserDataService.likeComment(uid, true);
    }
  }

  onDislike(): void
  {
    const uid: number = this.mComment.mUID;
    // user opinion on the comment (+1 for like, -1 for dislike, 0 otherwise)
    const opinion = this.mUserDataService.getOpinionOnComment(uid);
    // opinion ===-1 -->-1    ==>  cancel the dislike
    // opinion === 0 -->-1    ==>  +1 dislike
    // opinion === 1 -->-1    ==>  +1 dislike AND -1 like
    console.log('opinion', opinion);
    if (opinion === -1)
    {
      this.mCommentService.updateVote(this.mIndex, 0, -1);
      this.mUserDataService.cancelComment(uid, false);
    }
    else if (opinion === 0)
    {
      this.mCommentService.updateVote(this.mIndex, 0, 1);
      this.mUserDataService.dislikeComment(uid, false);
    }
    else if (opinion === 1)
    {
      this.mCommentService.updateVote(this.mIndex, -1, 1);
      this.mUserDataService.dislikeComment(uid, true);
    }
  }

  ngOnDestroy(): void
  {
    if (this.mUserSubscription)
    {
      this.mUserSubscription.unsubscribe();
    }
  }


}
