*** Settings ***
Library           SeleniumLibrary
Library           Collections
Resource          ../WebElement/WebElement_Home.robot
Resource          ../WebElement/WebElement_Login.robot

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
    Validate Successful Login   ${email}

Validate Successful Login    
    [Arguments]    ${email}
    Wait Until Page Contains Element    //button[@aria-haspopup='menu' and .//span[@title='${email}']]   timeout=10s