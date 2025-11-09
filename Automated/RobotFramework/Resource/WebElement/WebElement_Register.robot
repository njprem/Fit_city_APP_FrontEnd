*** Variables ***
${TF_EMAIL_REGISTER}                   //form//input[@type='email']
${TF_PASSWORD_REGISTER}                //input[@type='password' and @placeholder='Password']
${TF_CONFIRM_PASSWORD_REGISTER}        //input[@type='password' and @placeholder='Confirm Password']
${CHK_TNC_REGISTER}                    //form//input[@type='checkbox']
${BTN_SUBMIT_REGISTER}                 //button[@type='submit' and normalize-space()='Sign Up']
${PASSWORD_STRENGTH_METER}             //*[contains(@data-testid, 'password-strength') or contains(@class, 'password-strength')]
${DIV_GOOGLE_CONTAINER_REGISTER}       (//form//following::div[@aria-live='polite'])[1]
${LBL_REGISTER_ERROR}                  //form//div[@role='alert']
