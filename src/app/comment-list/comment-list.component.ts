import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {CommentModel} from '../models/Comment.model';
import {CommentService} from '../services/comment.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit, OnDestroy
{
  mComments: CommentModel[] = [];
  mCommentsSubscription: Subscription;

  constructor(private mCommentService: CommentService)
  {
  }

  ngOnInit(): void
  {
    this.mCommentsSubscription = this.mCommentService.mCommentsSubject
      .subscribe((comments: CommentModel[]) =>
      {
        console.log('CommentList received event from CommentService!',
          comments.length);
        this.mComments = comments;
      });
    this.mCommentService.emitComments();
  }

  introMsg(): string
  {
    const l: number = this.mComments.length;
    if (l === 0)
    {
      return 'Wow, such empty!';
    }
    else if (l === 1)
    {
      return 'Only 1 comment so far';
    }
    else
    {
      return l.toString() + ' comments on this post';
    }
  }

  ngOnDestroy(): void
  {
    if (this.mCommentsSubscription)
    {
      this.mCommentsSubscription.unsubscribe();
    }
  }
}
