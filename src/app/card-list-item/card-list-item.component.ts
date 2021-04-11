import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Card} from '../models/Card.model';
import firebase from 'firebase/app';
import 'firebase/auth';
import User = firebase.User;
import {CardService} from '../services/card.service';
import {UserDataService} from '../services/user-data.service';
import {Subscription} from 'rxjs';
import {CommentService} from '../services/comment.service';

@Component({
  selector: 'app-card-list-item',
  templateUrl: './card-list-item.component.html',
  styleUrls: ['./card-list-item.component.scss']
})
export class CardListItemComponent implements OnInit, OnDestroy
{
  @Input() private mCard: Card = Card.makeEmpty();
  @Input() private mIndex: number = -1;

  mSelectedCard: Card = null;
  mSelectedCardSubscription: Subscription;

  mUser: User = null;
  mUserSubscription: Subscription;

  constructor(private mCommentService: CommentService,
              private mCardService: CardService,
              private mUserDataService: UserDataService)
  {
  }

  ngOnInit(): void
  {
    this.mSelectedCardSubscription = this.mCardService.mSelectedCardSubject
      .subscribe((card: Card) =>
      {
        this.mSelectedCard = card;
      });
    this.mCardService.emitSelectedCard();
    // this.mSelectedUIDSubscription = this.mCardService.mSelectedUIDSubject
    //   .subscribe((uid: number) =>
    //   {
    //     this.mSelectedUID = uid;
    //   });
    // this.mCardService.emitSelectedUID();

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
    if (this.mSelectedCardSubscription)
    {
      this.mSelectedCardSubscription.unsubscribe();
    }
    // if (this.mSelectedUIDSubscription)
    // {
    //   this.mSelectedUIDSubscription.unsubscribe();
    // }

    if (this.mUserSubscription)
    {
      this.mUserSubscription.unsubscribe();
    }
  }

  get isSelected(): boolean
  {
    return this.mSelectedCard &&
      (this.mCard.mPostUID === this.mSelectedCard.mPostUID);
  }

  onSelectPost(): void
  {
    if (!this.isSelected)
    {
      // this.mCardService.selectUID(this.mCard.mPostUID);
      this.mCardService.selectCard(this.mCard);
    }
  }

  get title(): string
  {
    return this.mIndex.toString() + ' - ' + this.mCard.mTitle;
  }

  get canEdit(): boolean
  {
    return this.mUser && this.mCard.mAuthorUID === this.mUser.uid;
  }

  get author(): string
  {
    return this.mCard.mAuthorName;
  }

  get date(): Date
  {
    return new Date(this.mCard.mPublishDate);
  }

  get nbLikes(): number
  {
    return this.mCard.mNbLikes;
  }

  get nbDislikes(): number
  {
    return this.mCard.mNbDislikes;
  }

  get percentNbLikes(): number
  {
    if (this.nbLikes === this.nbDislikes)
    {
      return 50;
    }
    else
    {
      const total = this.nbLikes + this.nbDislikes;
      return Math.round(100 * this.nbLikes / total);
    }
  }

  get percentNbDislikes(): number
  {
    return 100 - this.percentNbLikes;
  }

  get isPopular(): boolean
  {
    return this.mCard.mNbLikes > this.mCard.mNbDislikes;
  }

  get isUnpopular(): boolean
  {
    return this.mCard.mNbLikes < this.mCard.mNbDislikes;
  }
}
