import {Component, OnDestroy, OnInit} from '@angular/core';
import {CardService} from '../services/card.service';
import {Subscription} from 'rxjs';
import {Card} from '../models/Card.model';
import {UserDataService} from '../services/user-data.service';
import firebase from 'firebase/app';
import 'firebase/auth';
import User = firebase.User;

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})
export class CardListComponent implements OnInit, OnDestroy
{
  mUser: User = null;
  mUserSubscription: Subscription;

  mCards: Card[] = [];
  mCardsSubscription: Subscription;

  constructor(private mUserDataService: UserDataService,
              private mCardService: CardService)
  {
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

    // Observe the changes of the list of posts
    this.mCardsSubscription = this.mCardService.mCardsSubject.subscribe(
      (data: Card[]) =>
      {
        // latest post appears first
        this.mCards = data; // .reverse();
      }
    );
    this.mCardService.emitCards();
  }

  ngOnDestroy(): void
  {
    if (this.mUserSubscription)
    {
      this.mUserSubscription.unsubscribe();
    }

    if (this.mCardsSubscription)
    {
      this.mCardsSubscription.unsubscribe();
    }
  }

  get isAuth(): boolean
  {
    return this.mUser != null;
  }

  get userDisplayName(): string
  {
    return this.isAuth ? this.mUser.displayName : 'anonymous reader';
  }
}
