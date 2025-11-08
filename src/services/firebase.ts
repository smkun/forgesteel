import { FirebaseApp, initializeApp } from 'firebase/app';
import {
	Auth,
	GoogleAuthProvider,
	User,
	createUserWithEmailAndPassword,
	signOut as firebaseSignOut,
	getAuth,
	getRedirectResult,
	onAuthStateChanged,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signInWithRedirect,
	updateProfile
} from 'firebase/auth';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: 'forgesteel-6e968'
};

let app: FirebaseApp;
let auth: Auth;

try {
	app = initializeApp(firebaseConfig);
	auth = getAuth(app);
	console.log('[FIREBASE] ✅ Firebase initialized');
} catch (error) {
	console.error('[FIREBASE] ❌ Firebase initialization failed:', error);
	throw error;
}

export async function signIn(email: string, password: string): Promise<User> {
	const credential = await signInWithEmailAndPassword(auth, email, password);
	return credential.user;
}

export async function signUp(email: string, password: string, displayName: string): Promise<User> {
	const credential = await createUserWithEmailAndPassword(auth, email, password);
	if (displayName) {
		await updateProfile(credential.user, { displayName });
	}
	return credential.user;
}

export async function signOut(): Promise<void> {
	await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
	await sendPasswordResetEmail(auth, email);
}

export async function getIdToken(): Promise<string | null> {
	const user = auth.currentUser;
	if (!user) {
		return null;
	}
	return user.getIdToken();
}

export function getCurrentUser(): User | null {
	return auth.currentUser;
}

export function isSignedIn(): boolean {
	return auth.currentUser !== null;
}

export async function handleGoogleRedirect(): Promise<User | null> {
	return getRedirectResult(auth).then(result => result?.user ?? null);
}

export async function signInWithGoogle(): Promise<void> {
	const provider = new GoogleAuthProvider();
	await signInWithPopup(auth, provider);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
	return onAuthStateChanged(auth, callback);
}

export { auth };
export type { User };
