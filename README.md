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
- **Payment Integration**: Require Venmo payments for party entry
- **Safety Features**: Find a ride and count drinks
- **Collaborative Playlists**: Create and contribute to party playlists
- **Anonymous Feedback**: Rate and review parties anonymously

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
   - `payments`: Store payment records
   - `games`: Store party games
5. Deploy Firestore security rules and indexes:

   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project
   firebase init
   
   # Deploy Firestore rules
   firebase deploy --only firestore:rules
   
   # Deploy Firestore indexes
   firebase deploy --only firestore:indexes
   ```

   Alternatively, you can run the helper script:
   ```bash
   node deploy-firebase-config.js
   ```

## Payment Feature

The app includes a Venmo payment integration for party hosts to charge entry fees:

1. **For Party Hosts**:
   - When creating a party, toggle "Require payment to attend"
   - Enter the payment amount, your Venmo username, and an optional payment description
   - The app will automatically track who has paid

2. **For Party Attendees**:
   - When joining a party that requires payment, you'll be prompted to pay via Venmo
   - After making the payment, enter the transaction reference
   - The host will verify your payment

3. **Payment Verification**:
   - Payments are tracked in the Firestore database
   - Party hosts can see who has paid
   - Attendees can see their payment status

## Safety Features

The app includes safety features to promote responsible partying:

1. **Designated Driver Finder**:
   - Volunteer as a designated driver for a party
   - See a list of available designated drivers
   - Request a ride from a designated driver
   - View contact information for campus shuttles and rideshare services

2. **Drink Counter**:
   - Track your alcohol consumption during a party
   - Get an estimated BAC based on your drinks, weight, and time
   - Receive alerts when you should stop drinking
   - Get reminders to drink water and pace yourself

## Expense Splitting

Split costs for party supplies and expenses:

1. **Add Expenses**:
   - Add expenses with title, amount, and who paid
   - Automatically split costs among party attendees
   - Track who has settled up and who still owes money

2. **Settle Up**:
   - See a list of expenses you need to settle
   - Mark expenses as settled after paying your share
   - Get a summary of all expenses for a party

## Party Feedback

Anonymous ratings and feedback for parties:

1. **For Attendees**:
   - Rate parties from 1-5 stars
   - Leave anonymous comments and feedback
   - See overall ratings and reviews for parties

2. **For Hosts**:
   - View feedback for your parties
   - See rating statistics and trends
   - Use feedback to improve future parties

## Campus-Specific Party Games

Play and create games tailored to your campus:

1. **Browse Games**:
   - Find games specific to your university
   - See popular games across all campuses
   - Join games that other attendees are playing

2. **Create Games**:
   - Create custom games for your university
   - Add rules, descriptions, and categories
   - Share your games with other students

## Troubleshooting

### Firestore Index Errors

If you see errors like "The query requires an index", you need to create the necessary Firestore indexes:

1. Use the provided `firestore.indexes.json` file to deploy all required indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. Alternatively, click on the URL in the error message to create the specific index needed.

### Permission Errors

If you see "Missing or insufficient permissions" errors:

1. Make sure you're logged in to the app
2. Verify that your Firestore security rules are properly deployed
3. Check that you're using the correct Firebase project

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Screenshots

