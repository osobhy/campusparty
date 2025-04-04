# Funxion

An open-source mobile application for hosting and joining campus social events.

## Features

- **User Authentication**: Sign up and login with email and password
- **Create Parties**: Host your own events with details like location, date, and max attendees
- **Join Parties**: Browse and join events hosted by other students
- **University Filtering**: Filter parties by university
- **Dark Mode**: Toggle between light and dark themes
- **QR Code Sharing**: Share party details via QR codes
- **Notifications**: Receive notifications about party updates
- **Payment Integration**: Require Venmo payments for event entry
- **Safety Features**: Find a ride via rideshare services
- **Collaborative Playlists**: Create and contribute to event playlists
- **Anonymous Feedback**: Rate and review events anonymously

## Tech Stack

- React Native
- Expo
- Firebase (Authentication, Firestore)
- React Navigation
- Context API for state management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/osobhy/CampusParty.git
cd CampusParty
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with a customized Firebase configuration:
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

## Payment Feature

The app includes a Venmo payment integration for event hosts to charge entry fees:

1. **For Event Hosts**:
   - When creating a party, toggle "Require payment to attend"
   - Enter the payment amount, your Venmo username, and an optional payment description
   - The app will automatically track who has paid

2. **For Event Attendees**:
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Screenshots

