# Task Manager Application

## Introduction
The Task Manager Application is designed for users to efficiently manage their tasks. It provides a user-friendly interface and robust features to handle everyday task management needs.

## Features
- **User Authentication:** Secure authentication for users.
- **Task Management:** Add, update, and delete tasks.
- **Real-time Updates:** Get real-time notification on task actions (create, update, delete) using **Socket.IO**.

## Tech Stack
- **Frontend:** React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.IO
- **Email Service:** Nodemailer with Gmail SMTP

## Getting Started

### Set you .env file
Create a `.env` file in the root of your project and add the following variables:

```plaintext
MONGO_URI = <your_mongo_uri>
JWT_SECRET = <your_jwt_secret>
CLIENT_URL = <your_client_url>
PORT = <your_port>
SMTP_HOST = <your_smtp_host>
SMTP_PORT = <your_smtp_port>
SMTP_SERVICE = <your_smtp_service>
SMTP_MAIL = <your_smtp_email>
SMTP_PASSWORD = <your_smtp_password>


### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/VishnuSusilkumar/TaskManagerApplication.git
   cd backend
   cd client
   npm install
   npm start
