import {Component, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit
{
  mSignUpForm: FormGroup;

  constructor(private mToast: ToastrService,
              private mAuthService: AuthService,
              private mFormBuilder: FormBuilder,
              private mRouter: Router)
  {
  }

  ngOnInit(): void
  {
    this.initForm();
  }

  // This method will validate the group form (so that we validate anytime
  // whatever field is modified) to check that both passwords are equal
  samePasswords(fg: FormGroup): any
  {
    const pwd1 = fg.value.fPassword;
    const pwd2 = fg.value.fPassword2;
    return pwd1 === pwd2 ? null : {notSame: true};
  }

  initForm(): void
  {
    this.mSignUpForm = this.mFormBuilder.group(
      {
        fEmail: ['', [Validators.email, Validators.required]],
        fPassword: ['', [Validators.required, Validators.minLength(6)]],
        fPassword2: ['', [Validators.required]],
      },
      // validator for the whole group !
      {validators: this.samePasswords});
  }

  get fEmail(): AbstractControl
  {
    return this.mSignUpForm.get('fEmail');
  }

  get fPassword(): AbstractControl
  {
    return this.mSignUpForm.get('fPassword');
  }


  onSubmitSignUpForm(): void
  {
    const v = this.mSignUpForm.value;

    const email: string = v.fEmail;
    const password: string = v.fPassword;

    // attempt to sign in the user, on success go to its book list
    this.mAuthService.createNewUser(email, password).then(
      () =>
      {
        this.mToast.success('Account created! Signing in.');
        this.mRouter.navigate(['/user-profile']).then();
      },
      (error) =>
      {
        this.mToast.error(error.message, error.code);
      });
  }
}
