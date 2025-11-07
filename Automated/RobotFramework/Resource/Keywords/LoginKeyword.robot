*** Settings ***
Library           SeleniumLibrary
Library           Collections
Library           DatabaseLibrary
Resource          ../WebElement/WebElement_Home.robot
Resource          ../WebElement/WebElement_Login.robot
Resource          DatabaseKeyword.robot

*** Variables ***
${DB_HOST}                     10.0.0.11
${DB_PORT}                     5432
${DB_NAME}                     fitcity
${DB_USER}                     postgres
${DB_PASSWORD}                 postgres
${LOCAL_STORAGE_TOKEN_KEY}     token
${TOKEN_WAIT_TIMEOUT}          10s

*** Keywords ***
Open Browser To Login Page
    [Arguments]    ${base_url}
    Open Browser    ${base_url}    chrome
    Maximize Browser Window
    Click Element    ${BTN_LOGIN_NAVBAR}
    Wait Until Element Is Visible    ${TF_EMAIL_LOGIN}    timeout=10s

Login With Valid Credentials
    [Arguments]    ${email}    ${password}
    Input Text    ${TF_EMAIL_LOGIN}    ${email}
    Input Text    ${TF_PASSWORD_LOGIN}    ${password}
    Click Element    ${BTN_SUBMIT_LOGIN}
    Validate Successful Login    ${email}
    Wait For Condition    
    ...    return window.localStorage.getItem("${LOCAL_STORAGE_TOKEN_KEY}") !== null;    
    ...    ${TOKEN_WAIT_TIMEOUT}
    ${browser_token}=    Get Latest Session Token From Browser Storage
    ${db_token}=         Get Latest Session Token From Database    ${email}
    Should Not Be Empty    ${browser_token}    Token not found in browser local storage
    Should Not Be Empty    ${db_token}         No session token found in database for ${email}
    Should Be Equal    ${browser_token}    ${db_token}

Logout In Home
    [Arguments]    ${email}
    Click Element    //button[@aria-haspopup='menu' and .//span[@title='${email}']]
    Click Element    ${BTN_LOGOUT_DROPDOWN}
    Wait Until Element Is Visible    ${TF_EMAIL_LOGIN}    timeout=10s
    ${browser_token}=    Get Latest Session Token From Browser Storage
    Should Be Equal    ${browser_token}    ${None}    Token should be removed from browser local storage after logout

Get Latest Session Token From Database
    [Arguments]    ${email}
    Connect To Postgres    ${DB_HOST}    ${DB_PORT}    ${DB_NAME}    ${DB_USER}    ${DB_PASSWORD}
    ${query}=    Set Variable    SELECT token FROM public.sessions AS s JOIN public.user_account AS u ON s.user_id = u.id WHERE u.email = '${email}' ORDER BY s.created_at DESC LIMIT 1;
    ${rows}=    Query    ${query}
    Run Keyword And Ignore Error    Disconnect From Postgres
    ${first_row}=    Get From List    ${rows}    0
    ${db_token}=    Get From List    ${first_row}    0
    [Return]    ${db_token}

Get Latest Session Token From Browser Storage
    ${browser_token}=    Execute Javascript    return window.localStorage.getItem("${LOCAL_STORAGE_TOKEN_KEY}");
    [Return]    ${browser_token}

Validate Successful Login
    [Arguments]    ${email}
    Wait Until Page Contains Element    //button[@aria-haspopup='menu' and .//span[@title='${email}']]   timeout=10s
