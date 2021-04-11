// This service helps centralize all data on cards (posts) that our
// application requires.
// It's useful for getting the list of blog posts made by a user of given id.
// It lets us create new posts, update or delete an existing post.


import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
// import DataSnapshot = firebase.database.DataSnapshot;
import {Card} from '../models/Card.model';
import {Subject} from 'rxjs';
import DataSnapshot = firebase.database.DataSnapshot;
import UploadTask = firebase.storage.UploadTask;


export class CardService
{
  // list of posts
  private mCards: Card[] = [];
  // subject for notifying changes to our observers
  mCardsSubject: Subject<Card[]> = new Subject<Card[]>();

  // private mSelectedUID: number = -1;
  // mSelectedUIDSubject: Subject<number> = new Subject<number>();

  private mSelectedCard: Card = null;
  mSelectedCardSubject: Subject<Card> = new Subject<Card>();

  // notify all observers with the updated list of cards
  emitCards(): void
  {
    this.mCardsSubject.next(this.mCards.slice());
  }

  // emitSelectedUID(): void
  // {
  //   this.mSelectedUIDSubject.next(this.mSelectedUID);
  // }

  emitSelectedCard(): void
  {
    this.mSelectedCardSubject.next(this.mSelectedCard);
  }

  // selectUID(uid: number): void
  // {
  //   this.mSelectedUID = uid;
  //   this.emitSelectedUID();
  // }
  selectCard(card: Card): void
  {
    this.mSelectedCard = card;
    this.emitSelectedCard();
  }

  constructor()
  {
    this.getCardsFromServer();
  }

  // Creates a new card in the DB by means of firebase.database.set().
  // Also returns the same Promise as set(), with no value on success and an
  // error on fail.
  createNewCard(card: Card): Promise<any>
  {
    this.mCards.push(card);
    this.sortByDecreasingDate();
    this.emitCards();
    return this.saveCardsToServer();
  }

  private getUrlForPosts(): string
  {
    return '/all-posts';
  }

  private saveCardsToServer(): Promise<any>
  {
    const url: string = this.getUrlForPosts();
    console.log('saveCardsToServer', this.mCards);
    return firebase.database().ref(url).set(this.mCards);
  }

  // fetch all cards from the database
  private getCardsFromServer(): void
  {
    const url: string = this.getUrlForPosts();
    firebase.database().ref(url)
      .on('value', (data: DataSnapshot) =>
        {
          this.mCards = data.val() ? data.val() : [];
          this.sortByDecreasingDate();
          this.emitCards();
        }
      );
  }

  deleteCard(index: number): void
  {
    if (index >= 0 && index < this.mCards.length)
    {
      const card: Card = this.mCards[index];
      if (card.mImgURL)
      {
        const storageRef = firebase.storage().refFromURL(card.mImgURL);
        storageRef.delete().then(
          () =>
          {
            console.log('Photo removed!');
          },
          (error) =>
          {
            console.log('Could not remove photo! : ' + error);
          }
        );
      }

      this.mCards.splice(index, 1);
      this.emitCards();
      this.saveCardsToServer();
    }
  }


  // // Returns the card with a specific uid. When no card with that uid is
  // // found, this method returns a blank card.
  // getCardByUID(uid: number): Card
  // {
  //   for (const card of this.mCards)
  //   {
  //     if (card.mPostUID === uid)
  //     {
  //       return card;
  //     }
  //   }
  //   return Card.makeEmpty();
  // }

  // updateVote(uid: number, addLike: number, addDislike): void
  // {
  //   const target: Card = this.getCardByUID(uid);
  //   target.mNbLikes += addLike;
  //   target.mNbDislikes += addDislike;
  //   this.emitCards();
  //   this.saveCardsToServer();
  // }
  updateVote(card: Card, addLike: number, addDislike): void
  {
    card.mNbLikes += addLike;
    card.mNbDislikes += addDislike;
    this.emitCards();
    this.saveCardsToServer();
  }

  // sort all cards, by decreasing date (even though it's not really clean,
  // we can use postUID to achieve that easily.
  sortByDecreasingDate(): void
  {
    this.mCards.sort((a, b) =>
    {
      return b.mPostUID - a.mPostUID;
    });
  }
}

export function makeUploadTaskImgPost(file: File): UploadTask
{
  return makeUploadTask('images/posts/', file);
}

export function makeUploadTaskImgUser(file: File): UploadTask
{
  return makeUploadTask('images/users/', file);
}

export function makeUploadTask(root: string, file: File): UploadTask
{
  const uid: string = Date.now().toString();
  const path: string = root + uid + file.name;
  const storageRef = firebase.storage().ref().child(path);
  return storageRef.put(file);
}

export function deleteFileAtURL(url: string): Promise<any>
{
  const storageRef = firebase.storage().refFromURL(url);
  return storageRef.delete();
}

