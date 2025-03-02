# Campus Party 🎉

A mobile application for hosting and joining campus parties.

## Features

- **User Authentication**: Sign up and login with email and password
- **Create Parties**: Host your own parties with details like location, date, and max attendees
- **Join Parties**: Browse and join parties hosted by other students
- **University Filtering**: Filter parties by university
- **Dark Mode**: Toggle between light and dark themes
- **QR Code Sharing**: Share party details via QR codes
- **Notifications**: Receive notifications about party updates

## Tech Stack

- React Native
- Expo
- Firebase (Authentication, Firestore)
- React Navigation
- Context API for state management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CampusParty.git
cd CampusParty
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server:
```bash
npm start
```

## Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Set up the following Firestore collections:
   - `users`: Store user information
   - `parties`: Store party details
5. Set up Firestore rules for proper security

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Screenshots

[Add screenshots of your app here] 