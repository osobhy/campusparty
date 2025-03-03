import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// University domain mapping
const universityDomains = {
  'carleton.edu': 'Carleton College',
  'umn.edu': 'University of Minnesota',
  'harvard.edu': 'Harvard University',
  'stanford.edu': 'Stanford University',
  'mit.edu': 'Massachusetts Institute of Technology',
  'berkeley.edu': 'University of California, Berkeley',
  'yale.edu': 'Yale University',
  'princeton.edu': 'Princeton University',
  'columbia.edu': 'Columbia University',
  'cornell.edu': 'Cornell University',
  'upenn.edu': 'University of Pennsylvania',
  'dartmouth.edu': 'Dartmouth College',
  'brown.edu': 'Brown University',
  'nyu.edu': 'New York University',
  'ucla.edu': 'University of California, Los Angeles',
  'uchicago.edu': 'University of Chicago',
  'duke.edu': 'Duke University',
  'northwestern.edu': 'Northwestern University',
  'jhu.edu': 'Johns Hopkins University',
  'rice.edu': 'Rice University',
  'vanderbilt.edu': 'Vanderbilt University',
  'emory.edu': 'Emory University',
  'georgetown.edu': 'Georgetown University',
  'notredame.edu': 'University of Notre Dame',
  'cmu.edu': 'Carnegie Mellon University',
  'tufts.edu': 'Tufts University',
  'usc.edu': 'University of Southern California',
  'umich.edu': 'University of Michigan',
  'wisc.edu': 'University of Wisconsin-Madison',
  'illinois.edu': 'University of Illinois',
  'gatech.edu': 'Georgia Institute of Technology',
  'purdue.edu': 'Purdue University',
  'utexas.edu': 'University of Texas at Austin',
  'osu.edu': 'Ohio State University',
  'psu.edu': 'Pennsylvania State University',
  'ufl.edu': 'University of Florida',
  'ucdavis.edu': 'University of California, Davis',
  'uci.edu': 'University of California, Irvine',
  'ucsd.edu': 'University of California, San Diego',
  'ucsb.edu': 'University of California, Santa Barbara',
  'uw.edu': 'University of Washington',
  'bu.edu': 'Boston University',
  'bc.edu': 'Boston College',
  'virginia.edu': 'University of Virginia',
  'unc.edu': 'University of North Carolina',
  'umd.edu': 'University of Maryland',
  'rutgers.edu': 'Rutgers University',
  'pitt.edu': 'University of Pittsburgh',
  'wustl.edu': 'Washington University in St. Louis',
  'uiowa.edu': 'University of Iowa',
  'asu.edu': 'Arizona State University',
  'ua.edu': 'University of Alabama',
  'colostate.edu': 'Colorado State University',
  'colorado.edu': 'University of Colorado Boulder',
};

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { register, authError } = useAuth();

  // Update local error message when authError changes
  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
    }
  }, [authError]);

  // Extract university from email domain
  useEffect(() => {
    if (email) {
      const emailParts = email.split('@');
      if (emailParts.length === 2) {
        const domain = emailParts[1].toLowerCase();
        
        // Check if it's a .edu domain
        if (!domain.endsWith('.edu')) {
          setEmailError('Please use a .edu email address');
          setUniversity('');
          return;
        }
        
        setEmailError('');
        
        // Try to match the domain to a known university
        if (universityDomains[domain]) {
          setUniversity(universityDomains[domain]);
        } else {
          // Extract university name from domain (e.g., "example.edu" -> "Example University")
          const domainParts = domain.split('.');
          if (domainParts.length >= 2) {
            const schoolName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
            setUniversity(`${schoolName} University`);
          }
        }
      }
    }
  }, [email]);

  const handleRegister = async () => {
    // Clear previous errors
    setErrorMessage('');
    
    // Validate inputs
    if (!username || !email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    
    // Validate email domain
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[1].toLowerCase().endsWith('.edu')) {
      setErrorMessage('Please use a valid .edu email address');
      return;
    }
    
    if (!university) {
      setErrorMessage('University could not be determined from your email');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting to register user:', { email, username, university });
      await register(email, password, username, university);
      console.log('Registration successful');
      Alert.alert(
        'Success', 
        'Account created successfully!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Error is already handled in AuthContext and set to authError
      // If there's no authError set (which is unusual), set a generic message
      if (!authError) {
        setErrorMessage('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.form}>
          <Text style={styles.title}>Create Account</Text>
          
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrorMessage(''); // Clear error when user types
            }}
          />
          
          <View>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="College Email (.edu)"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage(''); // Clear error when user types
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {emailError ? (
              <Text style={styles.fieldErrorText}>{emailError}</Text>
            ) : null}
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage(''); // Clear error when user types
            }}
            secureTextEntry
          />
          
          <View style={styles.universityContainer}>
            <Text style={styles.universityLabel}>Your University:</Text>
            <Text style={styles.universityText}>{university || 'Will be detected from your email'}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={loading || !!emailError}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              Already have an account? Login here
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  form: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 20,
  },
  universityContainer: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  universityLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  universityText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  fieldErrorText: {
    color: '#b91c1c',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
});