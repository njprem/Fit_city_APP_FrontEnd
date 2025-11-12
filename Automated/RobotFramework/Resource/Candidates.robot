*** Variables ***
${USER_01_EMAIL}              kamin01@kaminjitt.com
${USER_01_PASSWORD}           ,ajv.'bckotWuql7
${DEFAULT_STRONG_PASSWORD}    FitCity!Robot1234
${WEAK_PASSWORD}              Abc12345

*** Keywords ***
Generate Unique Email
    ${timestamp}=        Evaluate    int(time.time() * 1000)    modules=time
    ${random_suffix}=    Evaluate    ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))    modules=random,string
    ${email}=            Set Variable    robot_${timestamp}${random_suffix}@fitcity-tests.com
    [Return]    ${email}

Generate Strong Password
    ${random_chunk}=    Evaluate    ''.join(random.choices(string.ascii_letters + string.digits, k=6))    modules=random,string
    ${password}=        Set Variable    FitCity!${random_chunk}#
    [Return]    ${password}
