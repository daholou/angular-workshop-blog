export class CommentModel
{
  constructor(public mPostUID: number,
              public mText: string,
              public mAuthorName: string,
              public mAuthorUID: string,
              public mDate: string,
              public mUID: number,
              public mNbLikes: number = 0,
              public mNbDislikes: number = 0)
  {
  }

  static makeFromJSON(obj): CommentModel
  {
    return new CommentModel(
      obj.mmPostUID,
      obj.mText,
      obj.mAuthorName,
      obj.mAuthorUID,
      obj.mDate,
      obj.mUID,
      obj.mNbLikes,
      obj.mNbDislikes);
  }

  static makeEmpty(): CommentModel
  {
    return new CommentModel(
      0,
      '',
      '',
      '',
      '',
      0,
      0,
      0);
  }
}
