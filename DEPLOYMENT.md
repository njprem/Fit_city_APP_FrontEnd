# Deployment Documentation

This document outlines the necessary environment variables for deploying the Fit City FrontEnd application.

## Environment Variables

The application relies on the following environment variables. These should be configured in a `.env` file at the root of the project.

### `VITE_API_URL`
*   **Description**: The base URL for the Fit City backend API. This is used for all API calls made by the frontend application.
*   **Example**: `https://fitcity.example.com`

### `VITE_GOOGLE_CLIENT_ID`
*   **Description**: The Client ID obtained from Google Cloud Console for Google Sign-In functionality. This is essential for users to authenticate using their Google accounts.
*   **Example**: `xxx.apps.googleusercontent.com`

### `VITE_KIBANA_EMBED_URL`
*   **Description**: The URL for embedding Kibana dashboards, likely used for analytics or monitoring within the application's admin panel.
*   **Example**: `https://kibana.example.com/app/dashboards#/view/xxx`

## Sample `.env` file

To configure these variables, create a file named `.env` in the project root directory with the following structure:

```
VITE_API_URL=https://fitcity.example.com
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_KIBANA_EMBED_URL=https://kibana.example.com/app/dashboards#/view/xxx
```

**Note**: Replace the example values with your actual deployment-specific URLs and client IDs.