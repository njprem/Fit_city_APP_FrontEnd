*** Settings ***
Library           SeleniumLibrary
Library           Collections
Resource          ../Resource/Keywords/LoginKeyword.robot
Resource          ../Resource/Candidates.robot


*** Variables ***
${BASE URL}    https://fit-city.kaminjitt.com



*** Test Cases ***
Valid User Can Log In
    Open Browser To Login Page      ${BASE URL}
    Login With Valid Credentials    ${USER_01_EMAIL}    ${USER_01_PASSWORD}
    Logout In Home                  ${USER_01_EMAIL}
    [Teardown]    Close Browser

