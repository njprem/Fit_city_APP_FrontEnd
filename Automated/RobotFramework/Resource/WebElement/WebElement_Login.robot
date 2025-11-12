*** Variables ***
${TF_EMAIL_LOGIN}                 //input[@type='email']
${TF_PASSWORD_LOGIN}              //input[@type='password']
${BTN_SUBMIT_LOGIN}               //button[@type='submit' and text()='Log In']
${LBL_LOGIN_ERROR}                //form//p[contains(@class, 'text-red-600')]
${LNK_FORGOT_PASSWORD}            //a[contains(@href, 'forgot-password')]
${DIV_GOOGLE_CONTAINER_LOGIN}     (//main//div[@aria-live='polite'])[1]
