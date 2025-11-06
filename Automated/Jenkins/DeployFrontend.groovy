pipeline {
    agent {
        node {
            label 'DockerHost'
        }
    }

    environment {
        IMAGE_NAME = 'fitcity-frontend'
        CONTAINER_NAME = 'fitcity-frontend'
        GOOGLE_CLIENT_ID = $CLIENT_ID
        VITE_API_URL='https://fit-city.kaminjitt.com'
    }

    stages {
        stage('Checkout') {
          steps {
            checkout([$class: 'GitSCM',
              userRemoteConfigs: [[
                url: 'https://github.com/njprem/Fit_city_APP_FrontEnd.git',
                credentialsId: 'gh-jenkins-02'
              ]],
              branches: [[name: '*/main']],                 // <-- match the real branch
              extensions: [[$class: 'CleanBeforeCheckout']]
            ])
          }
        }
        
        stage('Build Docker Image') {
          steps {
            sh """
              docker build \
                --build-arg VITE_API_URL=$VITE_API_URL \
                --build-arg VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
                --build-arg NGINX_PROXY_PASS=$VITE_API_URL \
                -t $IMAGE_NAME .
            """
          }
        }
        stage('Deploy Container') {
            steps {
                // Stop and remove existing container if running
                sh '''
                docker rm -f $CONTAINER_NAME || true
                docker run -d --name $CONTAINER_NAME -p 8180:80 $IMAGE_NAME 
                '''
                // -e VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID -e VITE_API_URL=$VITE_API_URL
            }
        }
    }
}