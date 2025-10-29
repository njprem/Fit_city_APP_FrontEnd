*** Settings ***
Library    DatabaseLibrary

*** Keywords ***
Connect To Postgres
    [Arguments]    ${host}    ${port}=5432    ${dbname}=fitcity    
    ...    ${user}=postgres    ${password}=postgres
    # Requires psycopg2 and robotframework-databaselibrary installed
    Connect To Database    psycopg2    ${dbname}    ${user}    ${password}    ${host}    ${port}
    Log    Connected to PostgreSQL ${dbname}@${host}:${port}

Disconnect From Postgres
    Disconnect From Database
    Log    Disconnected from PostgreSQL
