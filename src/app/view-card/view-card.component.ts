import {Component, OnDestroy, OnInit} from '@angular/core';
import {CardService} from '../services/card.service';
import {Card} from '../models/Card.model';
import {UserData} from '../models/User-data.model';
import {UserDataService} from '../services/user-data.service';
import {Subscription} from 'rxjs';
import {NgForm} from '@angular/forms';
import {CommentService} from '../services/comment.service';
import {CommentModel} from '../models/Comment.model';
import firebase from 'firebase/app';
import 'firebase/auth';
import User = firebase.User;

@Component({
  selector: 'app-view-card',
  templateUrl: './view-card.component.html',
  styleUrls: ['./view-card.component.scss']
})
export class ViewCardComponent implements OnInit, OnDestroy
{
  mCard: Card = Card.makeEmpty();
  mCardPublishDate: Date = new Date();
  mSelectedCardSubscription: Subscription;

  mUserData: UserData = UserData.makeEmpty();
  mUserDataSubscription: Subscription;

  mUser: User = null;
  mUserSubscription: Subscription;

  mDoesUserLikePost: boolean = false;
  mDoesUserDislikePost: boolean = false;

  constructor(private mCommentService: CommentService,
              private mCardService: CardService,
              private mUserDataService: UserDataService)
  {
  }

  ngOnInit(): void
  {
    // On selected uid change, load contents for the selected card
    this.mSelectedCardSubscription = this.mCardService.mSelectedCardSubject
      .subscribe((card: Card) =>
      {
        this.mCard = card;
        this.mCardPublishDate = this.mCard ?
          new Date(this.mCard.mPublishDate) : new Date();
        // change card ==> update user preferences
        this.refreshUserPreferences();
        // (async) load comments data for the card
        this.mCommentService.setPost(this.mCard ? this.mCard.mPostUID : -1);
      });
    this.mCardService.emitSelectedCard();

    // Observe the changes of user
    this.mUserSubscription = this.mUserDataService.mUserSubject
      .subscribe((user: User) =>
      {
        this.mUser = user;
      });
    this.mUserDataService.emitUser();

    this.mUserDataSubscription = this.mUserDataService.mUserDataSubject
      .subscribe((data: UserData) =>
      {
        this.mUserData = data;
        // change user data ==> update user preferences
        this.refreshUserPreferences();
      });
    this.mUserDataService.emitUserData();
  }

  ngOnDestroy(): void
  {
    if (this.mSelectedCardSubscription)
    {
      this.mSelectedCardSubscription.unsubscribe();
    }

    if (this.mUserDataSubscription)
    {
      this.mUserDataSubscription.unsubscribe();
    }

    if (this.mUserSubscription)
    {
      this.mUserSubscription.unsubscribe();
    }
  }

  // Assuming the connected user data or selected card has changed, this method
  // sets the correct flags for indicating whether the current user likes or
  // dislikes the current card.
  // Should be called everytime the userdata or card changes.
  refreshUserPreferences(): void
  {
    if (this.mCard)
    {
      const postUID: number = this.mCard.mPostUID;
      this.mDoesUserLikePost = this.mUserData.mLikedPosts.includes(postUID);
      // slight optimisation, since {likes} and {dislikes} are disjoint
      this.mDoesUserDislikePost = (!this.mDoesUserLikePost) &&
        this.mUserData.mDislikedPosts.includes(postUID);
    }
    else
    {
      this.mDoesUserLikePost = this.mDoesUserDislikePost = false;
    }
  }

  get isSomethingSelected(): boolean
  {
    return this.mCard != null;
  }

  get isAuth(): boolean
  {
    return this.mUser != null;
  }

  get isAuthor(): boolean
  {
    return this.isSomethingSelected && this.isAuth &&
      (this.mCard.mAuthorUID === this.mUser.uid);
  }

  onLike(): void
  {
    // opinion === 1 --> 1    ==>  cancel the like
    // opinion ===-1 --> 1    ==>  -1 dislike AND +1 like
    // opinion === 0 --> 1    ==>  +1 like
    if (this.mDoesUserLikePost)
    {
      this.mDoesUserLikePost = false;
      this.mDoesUserDislikePost = false;
      this.mCardService.updateVote(this.mCard, -1, 0);
      this.mUserDataService.cancel(this.mCard.mPostUID, true);
    }
    else if (this.mDoesUserDislikePost)
    {
      this.mDoesUserLikePost = true;
      this.mDoesUserDislikePost = false;
      this.mCardService.updateVote(this.mCard, 1, -1);
      this.mUserDataService.like(this.mCard.mPostUID, true);
    }
    else
    {
      this.mDoesUserLikePost = true;
      this.mDoesUserDislikePost = false;
      this.mCardService.updateVote(this.mCard, 1, 0);
      this.mUserDataService.like(this.mCard.mPostUID, false);
    }
  }

  onDislike(): void
  {
    // opinion ===-1 -->-1    ==>  cancel the dislike
    // opinion === 1 -->-1    ==>  +1 dislike AND -1 like
    // opinion === 0 -->-1    ==>  +1 dislike
    if (this.mDoesUserDislikePost)
    {
      this.mDoesUserLikePost = false;
      this.mDoesUserDislikePost = false;
      this.mCardService.updateVote(this.mCard, 0, -1);
      this.mUserDataService.cancel(this.mCard.mPostUID, false);
    }
    else if (this.mDoesUserLikePost)
    {
      this.mDoesUserLikePost = false;
      this.mDoesUserDislikePost = true;
      this.mCardService.updateVote(this.mCard, -1, 1);
      this.mUserDataService.dislike(this.mCard.mPostUID, true);
    }
    else
    {
      this.mDoesUserLikePost = false;
      this.mDoesUserDislikePost = true;
      this.mCardService.updateVote(this.mCard, 0, 1);
      this.mUserDataService.dislike(this.mCard.mPostUID, false);
    }
  }

  // onDeletePost(): void
  // {
  //   const deadUID: number = this.mCard.mPostUID;
  //   this.mCardService.deleteCard(this.mIndex);
  //   this.mSelectedCardService.reset();
  //   this.mCommentService.deleteComments(deadUID);
  // }

  onNewComment(form: NgForm): void
  {
    const comment: CommentModel = CommentModel.makeEmpty();
    comment.mPostUID = this.mCard.mPostUID;
    comment.mText = form.value.fText;
    comment.mAuthorName = 'toto';
    comment.mAuthorUID = this.mUser.uid;
    comment.mDate = new Date().toJSON();
    comment.mUID = Date.now();
    comment.mNbLikes = 0;
    comment.mNbDislikes = 0;
    this.mCommentService.addComment(comment);
  }
}
