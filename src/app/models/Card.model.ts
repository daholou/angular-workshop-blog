// Dates are directly represented as strings (ISO formatting) for easier
// JSON serialization when exchanging data with the server.
// For the sake of simplicity, we're assuming that the post date is a unique
// identifier of the post. This will allow us to prevent multiple likes or
// dislikes on the same post by the same user. One user can either like,
// dislike, or have no opinion on any given post.
export class Card
{
  constructor(public mPostUID: number,
              public mTitle: string,
              public mTextContent: string,
              public mAuthorName: string,
              public mAuthorUID: string,
              public mPublishDate: string,
              public mImgURL: string,
              public mNbLikes: number = 0,
              public mNbDislikes: number = 0)
  {
  }

  static makeFromJSON(obj): Card
  {
    return new Card(
      obj.mPostUID,
      obj.mTitle,
      obj.mTextContent,
      obj.mAuthorName,
      obj.mAuthorUID,
      obj.mPublishDate,
      obj.mImgURL,
      obj.mLikes,
      obj.mDislikes);
  }

  static makeEmpty(): Card
  {
    return new Card(
      0,
      'There\'s nothing here',
      'absolutely nothing',
      '',
      '',
      '',
      '',
      0,
      0);
  }
}
