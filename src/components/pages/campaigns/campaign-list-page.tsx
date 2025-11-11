import { Button, Card, Input, Modal, Select, Spin, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppFooter } from '@/components/panels/app-footer/app-footer';
import { AppHeader } from '@/components/panels/app-header/app-header';
import { Campaign } from '@/models/campaign';
import { Empty } from '@/components/controls/empty/empty';
import { ErrorBoundary } from '@/components/controls/error-boundary/error-boundary';
import { SelectablePanel } from '@/components/controls/selectable-panel/selectable-panel';
import { Utils } from '@/utils/utils';
import { useTitle } from '@/hooks/use-title';
import * as api from '@/services/api';

import './campaign-list-page.scss';

interface Props {
	showReference: () => void;
	showRoll: () => void;
	showAbout: () => void;
	showSettings: () => void;
}

export const CampaignListPage = (props: Props) => {
	const navigate = useNavigate();
	const [ campaigns, setCampaigns ] = useState<Campaign[]>([]);
	const [ loading, setLoading ] = useState<boolean>(true);
	const [ searchTerm, setSearchTerm ] = useState<string>('');
	const [ isModalOpen, setIsModalOpen ] = useState<boolean>(false);
	const [ newCampaignName, setNewCampaignName ] = useState<string>('');
	const [ newCampaignDescription, setNewCampaignDescription ] = useState<string>('');
	const [ creating, setCreating ] = useState<boolean>(false);
	const [ gmChoice, setGmChoice ] = useState<'self' | 'other'>('self');
	const [ allUsers, setAllUsers ] = useState<api.PublicUserSummary[]>([]);
	const [ loadingUsers, setLoadingUsers ] = useState<boolean>(false);
	const [ selectedGmId, setSelectedGmId ] = useState<number | null>(null);

	useTitle('Campaigns');

	useEffect(() => {
		loadCampaigns();
	}, []);

	const loadCampaigns = async () => {
		try {
			setLoading(true);
			const data = await api.getCampaigns();
			setCampaigns(data);
		} catch (error) {
			console.error('Failed to load campaigns:', error);
			message.error('Failed to load campaigns');
		} finally {
			setLoading(false);
		}
	};

	const loadAllUsers = async () => {
		setLoadingUsers(true);
		try {
			const results = await api.searchUsers('co');
			setAllUsers(results);
		} catch (error) {
			console.error('Failed to load users:', error);
			message.error('Failed to load users');
		} finally {
			setLoadingUsers(false);
		}
	};

	const handleCreateCampaign = async () => {
		if (!newCampaignName.trim()) {
			message.error('Campaign name is required');
			return;
		}

		if (gmChoice === 'other' && !selectedGmId) {
			message.error('Please select a GM');
			return;
		}

		try {
			setCreating(true);
			await api.createCampaign({
				name: newCampaignName.trim(),
				description: newCampaignDescription.trim() || null,
				gm_user_id: gmChoice === 'other' ? selectedGmId : undefined
			});
			message.success('Campaign created successfully');
			setIsModalOpen(false);
			setNewCampaignName('');
			setNewCampaignDescription('');
			setGmChoice('self');
			setSelectedGmId(null);
			await loadCampaigns();
		} catch (error) {
			console.error('Failed to create campaign:', error);
			message.error('Failed to create campaign');
		} finally {
			setCreating(false);
		}
	};

	const handleDeleteCampaign = async (id: number, name: string) => {
		Modal.confirm({
			title: 'Delete Campaign',
			content: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
			onOk: async () => {
				try {
					await api.deleteCampaign(id);
					message.success('Campaign deleted successfully');
					await loadCampaigns();
				} catch (error) {
					console.error('Failed to delete campaign:', error);
					message.error('Failed to delete campaign');
				}
			}
		});
	};

	const filteredCampaigns = campaigns.filter(c =>
		Utils.textMatches([c.name, c.description || ''], searchTerm)
	);

	const getCampaignsSection = () => {
		if (loading) {
			return (
				<div style={{ textAlign: 'center', padding: '50px' }}>
					<Spin size='large' />
				</div>
			);
		}

		if (filteredCampaigns.length === 0) {
			return <Empty />;
		}

		return (
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
				{
					filteredCampaigns.map(campaign => (
						<SelectablePanel key={campaign.id} onSelect={() => navigate(`/campaigns/${campaign.id}`)}>
							<Card
								title={campaign.name}
								extra={
									campaign.user_role === 'gm' ? (
										<Button
											danger
											size='small'
											icon={<DeleteOutlined />}
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteCampaign(campaign.id, campaign.name);
											}}
										>
											Delete
										</Button>
									) : null
								}
								style={{ cursor: 'pointer' }}
							>
								<div style={{ marginBottom: '10px' }}>
									{campaign.description || <em>No description</em>}
								</div>
								<div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#888' }}>
									<div>
										{campaign.user_role === 'gm' ? <TeamOutlined /> : <UserOutlined />}
										{' '}
										{campaign.user_role === 'gm' ? 'GM' : 'Player'}
									</div>
									<div>
										Created by: {campaign.creator_display_name || campaign.creator_email}
									</div>
								</div>
							</Card>
						</SelectablePanel>
					))
				}
			</div>
		);
	};

	return (
		<ErrorBoundary>
			<div className='campaign-list-page'>
				<AppHeader subheader='Campaigns'>
					<Input
						name='search'
						placeholder='Search'
						allowClear={true}
						value={searchTerm}
						suffix={<SearchOutlined />}
						onChange={e => setSearchTerm(e.target.value)}
					/>
					<div className='divider' />
					<Button type='primary' icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
						Create Campaign
					</Button>
				</AppHeader>
				<div className='campaign-list-page-content'>
					{getCampaignsSection()}
				</div>
				<AppFooter
					page='campaigns'
					highlightAbout={false}
					showReference={props.showReference}
					showRoll={props.showRoll}
					showAbout={props.showAbout}
					showSettings={props.showSettings}
				/>
			</div>

			<Modal
				title='Create New Campaign'
				open={isModalOpen}
				onOk={handleCreateCampaign}
				onCancel={() => {
					setIsModalOpen(false);
					setNewCampaignName('');
					setNewCampaignDescription('');
					setGmChoice('self');
					setSelectedGmId(null);
				}}
				confirmLoading={creating}
				afterOpenChange={(open) => {
					if (open) {
						loadAllUsers();
					}
				}}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
					<div>
						<label htmlFor='campaign-name'>Campaign Name *</label>
						<Input
							id='campaign-name'
							value={newCampaignName}
							onChange={e => setNewCampaignName(e.target.value)}
							placeholder='Enter campaign name'
						/>
					</div>
					<div>
						<label htmlFor='campaign-description'>Description</label>
						<Input.TextArea
							id='campaign-description'
							value={newCampaignDescription}
							onChange={e => setNewCampaignDescription(e.target.value)}
							placeholder='Enter campaign description (optional)'
							rows={3}
						/>
					</div>
					<div>
						<label>Game Master</label>
						<Select
							style={{ width: '100%' }}
							value={gmChoice}
							onChange={(value) => {
								setGmChoice(value);
								if (value === 'self') {
									setSelectedGmId(null);
								}
							}}
							options={[
								{ value: 'self', label: 'Make me the GM' },
								{ value: 'other', label: 'Assign a different GM' }
							]}
						/>
					</div>
					{gmChoice === 'other' && (
						<div>
							<label>Select GM</label>
							<Select
								style={{ width: '100%' }}
								placeholder='Select a user as GM...'
								value={selectedGmId}
								onChange={setSelectedGmId}
								showSearch
								loading={loadingUsers}
								filterOption={(input, option) => {
									const label = option?.label?.toString().toLowerCase() || '';
									return label.includes(input.toLowerCase());
								}}
								options={allUsers.map(user => ({
									value: user.id,
									label: `${user.display_name || user.email} (${user.email})`
								}))}
							/>
						</div>
					)}
				</div>
			</Modal>
		</ErrorBoundary>
	);
};
