import {Component, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit
{
  mSignInForm: FormGroup;

  constructor(private mAuthService: AuthService,
              private mFormBuilder: FormBuilder,
              private mToast: ToastrService,
              private mRouter: Router)
  {
  }

  ngOnInit(): void
  {
    this.initForm();
  }

  initForm(): void
  {
    this.mSignInForm = this.mFormBuilder.group({
      fEmail: ['damien.aholou@orange.fr',
        [Validators.email, Validators.required]],
      fPassword: ['123456', [Validators.required, Validators.minLength(6)]],
    });
  }

  get fEmail(): AbstractControl
  {
    return this.mSignInForm.get('fEmail');
  }
  get fPassword(): AbstractControl
  {
    return this.mSignInForm.get('fPassword');
  }

  onSubmitSignInForm(): void
  {
    const email: string = this.mSignInForm.value.fEmail;
    const password: string = this.mSignInForm.value.fPassword;

    // attempt to sign in the user, on success go to its book list
    this.mAuthService.signInUser(email, password).then(
      () =>
      {
        this.mToast.success('Sign-in successful.');
        this.mRouter.navigate(['/user-profile']).then();
      },
      (error) =>
      {
        this.mToast.error(error.message, error.code);
      });
  }
}
