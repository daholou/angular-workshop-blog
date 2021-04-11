// A simple service to display messages in the header bar

import {Subject} from 'rxjs';

export class ConsoleService
{
  private mMsg: string = '';
  subjectMsg: Subject<string> = new Subject<string>();

  emitMsg(): void
  {
    this.subjectMsg.next(this.mMsg);
  }

  log(msg: string): void
  {
    this.mMsg = msg;
    this.emitMsg();
  }
}
