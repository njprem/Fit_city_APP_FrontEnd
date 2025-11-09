*** Variables ***
${TF_EMAIL_FORGOT}             //form[.//button[normalize-space()='Send OTP']]//input[@type='email']
${BTN_SEND_OTP}                //button[normalize-space()='Send OTP']
${BTN_RESEND_OTP}              //button[contains(normalize-space(), 'Resend')]
${NOTICE_FORGOT_PASSWORD}      //p[contains(@class, 'text-teal-700')]
${ALERT_FORGOT_PASSWORD}       //p[contains(@class, 'text-red-700')]
${TF_OTP}                      //input[@placeholder='6-digit code']
${TF_NEW_PASSWORD}             //input[@placeholder='Minimum 12 characters']
${TF_CONFIRM_NEW_PASSWORD}     //input[@placeholder='Re-type your password']
