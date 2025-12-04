import { Button, Select, message, Spin, Tag } from 'antd';
import { CloudOutlined, CloudSyncOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { Modal } from '../modal/modal';
import { useEffect, useState } from 'react';
import { Encounter } from '@/models/encounter';
import { Campaign } from '@/models/campaign';
import * as api from '@/services/api';
import * as encounterStorage from '@/services/encounter-storage';

import './sync-encounter-modal.scss';

interface Props {
	encounter: Encounter;
	onSyncComplete: () => void;
	onClose: () => void;
}

export const SyncEncounterModal = (props: Props) => {
	const [ campaigns, setCampaigns ] = useState<Campaign[]>([]);
	const [ selectedCampaignId, setSelectedCampaignId ] = useState<number | null>(null);
	const [ loading, setLoading ] = useState<boolean>(false);
	const [ syncing, setSyncing ] = useState<boolean>(false);
	const [ syncInfo, setSyncInfo ] = useState<{ dbId: number; campaignId: number } | null>(null);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			// Get campaigns where user is a GM (only GMs can sync encounters)
			const data = await api.getCampaigns({ gmOnly: true });
			setCampaigns(data);

			// Check if encounter is already synced
			const info = encounterStorage.getEncounterSyncInfo(props.encounter.id);
			if (info) {
				setSyncInfo(info);
				setSelectedCampaignId(info.campaignId);
			}
		} catch (error) {
			console.error('[SYNC ENCOUNTER] Failed to load campaigns:', error);
			message.error('Failed to load campaigns');
		} finally {
			setLoading(false);
		}
	};

	const handleSync = async () => {
		if (!selectedCampaignId) {
			message.error('Please select a campaign');
			return;
		}

		setSyncing(true);
		try {
			const result = await encounterStorage.syncEncounterToCampaign(selectedCampaignId, props.encounter);
			if (result) {
				const campaignName = campaigns.find(c => c.id === selectedCampaignId)?.name;
				message.success(`Encounter synced to ${campaignName}`);
				setSyncInfo({
					dbId: result.id,
					campaignId: result.campaign_id
				});
				props.onSyncComplete();
			} else {
				throw new Error('Sync failed');
			}
		} catch (error: any) {
			console.error('[SYNC ENCOUNTER] Sync failed:', error);
			message.error(error.message || 'Failed to sync encounter');
		} finally {
			setSyncing(false);
		}
	};

	const handleUnsync = async () => {
		if (!syncInfo) return;

		setSyncing(true);
		try {
			const success = await encounterStorage.unsyncEncounterFromCampaign(
				syncInfo.campaignId,
				props.encounter.id
			);
			if (success) {
				message.success('Encounter removed from campaign sync');
				setSyncInfo(null);
				setSelectedCampaignId(null);
				props.onSyncComplete();
			} else {
				throw new Error('Failed to unsync');
			}
		} catch (error: any) {
			console.error('[SYNC ENCOUNTER] Unsync failed:', error);
			message.error(error.message || 'Failed to unsync encounter');
		} finally {
			setSyncing(false);
		}
	};

	const getCurrentCampaignName = () => {
		if (!syncInfo) return null;
		return campaigns.find(c => c.id === syncInfo.campaignId)?.name || 'Unknown Campaign';
	};

	const content = (
		<div className='sync-encounter-modal-content'>
			<div className='encounter-info'>
				<CloudOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
				<div className='encounter-name'>{props.encounter.name || 'Unnamed Encounter'}</div>
			</div>

			{loading ? (
				<div className='loading-container'>
					<Spin size='large' />
					<div style={{ marginTop: '12px' }}>Loading campaigns...</div>
				</div>
			) : (
				<>
					{syncInfo ? (
						<>
							<div className='sync-status synced'>
								<CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
								<span>Synced to:</span>
								<Tag color='green' style={{ marginLeft: '8px' }}>
									{getCurrentCampaignName()}
								</Tag>
							</div>

							<div className='action-section'>
								<Button
									block
									danger
									size='large'
									onClick={handleUnsync}
									loading={syncing}
									disabled={syncing}
								>
									Remove from Campaign Sync
								</Button>
							</div>

							<div style={{ margin: '20px 0', textAlign: 'center', color: '#888' }}>
								or switch to a different campaign
							</div>

							<div className='campaign-select'>
								<div className='select-label'>Sync to Different Campaign:</div>
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
									icon={<SyncOutlined />}
									onClick={handleSync}
									loading={syncing}
									disabled={!selectedCampaignId || selectedCampaignId === syncInfo.campaignId || syncing}
									style={{ marginTop: '12px' }}
								>
									Switch Campaign
								</Button>
							</div>
						</>
					) : (
						<>
							<div className='sync-status not-synced'>
								<CloudOutlined style={{ color: '#888', marginRight: '8px' }} />
								<span>Not synced to any campaign</span>
							</div>

							<div className='campaign-select'>
								<div className='select-label'>Select Campaign to Sync:</div>
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
								{campaigns.length === 0 && (
									<div style={{ marginTop: '8px', color: '#888', fontSize: '12px' }}>
										You are not a GM of any campaigns. Only GMs can sync encounters to campaigns.
									</div>
								)}
							</div>

							<Button
								block
								type='primary'
								size='large'
								icon={<CloudSyncOutlined />}
								onClick={handleSync}
								loading={syncing}
								disabled={!selectedCampaignId || syncing}
								style={{ marginTop: '16px' }}
							>
								Sync to Campaign
							</Button>
						</>
					)}

					<div className='help-text'>
						Syncing an encounter to a campaign allows you to access it from any device
						when logged in. Other GMs in the campaign can also view and edit the encounter.
					</div>
				</>
			)}
		</div>
	);

	return (
		<Modal
			content={content}
			onClose={props.onClose}
		/>
	);
};
