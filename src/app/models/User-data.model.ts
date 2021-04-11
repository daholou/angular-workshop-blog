// Dates are directly represented as strings (ISO formatting) for easier
// JSON serialization when exchanging data with the server.
export class UserData
{
  constructor(public mLikedPosts: Array<number> = [],
              public mDislikedPosts: Array<number> = [],
              public mLikedComments: Array<number> = [],
              public mDislikedComments: Array<number> = [])
  {
  }

  static makeFromJSON(obj): UserData
  {
    return new UserData(
      obj.mLikedPosts,
      obj.mDislikedPosts,
      obj.mLikedComments,
      obj.mDislikedComments);
  }

  static makeEmpty(): UserData
  {
    return new UserData(
      [],
      [],
      [],
      []);
  }
}


