import { Button, Select, message } from 'antd';
import { Modal } from '../modal/modal';
import { useEffect, useState } from 'react';
import { Hero } from '@/models/hero';
import * as api from '@/services/api';
import * as characterStorage from '@/services/character-storage';
import { Campaign } from '@/models/campaign';

import './assign-campaign-modal.scss';

interface Props {
	hero: Hero;
	currentCampaign: { id: number; name: string } | null;
	onAssignComplete: () => void;
	onClose: () => void;
}

export const AssignCampaignModal = (props: Props) => {
	const [ campaigns, setCampaigns ] = useState<Campaign[]>([]);
	const [ selectedCampaignId, setSelectedCampaignId ] = useState<number | null>(props.currentCampaign?.id || null);
	const [ loading, setLoading ] = useState<boolean>(false);
	const [ assigning, setAssigning ] = useState<boolean>(false);

	useEffect(() => {
		loadCampaigns();
	}, []);

	const loadCampaigns = async () => {
		setLoading(true);
		try {
			// Get all campaigns where user is a member (GM or player)
			const data = await api.getCampaigns();
			setCampaigns(data);
		} catch (error) {
			console.error('[CAMPAIGN] Failed to load campaigns:', error);
			message.error('Failed to load campaigns');
		} finally {
			setLoading(false);
		}
	};

	const handleAssignCampaign = async () => {
		if (!selectedCampaignId) {
			message.error('Please select a campaign');
			return;
		}

		console.log('[MODAL] Starting campaign assignment for hero:', props.hero.id, 'to campaign:', selectedCampaignId);
		setAssigning(true);

		try {
			// Get the database character record to obtain the database ID
			const characterRecord = await characterStorage.getCharacterRecord(props.hero.id);
			console.log('[MODAL] Got character record:', characterRecord?.id);
			if (!characterRecord) {
				throw new Error('Character not found in database');
			}

			console.log('[MODAL] Calling assignCharacterToCampaign API...');
			await api.assignCharacterToCampaign(characterRecord.id, selectedCampaignId);
			const campaignName = campaigns.find(c => c.id === selectedCampaignId)?.name;
			console.log('[MODAL] Assignment successful, campaign name:', campaignName);
			message.success(`Character assigned to ${campaignName}`);

			// Clear cache so fresh data is loaded
			console.log('[MODAL] Clearing API cache...');
			characterStorage.clearApiCache();
			console.log('[MODAL] Calling onAssignComplete...');
			props.onAssignComplete();
		} catch (error: any) {
			console.error('[MODAL] Assignment failed:', error);
			message.error(error.message || 'Failed to assign to campaign');
		} finally {
			setAssigning(false);
		}
	};

	const handleClearCampaign = async () => {
		if (!props.currentCampaign) return;

		setAssigning(true);

		try {
			// Get the database character record to obtain the database ID
			const characterRecord = await characterStorage.getCharacterRecord(props.hero.id);
			if (!characterRecord) {
				throw new Error('Character not found in database');
			}

			await api.removeCharacterFromCampaign(characterRecord.id, props.currentCampaign.id);
			message.success('Removed from campaign');

			// Clear cache so fresh data is loaded
			characterStorage.clearApiCache();
			props.onAssignComplete();
		} catch (error: any) {
			console.error('[CAMPAIGN] Clear failed:', error);
			message.error(error.message || 'Failed to remove from campaign');
		} finally {
			setAssigning(false);
		}
	};

	const content = (
		<div className='assign-campaign-modal-content'>
			<div className='character-info'>
				<div className='character-name'>{props.hero.name || 'Unnamed Character'}</div>
			</div>

			{props.currentCampaign ? (
				<>
					<div className='current-campaign-section'>
						<div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
							Current Campaign:
						</div>
						<div style={{
							padding: '12px 16px',
							background: '#f5f5f5',
							borderRadius: '6px',
							marginBottom: '16px',
							fontSize: '16px',
							fontWeight: 600
						}}>
							{props.currentCampaign.name}
						</div>
						<Button
							block
							size='large'
							danger
							onClick={handleClearCampaign}
							loading={assigning}
							disabled={assigning}
						>
							Leave Campaign
						</Button>
					</div>

					<div style={{ margin: '20px 0', textAlign: 'center', color: '#888' }}>
						or
					</div>

					<div className='campaign-select'>
						<div className='select-label'>Change to Different Campaign:</div>
						<Select
							style={{ width: '100%' }}
							placeholder='Select a campaign...'
							value={selectedCampaignId}
							onChange={setSelectedCampaignId}
							loading={loading}
							size='large'
							options={campaigns.map(campaign => ({
								value: campaign.id,
								label: campaign.name
							}))}
						/>
						<Button
							block
							type='primary'
							size='large'
							onClick={handleAssignCampaign}
							loading={assigning}
							disabled={!selectedCampaignId || selectedCampaignId === props.currentCampaign.id || assigning || loading}
							style={{ marginTop: '12px' }}
						>
							Switch to Selected Campaign
						</Button>
					</div>
				</>
			) : (
				<>
					<div className='campaign-select'>
						<div className='select-label'>Select Campaign:</div>
						<Select
							style={{ width: '100%' }}
							placeholder='Select a campaign...'
							value={selectedCampaignId}
							onChange={setSelectedCampaignId}
							loading={loading}
							size='large'
							options={campaigns.map(campaign => ({
								value: campaign.id,
								label: campaign.name
							}))}
						/>
						{campaigns.length === 0 && !loading && (
							<div style={{ marginTop: '8px', color: '#888', fontSize: '12px' }}>
								You are not a member of any campaigns. Ask a GM to add you to a campaign first.
							</div>
						)}
					</div>

					<Button
						block
						type='primary'
						size='large'
						onClick={handleAssignCampaign}
						loading={assigning}
						disabled={!selectedCampaignId || assigning || loading}
						style={{ marginTop: '16px' }}
					>
						Assign to Campaign
					</Button>
				</>
			)}

			<div className='help-text' style={{ marginTop: '16px' }}>
				Assigning your character to a campaign allows the campaign's GMs to view and manage it.
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
