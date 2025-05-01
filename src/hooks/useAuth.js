import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; // Adjust path if needed

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // User is signed in
        setUser(firebaseUser);
        // Fetch user profile from Firestore to check isAdmin status
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setIsAdmin(userData.isAdmin || false); // Default to false if field doesn't exist
          } else {
            // Handle case where user exists in Auth but not Firestore (e.g., during signup flow)
            console.warn('User document not found in Firestore for UID:', firebaseUser.uid);
            setIsAdmin(false);
            // Optionally create the user document here if needed upon first login after signup
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
          setIsAdmin(false); // Assume not admin on error
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  const logout = async () => {
    try {
      await signOut(auth);
      // State updates (user: null, isAdmin: false) will happen via onAuthStateChanged
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return { user, isAdmin, loading, logout };
} 