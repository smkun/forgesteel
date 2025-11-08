import { Alert, Button, Divider, Form, Input, List, Select, Space, Spin, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import * as api from '@/services/api';

interface AdminToolsModalProps {
	onClose: () => void;
	onRefresh: () => Promise<void>;
}

export const AdminToolsModal = (props: AdminToolsModalProps) => {
	const [ characters, setCharacters ] = useState<api.CharacterResponse[]>([]);
	const [ users, setUsers ] = useState<api.AdminUserSummary[]>([]);
	const [ loadingCharacters, setLoadingCharacters ] = useState(true);
	const [ loadingUsers, setLoadingUsers ] = useState(true);
	const [ submitting, setSubmitting ] = useState(false);
	const [ gmSubmitting, setGmSubmitting ] = useState(false);
	const [ selectedCharacterId, setSelectedCharacterId ] = useState<number | null>(null);
	const [ newOwnerEmail, setNewOwnerEmail ] = useState('');
	const [ selectedUserEmail, setSelectedUserEmail ] = useState<string | undefined>(undefined);
	const [ gmEmail, setGmEmail ] = useState('');
	const [ selectedGmUserEmail, setSelectedGmUserEmail ] = useState<string | undefined>(undefined);
	const [ error, setError ] = useState<string | null>(null);
	const [ success, setSuccess ] = useState<string | null>(null);

	const loadCharacters = async () => {
		setLoadingCharacters(true);
		setError(null);
		try {
			const result = await api.getCharacters({ scope: 'all' });
			setCharacters(result);
		} catch (err) {
			console.error('[ADMIN] ❌ Failed to load characters:', err);
			setError(err instanceof Error ? err.message : 'Failed to load characters');
		} finally {
			setLoadingCharacters(false);
		}
	};

	const loadUsers = async () => {
		setLoadingUsers(true);
		try {
			const result = await api.getUsers(500);
			setUsers(result);
		} catch (err) {
			console.error('[ADMIN] ❌ Failed to load users:', err);
			setError(err instanceof Error ? err.message : 'Failed to load users');
		} finally {
			setLoadingUsers(false);
		}
	};

	useEffect(() => {
		loadCharacters();
		loadUsers();
	}, []);

	const characterOptions = useMemo(() => {
		return characters.map(character => {
			const labelName = character.name || character.hero.name || character.hero.id;
			const ownerLabel = character.owner_email || `User ${character.owner_user_id}`;
			return {
				value: character.id,
				label: `${labelName} (${ownerLabel})`
			};
		});
	}, [ characters ]);

	const userOptions = useMemo(() => {
		return users.map(user => ({
			value: user.email,
			label: `${user.email}${user.display_name ? ` (${user.display_name})` : ''}`
		}));
	}, [ users ]);

	const handleReassign = async () => {
		if (!selectedCharacterId || newOwnerEmail.trim().length === 0) {
			setError('Select a character and enter the new owner\'s email.');
			return;
		}

		setSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const updated = await api.reassignCharacterOwner(
				selectedCharacterId,
				newOwnerEmail.trim()
			);
			setSuccess(`Character reassigned to ${updated.owner_email || newOwnerEmail.trim()}`);
			await loadCharacters();
			await props.onRefresh();
			setNewOwnerEmail('');
			setSelectedUserEmail(undefined);
		} catch (err) {
			console.error('[ADMIN] ❌ Failed to reassign character:', err);
			setError(err instanceof Error ? err.message : 'Failed to reassign character');
		} finally {
			setSubmitting(false);
		}
	};

	const selectedCharacter = characters.find(char => char.id === selectedCharacterId);

	const handleAssignGMAdmin = async () => {
		if (!selectedCharacterId || gmEmail.trim().length === 0) {
			setError('Select a character and enter the GM\'s email.');
			return;
		}

		setGmSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const updated = await api.assignGMByEmail(selectedCharacterId, gmEmail.trim());
			setSuccess(`Assigned ${updated.gm_email} as GM.`);
			await loadCharacters();
			await props.onRefresh();
			setGmEmail('');
			setSelectedGmUserEmail(undefined);
		} catch (err) {
			console.error('[ADMIN] ❌ Failed to assign GM:', err);
			setError(err instanceof Error ? err.message : 'Failed to assign GM');
		} finally {
			setGmSubmitting(false);
		}
	};

	const handleClearGMAdmin = async () => {
		if (!selectedCharacterId) {
			setError('Select a character first.');
			return;
		}

		setGmSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			await api.clearGM(selectedCharacterId);
			setSuccess('GM removed successfully.');
			await loadCharacters();
			await props.onRefresh();
			setGmEmail('');
			setSelectedGmUserEmail(undefined);
		} catch (err) {
			console.error('[ADMIN] ❌ Failed to remove GM:', err);
			setError(err instanceof Error ? err.message : 'Failed to remove GM');
		} finally {
			setGmSubmitting(false);
		}
	};

	return (
		<div className='admin-tools-modal'>
			<Typography.Title level={4}>Admin Tools</Typography.Title>
			<Typography.Paragraph>
				View all characters and reassign ownership to a different user. Enter the recipient&apos;s email exactly as it
				appears in Firebase.
			</Typography.Paragraph>
			{error
				? (
					<Alert
						type='error'
						message={error}
						style={{ marginBottom: '1rem' }}
						showIcon={true}
					/>
				)
				: null}
			{success
				? (
					<Alert
						type='success'
						message={success}
						style={{ marginBottom: '1rem' }}
						showIcon={true}
					/>
				)
				: null}
			<Form layout='vertical'>
				<Form.Item label='Character' required={true}>
					<Select
						showSearch={true}
						placeholder='Select a character'
						options={characterOptions}
						value={selectedCharacterId ?? undefined}
						onChange={value => setSelectedCharacterId(value)}
						loading={loadingCharacters}
						filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
					/>
				</Form.Item>
				<Form.Item label='Choose Existing User'>
					<Select
						showSearch={true}
						placeholder='Select a user email'
						options={userOptions}
						value={selectedUserEmail}
						loading={loadingUsers}
						allowClear={true}
						onChange={value => {
							setSelectedUserEmail(value);
							setNewOwnerEmail(value || '');
						}}
						filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
					/>
				</Form.Item>
				<Form.Item label='New Owner Email' required={true}>
					<Input
						type='email'
						placeholder='name@example.com'
						value={newOwnerEmail}
						onChange={e => {
							setNewOwnerEmail(e.target.value);
							setSelectedUserEmail(undefined);
						}}
					/>
				</Form.Item>
				<Space style={{ marginTop: '0.5rem' }}>
					<Button
						type='primary'
						onClick={handleReassign}
						disabled={!selectedCharacterId || newOwnerEmail.trim().length === 0}
						loading={submitting}
					>
						Reassign Owner
					</Button>
					<Button onClick={loadCharacters} disabled={loadingCharacters}>
						Refresh List
					</Button>
					<Button onClick={loadUsers} disabled={loadingUsers}>
						Refresh Users
					</Button>
					<Button onClick={props.onClose}>
						Close
					</Button>
				</Space>
				<Divider />
				<Typography.Title level={5}>Assign Game Master</Typography.Title>
				<Typography.Paragraph type='secondary'>
					Type at least two letters of the GM&apos;s name or email to search existing users.
				</Typography.Paragraph>
				<Form.Item label='Choose Existing User'>
					<Select
						showSearch={true}
						placeholder='Select a user email'
						options={userOptions}
						value={selectedGmUserEmail}
						loading={loadingUsers}
						allowClear={true}
						onChange={value => {
							setSelectedGmUserEmail(value);
							setGmEmail(value || '');
						}}
						filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
					/>
				</Form.Item>
				<Form.Item label='GM Email'>
					<Input
						type='email'
						placeholder='gm@example.com'
						value={gmEmail}
						onChange={e => {
							setGmEmail(e.target.value);
							setSelectedGmUserEmail(undefined);
						}}
					/>
				</Form.Item>
				<Space style={{ marginBottom: '1rem' }}>
					<Button
						type='primary'
						onClick={handleAssignGMAdmin}
						disabled={!selectedCharacterId || gmEmail.trim().length === 0}
						loading={gmSubmitting}
					>
						Assign GM
					</Button>
					<Button
						onClick={handleClearGMAdmin}
						disabled={!selectedCharacterId}
						loading={gmSubmitting}
					>
						Remove GM
					</Button>
				</Space>
			</Form>
			<Typography.Title level={5} style={{ marginTop: '1.5rem' }}>
				All Characters
			</Typography.Title>
			{loadingCharacters
				? (
					<Spin />
				)
				: (
					<List
						dataSource={characters}
						renderItem={character => (
							<List.Item key={character.id}>
								<div style={{ display: 'flex', flexDirection: 'column' }}>
									<strong>{character.name || character.hero.name || character.hero.id}</strong>
									<span>Owner: {character.owner_email || `User ${character.owner_user_id}`}</span>
									{character.gm_email ? <span>GM: {character.gm_email}</span> : null}
								</div>
							</List.Item>
						)}
					/>
				)}
			{selectedCharacter
				? (
					<Typography.Paragraph type='secondary' style={{ marginTop: '1rem' }}>
						Currently selected: {selectedCharacter.name || selectedCharacter.hero.name || selectedCharacter.hero.id} (Owner:{' '}
						{selectedCharacter.owner_email || `User ${selectedCharacter.owner_user_id}`})
					</Typography.Paragraph>
				)
				: null}
		</div>
	);
};
