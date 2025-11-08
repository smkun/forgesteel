import { Button, Input, message } from 'antd';
import { Modal } from '../modal/modal';
import { useState } from 'react';
import { PublicUserSummary, searchUsers } from '@/services/api';
import { assignGMToHero, clearGMFromHero } from '@/services/character-storage';
import { Hero } from '@/models/hero';

import './assign-gm-modal.scss';

interface Props {
	hero: Hero;
	currentGM: { email: string | null; display_name: string | null } | null;
	onAssignComplete: () => void;
	onClose: () => void;
}

export const AssignGMModal = (props: Props) => {
	const [ gmEmail, setGmEmail ] = useState<string>(props.currentGM?.email || '');
	const [ searching, setSearching ] = useState<boolean>(false);
	const [ assigning, setAssigning ] = useState<boolean>(false);
	const [ searchResults, setSearchResults ] = useState<PublicUserSummary[]>([]);
	const [ showResults, setShowResults ] = useState<boolean>(false);

	const handleSearch = async () => {
		if (!gmEmail.trim()) {
			return;
		}

		setSearching(true);
		setShowResults(true);

		try {
			const results = await searchUsers(gmEmail);
			setSearchResults(results);
		} catch (error) {
			console.error('[GM] Search failed:', error);
			message.error('Failed to search for users');
		} finally {
			setSearching(false);
		}
	};

	const handleAssignGM = async () => {
		if (!gmEmail.trim()) {
			message.error('Please enter a GM email address');
			return;
		}

		setAssigning(true);

		try {
			await assignGMToHero(props.hero.id, gmEmail.trim());
			message.success(`Character assigned to ${gmEmail}`);
			props.onAssignComplete();
		} catch (error: any) {
			console.error('[GM] Assignment failed:', error);
			message.error(error.message || 'Failed to assign GM');
		} finally {
			setAssigning(false);
		}
	};

	const handleClearGM = async () => {
		setAssigning(true);

		try {
			await clearGMFromHero(props.hero.id);
			message.success('GM assignment cleared');
			props.onAssignComplete();
		} catch (error: any) {
			console.error('[GM] Clear failed:', error);
			message.error(error.message || 'Failed to clear GM');
		} finally {
			setAssigning(false);
		}
	};

	const selectUser = (user: PublicUserSummary) => {
		setGmEmail(user.email);
		setShowResults(false);
	};

	const content = (
		<div className='assign-gm-modal-content'>
			<div className='character-info'>
				<div className='character-name'>{props.hero.name || 'Unnamed Character'}</div>
				{props.currentGM && (
					<div className='current-gm'>
						Current GM: <strong>{props.currentGM.display_name || props.currentGM.email}</strong>
					</div>
				)}
			</div>

			<div className='gm-search'>
				<div className='search-label'>Enter GM email address:</div>
				<Input.Search
					placeholder='gm@example.com'
					value={gmEmail}
					onChange={e => setGmEmail(e.target.value)}
					onSearch={handleSearch}
					loading={searching}
					enterButton='Search'
					size='large'
				/>
			</div>

			{showResults && searchResults.length > 0 && (
				<div className='search-results'>
					<div className='results-label'>Select a user:</div>
					{searchResults.map(user => (
						<div
							key={user.id}
							className='user-result'
							onClick={() => selectUser(user)}
						>
							<div className='user-email'>{user.email}</div>
							{user.display_name && <div className='user-name'>{user.display_name}</div>}
						</div>
					))}
				</div>
			)}

			{showResults && searchResults.length === 0 && !searching && (
				<div className='no-results'>No users found matching "{gmEmail}"</div>
			)}

			<div className='button-group'>
				<Button
					type='primary'
					size='large'
					onClick={handleAssignGM}
					loading={assigning}
					disabled={!gmEmail.trim() || assigning}
				>
					{props.currentGM ? 'Update GM' : 'Assign GM'}
				</Button>

				{props.currentGM && (
					<Button
						size='large'
						danger
						onClick={handleClearGM}
						loading={assigning}
						disabled={assigning}
					>
						Clear GM
					</Button>
				)}
			</div>

			<div className='help-text'>
				Assigning a GM allows them to view and manage your character during sessions.
			</div>
		</div>
	);

	return (
		<Modal
			content={content}
			onClose={props.onClose}
		/>
	);
};
