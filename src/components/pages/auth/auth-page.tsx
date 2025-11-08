/**
 * Authentication Page
 *
 * Provides sign in and sign up functionality.
 */

import { Alert, Button, Card, Divider, Form, Input, Space, Typography, message } from 'antd';
import { GoogleOutlined, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/hooks/use-navigation';
import * as firebase from '@/services/firebase';

const { Title, Text, Link } = Typography;

export const AuthPage = () => {
	const { signIn, signUp, error, loading, user } = useAuth();
	const navigation = useNavigation();
	const [ mode, setMode ] = useState<'signin' | 'signup'>('signin');
	const [ form ] = Form.useForm();

	// Navigate to hero list when user signs in via Google
	useEffect(() => {
		if (user && !loading) {
			console.log('[AUTH PAGE] User signed in, navigating to hero list');
			navigation.goToHeroList();
		}
	}, [ user, loading, navigation ]);

	const handleSubmit = async (values: { email: string; password: string; displayName?: string }) => {
		try {
			if (mode === 'signin') {
				await signIn(values.email, values.password);
			} else {
				const displayName = values.displayName?.trim();
				if (!displayName) {
					message.error('Please enter your name');
					return;
				}
				await signUp(values.email, values.password, displayName);
			}

			// Navigate to heroes page after successful auth
			navigation.goToHeroList();
		} catch (err) {
			// Error is handled by AuthContext
			console.error('[AUTH PAGE] Auth failed:', err);
		}
	};

	const toggleMode = () => {
		setMode(mode === 'signin' ? 'signup' : 'signin');
		form.resetFields();
	};

	const handleForgotPassword = async () => {
		const email = form.getFieldValue('email');
		if (!email) {
			message.error('Please enter your email address first');
			return;
		}

		try {
			await firebase.resetPassword(email);
			message.success('Password reset email sent! Check your inbox.');
		} catch (err: any) {
			message.error(err.message || 'Failed to send reset email');
		}
	};

	const handleGoogleSignIn = async () => {
		try {
			await firebase.signInWithGoogle();
			// Redirect will happen automatically, no need to navigate
		} catch (err: any) {
			console.error('[AUTH PAGE] Google sign in failed:', err);
			message.error(err.message || 'Google sign in failed');
		}
	};

	return (
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			minHeight: '100vh',
			padding: '20px',
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
		}}
		>
			<Card style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
				<Space direction='vertical' size='large' style={{ width: '100%' }}>
					{/* Header */}
					<div style={{ textAlign: 'center' }}>
						<Title level={2} style={{ marginBottom: '8px' }}>
							FORGE STEEL
						</Title>
						<Text type='secondary'>
							{mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
						</Text>
					</div>

					{/* Error Alert */}
					{error && (
						<Alert
							message='Authentication Error'
							description={error}
							type='error'
							showIcon
							closable
						/>
					)}

					{/* Google Sign In */}
					<Button
						type='default'
						size='large'
						block
						icon={<GoogleOutlined />}
						onClick={handleGoogleSignIn}
						disabled={loading}
						style={{ marginBottom: '16px' }}
					>
						Sign in with Google
					</Button>

					<Divider style={{ margin: '16px 0' }}>Or sign in with email</Divider>

					{/* Form */}
					<Form
						form={form}
						name='auth-form'
						onFinish={handleSubmit}
						layout='vertical'
						requiredMark={false}
					>
						{mode === 'signup' && (
							<Form.Item
								name='displayName'
								label='Your Name'
								rules={[
									{ required: true, message: 'Please tell us your name' },
									{ min: 2, message: 'Name must be at least 2 characters' }
								]}
								extra='Your name is shown to players and GMs so they can recognize you.'
							>
								<Input
									prefix={<UserOutlined />}
									placeholder='e.g., Paul Ironheart'
									size='large'
									disabled={loading}
								/>
							</Form.Item>
						)}
						{/* Email */}
						<Form.Item
							name='email'
							label='Email'
							rules={[
								{ required: true, message: 'Please enter your email' },
								{ type: 'email', message: 'Please enter a valid email' }
							]}
						>
							<Input
								prefix={<MailOutlined />}
								placeholder='your@email.com'
								size='large'
								disabled={loading}
							/>
						</Form.Item>

						{/* Password */}
						<Form.Item
							name='password'
							label='Password'
							rules={[
								{ required: true, message: 'Please enter your password' },
								{ min: 6, message: 'Password must be at least 6 characters' }
							]}
						>
							<Input.Password
								prefix={<LockOutlined />}
								placeholder='••••••••'
								size='large'
								disabled={loading}
							/>
						</Form.Item>

						{/* Submit Button */}
						<Form.Item style={{ marginBottom: 0 }}>
							<Button
								type='primary'
								htmlType='submit'
								size='large'
								block
								loading={loading}
								icon={mode === 'signin' ? <LockOutlined /> : <UserOutlined />}
							>
								{mode === 'signin' ? 'Sign In' : 'Sign Up'}
							</Button>
						</Form.Item>

						{/* Forgot Password */}
						{mode === 'signin' && (
							<div style={{ textAlign: 'center', marginTop: '8px' }}>
								<Link onClick={handleForgotPassword} disabled={loading}>
									Forgot password?
								</Link>
							</div>
						)}
					</Form>

					{/* Toggle Mode */}
					<Divider style={{ margin: '8px 0' }} />

					<div style={{ textAlign: 'center' }}>
						<Text>
							{mode === 'signin' ? 'Don\'t have an account? ' : 'Already have an account? '}
							<Link onClick={toggleMode} disabled={loading}>
								{mode === 'signin' ? 'Sign Up' : 'Sign In'}
							</Link>
						</Text>
					</div>

					{/* Account Info */}
					<Alert
						message={mode === 'signin' ? 'First Time?' : 'Create Account'}
						description={
							<div>
								{mode === 'signin'
									? (
										<>
											<Text strong>Don't have an account yet?</Text>
											<br />
											<Text>Click "Sign Up" below to create a new account with your email.</Text>
											<br />
											<br />
											<Text type='secondary'>Note: Firebase Authentication passwords are separate from your email provider (Gmail, etc.)</Text>
										</>
									)
									: (
										<>
											<Text strong>Creating a new account</Text>
											<br />
											<Text>Choose any password (min 6 characters). This password is for the app only.</Text>
											<br />
											<Text type='secondary'>We also ask for your real name so friends and GMs can find you when sharing characters.</Text>
										</>
									)}
							</div>
						}
						type='info'
						showIcon
					/>

				</Space>
			</Card>
		</div>
	);
};
