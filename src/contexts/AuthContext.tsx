import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import * as firebase from '@/services/firebase';
import * as api from '@/services/api';
import * as storage from '@/services/character-storage';

interface AuthContextType {
	user: User | null;
	userProfile: api.UserProfile | null;
	loading: boolean;
	error: string | null;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, displayName: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [ user, setUser ] = useState<User | null>(null);
	const [ userProfile, setUserProfile ] = useState<api.UserProfile | null>(null);
	const [ loading, setLoading ] = useState(true);
	const [ error, setError ] = useState<string | null>(null);

	const loadUserProfile = async (firebaseUser: User) => {
		try {
			console.log('[AUTH] Loading user profile from backend...');
			const profile = await api.getCurrentUserProfile();
			setUserProfile(profile);
			storage.setAdminMode(profile.is_admin);
			console.log('[AUTH] ✅ User profile loaded:', profile.email);

			const needsMigration = await storage.needsMigration();
			if (needsMigration) {
				console.log('[AUTH] 🔄 Migrating offline heroes to backend...');
				const result = await storage.migrateToBackend();
				console.log(`[AUTH] ✅ Migration complete: ${result.migrated} migrated, ${result.errors} errors`);
			}
		} catch (err) {
			console.error('[AUTH] ❌ Failed to load user profile:', err);
			setError('Failed to load user profile');
		}
	};

	useEffect(() => {
		const handleRedirect = async () => {
			try {
				const result = await firebase.handleGoogleRedirect();
				if (result) {
					console.log('[AUTH] ✅ Google redirect successful:', result.email);
				}
			} catch (err) {
				console.error('[AUTH] ❌ Google redirect failed:', err);
				setError('Google sign in failed');
			}
		};

		handleRedirect();
	}, []);

	useEffect(() => {
		const unsubscribe = firebase.onAuthChange(async firebaseUser => {
			console.log('[AUTH] Auth state changed:', firebaseUser ? firebaseUser.email : 'signed out');

			setUser(firebaseUser);
			setLoading(true);
			setError(null);

			if (firebaseUser) {
				await loadUserProfile(firebaseUser);
			} else {
				setUserProfile(null);
				storage.setAdminMode(false);
				storage.clearApiCache();
			}

			setLoading(false);
		});

		return unsubscribe;
	}, []);

	const signIn = async (email: string, password: string) => {
		try {
			setError(null);
			setLoading(true);
			console.log('[AUTH] Signing in...', email);

			const firebaseUser = await firebase.signIn(email, password);
			console.log('[AUTH] ✅ Signed in:', firebaseUser.email);
		} catch (err: any) {
			console.error('[AUTH] ❌ Sign in failed:', err);
			const errorMessage = err.code === 'auth/user-not-found'
				? 'No account found with this email'
				: err.code === 'auth/wrong-password'
					? 'Incorrect password'
					: err.message || 'Sign in failed';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const signUp = async (email: string, password: string, displayName: string) => {
		try {
			setError(null);
			setLoading(true);
			console.log('[AUTH] Creating account...', email);

			const firebaseUser = await firebase.signUp(email, password, displayName);
			console.log('[AUTH] ✅ Account created:', firebaseUser.email);
		} catch (err: any) {
			console.error('[AUTH] ❌ Sign up failed:', err);
			const errorMessage = err.code === 'auth/email-already-in-use'
				? 'An account with this email already exists'
				: err.code === 'auth/weak-password'
					? 'Password is too weak'
					: err.message || 'Sign up failed';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const signOut = async () => {
		try {
			setError(null);
			console.log('[AUTH] Signing out...');
			await firebase.signOut();
			setUser(null);
			setUserProfile(null);
			storage.setAdminMode(false);
			storage.clearApiCache();
			console.log('[AUTH] ✅ Signed out');
		} catch (err) {
			console.error('[AUTH] ❌ Sign out failed:', err);
			setError('Sign out failed');
			throw err;
		}
	};

	const refreshProfile = async () => {
		if (!user) {
			return;
		}

		try {
			await loadUserProfile(user);
		} catch (err) {
			console.error('[AUTH] ❌ Failed to refresh profile:', err);
		}
	};

	const value: AuthContextType = {
		user,
		userProfile,
		loading,
		error,
		signIn,
		signUp,
		signOut,
		refreshProfile
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context;
}
