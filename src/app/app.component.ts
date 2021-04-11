import {Component} from '@angular/core';

import firebase from 'firebase/app';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent
{
  title = 'angular-blog';

  constructor()
  {
    const config = {
      apiKey: 'AIzaSyACuQ55cJAV-72iKD15zcakL5VJf9-qQfE',
      authDomain: 'bookworm-e799b.firebaseapp.com',
      projectId: 'bookworm-e799b',
      storageBucket: 'bookworm-e799b.appspot.com',
      messagingSenderId: '742436381309',
      appId: '1:742436381309:web:488781c9b32844d84a8714',
      measurementId: 'G-FTWP5WXGTK',
    };
    firebase.initializeApp(config);


  }
}
