*** Settings ***
Library           Collections
Resource          ../Resource/Keywords/DatabaseKeyword.robot

*** Variables ***
${DB_PRODUCTION_HOST}    10.0.0.11

*** Test Cases ***
Test Database Connection
    Connect To Postgres    ${DB_PRODUCTION_HOST}
    Disconnect From Postgres