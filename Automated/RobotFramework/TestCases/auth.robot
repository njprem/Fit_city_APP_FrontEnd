*** Settings ***
Library           SeleniumLibrary
Library           Collections
Library           RequestsLibrary
Resource          ../Resource/Keywords/LoginKeyword.robot
Resource          ../Resource/Candidates.robot

*** Variables ***
${BASE URL}                             https://fit-city.kaminjitt.com
${API_BASE_URL}                         https://fit-city.kaminjitt.com
${LOGIN_ENDPOINT}                       /api/v1/auth/login
${MAX_LOGIN_RESPONSE_TIME_MS}           500
${RATE_LIMIT_ATTEMPTS}                  15
${EXPECTED_MSG_EMAIL_EXISTS}            email already registered
${EXPECTED_MSG_INVALID_CREDS}           invalid credentials
${EXPECTED_MSG_ACCOUNT_NOT_FOUND}       account not found
${EXPECTED_MSG_PASSWORD_POLICY}         password must be at least 12 characters
${EXPECTED_MSG_SESSION_EXPIRED}         session expired
${HTTP_BASE_URL}                        http://fit-city.kaminjitt.com
${HTTP_LOGIN_URL}                       ${HTTP_BASE_URL}/login
${FAVORITES_URL}                        ${BASE URL}/favorite

*** Test Cases ***
REG-001 Register With Valid Email And Strong Password
    ${email}=        Generate Unique Email
    ${password}=     Generate Strong Password
    Open Browser To Register Page    ${BASE URL}
    Input Text       ${TF_EMAIL_REGISTER}           ${email}
    Input Text       ${TF_PASSWORD_REGISTER}        ${password}
    Input Text       ${TF_CONFIRM_PASSWORD_REGISTER}    ${password}
    Select Checkbox  ${CHK_TNC_REGISTER}
    Click Button     ${BTN_SUBMIT_REGISTER}
    Wait Until Keyword Succeeds    5x    2s    Validate Successful Login    ${email}
    Logout In Home    ${email}
    [Teardown]       Close Browser

REG-002 Register With Existing Email Shows Error
    ${password}=     Generate Strong Password
    Open Browser To Register Page    ${BASE URL}
    Input Text       ${TF_EMAIL_REGISTER}           ${USER_01_EMAIL}
    Input Text       ${TF_PASSWORD_REGISTER}        ${password}
    Input Text       ${TF_CONFIRM_PASSWORD_REGISTER}    ${password}
    Select Checkbox  ${CHK_TNC_REGISTER}
    Click Button     ${BTN_SUBMIT_REGISTER}
    ${alert_text}=    Handle Alert    action=ACCEPT
    Should Be Equal    ${alert_text}    ${EXPECTED_MSG_EMAIL_EXISTS}    ignore_case=true
    [Teardown]       Close Browser


REG-004 Register With Weak Password Rejected
    ${email}=        Generate Unique Email
    Open Browser To Register Page    ${BASE URL}
    Input Text       ${TF_EMAIL_REGISTER}           ${email}
    Input Text       ${TF_PASSWORD_REGISTER}        ${WEAK_PASSWORD}
    Input Text       ${TF_CONFIRM_PASSWORD_REGISTER}    ${WEAK_PASSWORD}
    Select Checkbox  ${CHK_TNC_REGISTER}
    Click Button     ${BTN_SUBMIT_REGISTER}
    ${error_text}=    Handle Alert    action=ACCEPT
    Should Not Be Empty    ${error_text}
    [Teardown]       Close Browser

REG-005 Register Without Accepting Terms Prevented
    ${email}=        Generate Unique Email
    ${password}=     Generate Strong Password
    Open Browser To Register Page    ${BASE URL}
    Input Text       ${TF_EMAIL_REGISTER}           ${email}
    Input Text       ${TF_PASSWORD_REGISTER}        ${password}
    Input Text       ${TF_CONFIRM_PASSWORD_REGISTER}    ${password}
    Element Should Be Disabled    ${BTN_SUBMIT_REGISTER}
    [Teardown]       Close Browser

LOG-001 Login With Valid Credentials
    Open Browser To Login Page      ${BASE URL}
    Login With Valid Credentials    ${USER_01_EMAIL}    ${USER_01_PASSWORD}
    Logout In Home                  ${USER_01_EMAIL}
    [Teardown]       Close Browser

LOG-002 Login With Wrong Password Shows Error
    Open Browser To Login Page    ${BASE URL}
    Input Text       ${TF_EMAIL_LOGIN}      ${USER_01_EMAIL}
    Input Text       ${TF_PASSWORD_LOGIN}   WrongPass!23
    Click Element    ${BTN_SUBMIT_LOGIN}
    Login Error Message Should Contain    ${EXPECTED_MSG_INVALID_CREDS}
    [Teardown]       Close Browser

LOG-003 Login With Unregistered Email Shows Error
    ${email}=        Generate Unique Email
    Open Browser To Login Page    ${BASE URL}
    Input Text       ${TF_EMAIL_LOGIN}      ${email}
    Input Text       ${TF_PASSWORD_LOGIN}   ${DEFAULT_STRONG_PASSWORD}
    Click Element    ${BTN_SUBMIT_LOGIN}
    Login Error Message Should Contain    ${EXPECTED_MSG_ACCOUNT_NOT_FOUND}
    [Teardown]       Close Browser

LOG-004 Forgot Password Flow Sends Reset Notice
    Open Browser To Forgot Password Page    ${BASE URL}
    Input Text       ${TF_EMAIL_FORGOT}     ${USER_01_EMAIL}
    Click Button     ${BTN_SEND_OTP}
    Wait Until Element Is Visible    ${NOTICE_FORGOT_PASSWORD}    timeout=10s
    Element Should Contain    ${NOTICE_FORGOT_PASSWORD}    OTP has been sent
    [Teardown]       Close Browser

LOG-005 Login Form Validation Prevents Blank Submission
    Open Browser To Login Page    ${BASE URL}
    Element Should Be Disabled    ${BTN_SUBMIT_LOGIN}
    Input Text       ${TF_EMAIL_LOGIN}      ${USER_01_EMAIL}
    Element Should Be Disabled    ${BTN_SUBMIT_LOGIN}
    Reload Page
    Input Text       ${TF_PASSWORD_LOGIN}   ${USER_01_PASSWORD}
    Element Should Be Disabled    ${BTN_SUBMIT_LOGIN}
    [Teardown]       Close Browser

LOG-006 Session Persists After Refresh
    Open Browser To Login Page      ${BASE URL}
    Login With Valid Credentials    ${USER_01_EMAIL}    ${USER_01_PASSWORD}
    Reload Page
    Validate Successful Login       ${USER_01_EMAIL}
    Logout In Home                  ${USER_01_EMAIL}
    [Teardown]       Close Browser

LOGG-004 Access Protected Route Requires Login
    Open Browser At    ${FAVORITES_URL}
    Wait Until Element Is Visible    ${HEADING_UNAUTHORIZED}    timeout=10s
    [Teardown]       Close Browser

LOGG-005 Access Protected Route After Login Succeeds
    Open Browser To Login Page      ${BASE URL}
    Login With Valid Credentials    ${USER_01_EMAIL}    ${USER_01_PASSWORD}
    Go To    ${FAVORITES_URL}
    Wait Until Element Is Visible   ${HEADING_FAVORITES}    timeout=10s
    Logout In Home                  ${USER_01_EMAIL}
    [Teardown]       Close Browser

LOGOUT-001 Logout Clears Session
    Open Browser To Login Page      ${BASE URL}
    Login With Valid Credentials    ${USER_01_EMAIL}    ${USER_01_PASSWORD}
    Logout In Home                  ${USER_01_EMAIL}
    Location Should Contain         /login
    [Teardown]       Close Browser

LOGOUT-002 Protected Page After Logout Redirects
    Open Browser To Login Page      ${BASE URL}
    Login With Valid Credentials    ${USER_01_EMAIL}    ${USER_01_PASSWORD}
    Go To    ${FAVORITES_URL}
    Wait Until Element Is Visible   ${HEADING_FAVORITES}    timeout=10s
    Logout In Home                  ${USER_01_EMAIL}
    Go To    ${FAVORITES_URL}
    Wait Until Element Is Visible   ${HEADING_UNAUTHORIZED}    timeout=10s
    [Teardown]       Close Browser

NFR-001 HTTP Entry Redirects To HTTPS
    Open Browser At    ${HTTP_LOGIN_URL}
    ${current_url}=    Get Location
    Should Start With  ${current_url}    https://
    [Teardown]       Close Browser

# NFR-002 Rate Limiting After Failed Logins
#     Skip    Rate limiting configuration is environment-dependent and may be disabled.

# NFR-003 Login Response Time Under Threshold
#     Create Session    AuthAPI    ${API_BASE_URL}
#     ${payload}=    Create Dictionary    email=${USER_01_EMAIL}    password=${USER_01_PASSWORD}
#     ${response}=   Post On Session    AuthAPI    ${LOGIN_ENDPOINT}    json=${payload}
#     Status Should Be    ${response}    200
#     ${elapsed_ms}=    Evaluate    round(response.elapsed.total_seconds() * 1000, 2)    response=${response}
#     Should Be True     ${elapsed_ms} <= ${MAX_LOGIN_RESPONSE_TIME_MS}    Login API responded in ${elapsed_ms} ms which exceeds ${MAX_LOGIN_RESPONSE_TIME_MS} ms

NFR-004 Error Messaging Remains User Friendly
    Open Browser To Login Page    ${BASE URL}
    Input Text       ${TF_EMAIL_LOGIN}      ${USER_01_EMAIL}
    Input Text       ${TF_PASSWORD_LOGIN}   WrongPass!23
    Click Element    ${BTN_SUBMIT_LOGIN}
    Wait Until Element Is Visible    ${LBL_LOGIN_ERROR}    timeout=10s
    ${text}=         Get Text    ${LBL_LOGIN_ERROR}
    Should Not Be Empty    ${text}
    Should Not Contain    ${text}    exception    ignore_case=true
    Should Not Contain    ${text}    stack    ignore_case=true
    [Teardown]       Close Browser

# NFR-005 Session Cookie Security Flags Present
#     Create Session    AuthAPI    ${API_BASE_URL}
#     ${payload}=    Create Dictionary    email=${USER_01_EMAIL}    password=${USER_01_PASSWORD}
#     ${response}=   Post On Session    AuthAPI    ${LOGIN_ENDPOINT}    json=${payload}
#     Status Should Be    ${response}    200
#     ${set_cookie}=      Evaluate    response.headers.get('set-cookie')    response=${response}
#     Should Not Be Empty    ${set_cookie}    Login response should set a secure session cookie
#     ${cookie_lower}=    Evaluate    str(${set_cookie}).lower()
#     Should Contain       ${cookie_lower}    httponly
#     Should Contain       ${cookie_lower}    secure
#     ${samesite_policy_ok}=    Evaluate    'SameSite=Strict' in """${set_cookie}""" or 'SameSite=Lax' in """${set_cookie}"""
#     Should Be True    ${samesite_policy_ok}    Cookie should have SameSite policy of Strict or Lax.
#     [Teardown]       Close Browser
