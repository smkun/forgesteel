import { Button, Card, Input, Modal, Select, Spin, Tabs, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AppFooter } from '@/components/panels/app-footer/app-footer';
import { AppHeader } from '@/components/panels/app-header/app-header';
import { Campaign, CampaignMember, CampaignProject, CreateProjectRequest, UpdateProjectRequest, UpdateProgressRequest } from '@/models/campaign';
import { Empty } from '@/components/controls/empty/empty';
import { ErrorBoundary } from '@/components/controls/error-boundary/error-boundary';
import { HeaderText } from '@/components/controls/header-text/header-text';
import { SelectablePanel } from '@/components/controls/selectable-panel/selectable-panel';
import { useTitle } from '@/hooks/use-title';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/hooks/use-navigation';
import * as api from '@/services/api';
import { ProjectList } from '@/components/campaigns/projects/ProjectList';
import { ProjectCard } from '@/components/campaigns/projects/ProjectCard';
import { ProjectForm } from '@/components/campaigns/projects/ProjectForm';
import { ProgressUpdateModal } from '@/components/campaigns/projects/ProgressUpdateModal';
import { EncounterList } from '@/components/campaigns/encounters/EncounterList';
import { SyncEncounterModal } from '@/components/modals/sync-encounter/sync-encounter-modal';
import { Sourcebook } from '@/models/sourcebook';
import { SourcebookLogic } from '@/logic/sourcebook-logic';
import localforage from 'localforage';

import './campaign-details-page.scss';

interface Props {
	highlightAbout: boolean;
	showReference: () => void;
	showRoll: () => void;
	showAbout: () => void;
	showSettings: () => void;
}

export const CampaignDetailsPage = (props: Props) => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const navigation = useNavigation();
	const { userProfile } = useAuth();
	const [ campaign, setCampaign ] = useState<Campaign | null>(null);
	const [ members, setMembers ] = useState<CampaignMember[]>([]);
	const [ characters, setCharacters ] = useState<api.CharacterResponse[]>([]);
	const [ allCharacters, setAllCharacters ] = useState<api.CharacterResponse[]>([]);
	const [ loading, setLoading ] = useState<boolean>(true);
	const [ saving, setSaving ] = useState<boolean>(false);

	// Edit campaign state
	const [ editedName, setEditedName ] = useState<string>('');
	const [ editedDescription, setEditedDescription ] = useState<string>('');
	const [ pendingRoleChanges, setPendingRoleChanges ] = useState<Map<number, 'gm' | 'player'>>(new Map());

	// Add member modal state
	const [ addMemberModalOpen, setAddMemberModalOpen ] = useState<boolean>(false);
	const [ allUsers, setAllUsers ] = useState<api.PublicUserSummary[]>([]);
	const [ loadingUsers, setLoadingUsers ] = useState<boolean>(false);
	const [ selectedUserId, setSelectedUserId ] = useState<number | null>(null);
	const [ newMemberRole, setNewMemberRole ] = useState<'gm' | 'player'>('player');
	const [ addingMember, setAddingMember ] = useState<boolean>(false);

	// Assign character modal state
	const [ assignCharModalOpen, setAssignCharModalOpen ] = useState<boolean>(false);
	const [ selectedCharacterId, setSelectedCharacterId ] = useState<number | null>(null);
	const [ assigningChar, setAssigningChar ] = useState<boolean>(false);

	// Projects state
	const [ projects, setProjects ] = useState<CampaignProject[]>([]);
	const [ loadingProjects, setLoadingProjects ] = useState<boolean>(false);
	const [ showCompleted, setShowCompleted ] = useState<boolean>(true);
	const [ projectFormModalOpen, setProjectFormModalOpen ] = useState<boolean>(false);
	const [ editingProject, setEditingProject ] = useState<CampaignProject | undefined>(undefined);
	const [ selectedProject, setSelectedProject ] = useState<CampaignProject | undefined>(undefined);
	const [ progressModalOpen, setProgressModalOpen ] = useState<boolean>(false);

	// Encounters state
	const [ encounters, setEncounters ] = useState<api.CampaignEncounterResponse[]>([]);
	const [ loadingEncounters, setLoadingEncounters ] = useState<boolean>(false);
	const [ syncEncounterModalOpen, setSyncEncounterModalOpen ] = useState<boolean>(false);
	const [ sourcebooks, setSourcebooks ] = useState<Sourcebook[]>([]);

	useTitle(campaign ? campaign.name : 'Campaign');

	useEffect(() => {
		if (id) {
			loadCampaignDetails();
		}
	}, [ id ]);

	useEffect(() => {
		// Load projects when campaign is loaded or showCompleted changes
		if (campaign) {
			loadProjects();
		}
	}, [ campaign, showCompleted ]);

	useEffect(() => {
		// Load encounters when campaign is loaded
		if (campaign) {
			loadEncounters();
		}
	}, [ campaign ]);

	useEffect(() => {
		// Load sourcebooks for monster counting
		const loadSourcebooks = async () => {
			try {
				const homebrewSourcebooks = await localforage.getItem<Sourcebook[]>('forgesteel-homebrew-settings') || [];
				setSourcebooks(SourcebookLogic.getSourcebooks(homebrewSourcebooks));
			} catch (error) {
				console.error('[CAMPAIGNS] Failed to load sourcebooks:', error);
				setSourcebooks(SourcebookLogic.getSourcebooks([]));
			}
		};
		loadSourcebooks();
	}, []);

	const loadCampaignDetails = async () => {
		if (!id) return;

		try {
			setLoading(true);
			const campaignId = parseInt(id);

			// Load campaign details
			const [ campaignData, membersData, charactersData, allCharsData ] = await Promise.all([
				api.getCampaign(campaignId),
				api.getCampaignMembers(campaignId),
				api.getCampaignCharacters(campaignId),
				api.getCharacters()
			]);

			setCampaign(campaignData);
			setEditedName(campaignData.name);
			setEditedDescription(campaignData.description || '');
			setMembers(membersData.members || []);
			setCharacters(charactersData.characters || []);
			setAllCharacters(allCharsData);
			setPendingRoleChanges(new Map()); // Clear pending changes on reload
		} catch (error) {
			console.error('Failed to load campaign details:', error);
			message.error('Failed to load campaign details');
			navigation.goToCampaigns();
		} finally {
			setLoading(false);
		}
	};

	const handleSaveCampaign = async () => {
		if (!campaign) return;
		if (!editedName.trim()) {
			message.error('Campaign name is required');
			return;
		}

		try {
			setSaving(true);

			// Save campaign details
			await api.updateCampaign(campaign.id, {
				name: editedName.trim(),
				description: editedDescription.trim() || null
			});

			// Save pending role changes
			if (pendingRoleChanges.size > 0) {
				for (const [userId, newRole] of pendingRoleChanges.entries()) {
					await api.updateCampaignMemberRole(campaign.id, userId, newRole);
				}
				setPendingRoleChanges(new Map());
			}

			message.success('Campaign updated successfully');
			await loadCampaignDetails();
		} catch (error) {
			console.error('Failed to update campaign:', error);
			message.error('Failed to update campaign');
		} finally {
			setSaving(false);
		}
	};

	const loadAllUsers = async () => {
		setLoadingUsers(true);
		try {
			// Search with common pattern to get all users (backend requires 2+ chars)
			// Using 'co' which appears in '.com' emails and common names
			const results = await api.searchUsers('co');
			setAllUsers(results);
		} catch (error) {
			console.error('Failed to load users:', error);
			message.error('Failed to load users');
		} finally {
			setLoadingUsers(false);
		}
	};

	const openAddMemberModal = () => {
		setAddMemberModalOpen(true);
		loadAllUsers();
	};

	const handleAddMember = async () => {
		if (!campaign) return;
		if (!selectedUserId) {
			message.error('Please select a user');
			return;
		}

		const selectedUser = allUsers.find(u => u.id === selectedUserId);
		if (!selectedUser) return;

		try {
			setAddingMember(true);
			await api.addCampaignMember(campaign.id, selectedUser.email, newMemberRole);
			message.success('Member added successfully');
			setAddMemberModalOpen(false);
			setSelectedUserId(null);
			setNewMemberRole('player');
			await loadCampaignDetails();
		} catch (error) {
			console.error('Failed to add member:', error);
			message.error('Failed to add member');
		} finally {
			setAddingMember(false);
		}
	};

	const handleRemoveMember = async (userId: number, displayName: string | null) => {
		if (!campaign) return;

		Modal.confirm({
			title: 'Remove Member',
			content: `Are you sure you want to remove ${displayName || 'this member'} from the campaign?`,
			onOk: async () => {
				try {
					await api.removeCampaignMember(campaign.id, userId);
					message.success('Member removed successfully');
					await loadCampaignDetails();
				} catch (error) {
					console.error('Failed to remove member:', error);
					message.error('Failed to remove member');
				}
			}
		});
	};

	const handleRoleChange = (userId: number, newRole: 'gm' | 'player') => {
		setPendingRoleChanges(prev => {
			const updated = new Map(prev);
			updated.set(userId, newRole);
			return updated;
		});
	};

	const getMemberRole = (member: CampaignMember): 'gm' | 'player' => {
		// Return pending role if it exists, otherwise return current role
		return pendingRoleChanges.get(member.user_id) ?? member.role;
	};

	const handleAssignCharacter = async () => {
		if (!campaign || !selectedCharacterId) return;

		try {
			setAssigningChar(true);
			await api.assignCharacterToCampaign(selectedCharacterId, campaign.id);
			message.success('Character assigned to campaign');
			setAssignCharModalOpen(false);
			setSelectedCharacterId(null);
			await loadCampaignDetails();
		} catch (error) {
			console.error('Failed to assign character:', error);
			message.error('Failed to assign character');
		} finally {
			setAssigningChar(false);
		}
	};

	const handleRemoveCharacter = async (characterId: number, characterName: string) => {
		if (!campaign) return;

		Modal.confirm({
			title: 'Remove Character',
			content: `Are you sure you want to remove ${characterName} from this campaign?`,
			onOk: async () => {
				try {
					await api.removeCharacterFromCampaign(characterId, campaign.id);
					message.success('Character removed from campaign');
					await loadCampaignDetails();
				} catch (error) {
					console.error('Failed to remove character:', error);
					message.error('Failed to remove character');
				}
			}
		});
	};

	// ================================================================
	// PROJECT HANDLERS
	// ================================================================

	const loadProjects = async () => {
		if (!id) return;

		try {
			setLoadingProjects(true);
			const campaignId = parseInt(id);
			const projectsData = await api.getCampaignProjects(campaignId, {
				includeCompleted: showCompleted,
				flat: false // Get hierarchical structure
			});
			setProjects(projectsData);
		} catch (error) {
			console.error('Failed to load projects:', error);
			message.error('Failed to load projects');
		} finally {
			setLoadingProjects(false);
		}
	};

	const loadEncounters = async () => {
		if (!campaign) return;

		try {
			setLoadingEncounters(true);
			const encountersData = await api.getCampaignEncounters(campaign.id);
			setEncounters(encountersData);
		} catch (error) {
			console.error('Failed to load encounters:', error);
			// Don't show error message - encounters tab may just be empty
		} finally {
			setLoadingEncounters(false);
		}
	};

	const handleRemoveEncounter = async (encounterId: number) => {
		if (!campaign) return;

		try {
			await api.deleteCampaignEncounter(campaign.id, encounterId);
			message.success('Encounter removed from campaign');
			loadEncounters();
		} catch (error) {
			console.error('Failed to remove encounter:', error);
			message.error('Failed to remove encounter');
		}
	};

	const handleRunEncounterInSession = (encounter: api.CampaignEncounterResponse) => {
		// Navigate to session with encounter data
		// For now, just navigate to session - encounter loading can be added later
		navigation.goToSession();
	};

	const handleEncounterSynced = () => {
		setSyncEncounterModalOpen(false);
		loadEncounters();
		message.success('Encounter synced to campaign');
	};

	const handleCreateProject = () => {
		setEditingProject(undefined);
		setProjectFormModalOpen(true);
	};

	const handleEditProject = (project: CampaignProject) => {
		setEditingProject(project);
		setProjectFormModalOpen(true);
	};

	const handleProjectFormSubmit = async (data: CreateProjectRequest | UpdateProjectRequest) => {
		if (!campaign) return;

		try {
			if (editingProject) {
				// Update existing project
				await api.updateCampaignProject(campaign.id, editingProject.id, data as UpdateProjectRequest);
				message.success('Project updated successfully');
			} else {
				// Create new project
				await api.createCampaignProject(campaign.id, data as CreateProjectRequest);
				message.success('Project created successfully');
			}
			setProjectFormModalOpen(false);
			setEditingProject(undefined);
			await loadProjects();
		} catch (error) {
			console.error('Failed to save project:', error);
			message.error('Failed to save project');
			throw error; // Re-throw to keep form loading state
		}
	};

	const handleUpdateProgress = (project: CampaignProject) => {
		setSelectedProject(project);
		setProgressModalOpen(true);
	};

	const handleProgressSubmit = async (data: UpdateProgressRequest) => {
		if (!campaign || !selectedProject) return;

		try {
			await api.updateProjectProgress(campaign.id, selectedProject.id, data);
			message.success('Progress updated successfully');
			setProgressModalOpen(false);
			setSelectedProject(undefined);
			await loadProjects();
		} catch (error) {
			console.error('Failed to update progress:', error);
			message.error('Failed to update progress');
			throw error;
		}
	};

	const handleToggleComplete = async (project: CampaignProject) => {
		if (!campaign) return;

		try {
			if (project.isCompleted) {
				// Can't un-complete via this UI (would need backend support)
				message.info('Project is already completed');
			} else {
				await api.completeProject(campaign.id, project.id, {});
				message.success('Project marked as completed');
				await loadProjects();
			}
		} catch (error) {
			console.error('Failed to toggle completion:', error);
			message.error('Failed to toggle completion');
		}
	};

	const handleDeleteProject = (project: CampaignProject) => {
		if (!campaign) return;

		Modal.confirm({
			title: 'Delete Project',
			content: `Are you sure you want to delete "${project.name}"? This will also delete all sub-projects.`,
			okText: 'Delete',
			okType: 'danger',
			onOk: async () => {
				try {
					await api.deleteCampaignProject(campaign.id, project.id);
					message.success('Project deleted successfully');
					await loadProjects();
				} catch (error) {
					console.error('Failed to delete project:', error);
					message.error('Failed to delete project');
				}
			}
		});
	};

	const handleCreateSubProject = (_parentProject: CampaignProject) => {
		setEditingProject(undefined);
		setProjectFormModalOpen(true);
		// Note: We'd need to pass _parentProject.id to the form somehow
		// For now, user can select it from the dropdown
	};

	if (loading) {
		return (
			<ErrorBoundary>
				<div className='campaign-details-page'>
					<AppHeader>Campaign Details</AppHeader>
					<div className='campaign-details-content'>
						<Spin size='large' />
					</div>
					<AppFooter
						page='heroes'
						highlightAbout={props.highlightAbout}
						showReference={props.showReference}
						showRoll={props.showRoll}
						showAbout={props.showAbout}
						showSettings={props.showSettings}
					/>
				</div>
			</ErrorBoundary>
		);
	}

	if (!campaign) {
		return (
			<ErrorBoundary>
				<div className='campaign-details-page'>
					<AppHeader>Campaign Not Found</AppHeader>
					<div className='campaign-details-content'>
						<Empty />
					</div>
					<AppFooter
						page='heroes'
						highlightAbout={props.highlightAbout}
						showReference={props.showReference}
						showRoll={props.showRoll}
						showAbout={props.showAbout}
						showSettings={props.showSettings}
					/>
				</div>
			</ErrorBoundary>
		);
	}

	const unassignedCharacters = allCharacters.filter(char => !char.campaign_id);
	// Admin users, GMs, or campaign creators can manage the campaign
	const isCreator = campaign.created_by_user_id === userProfile?.id;
	const isGM = campaign.user_role === 'gm' || userProfile?.is_admin === true || isCreator;

	// Filter out users who are already members of this campaign
	const availableUsers = allUsers.filter(user =>
		!members.some(member => member.user_id === user.id)
	);

	return (
		<ErrorBoundary>
			<div className='campaign-details-page'>
				<AppHeader subheader={campaign.name}>
					<Button onClick={() => navigation.goToCampaigns()}>Back to Campaigns</Button>
					{isGM && (
						<>
							<div className='divider' />
							<Button type='primary' icon={<SaveOutlined />} onClick={handleSaveCampaign} loading={saving}>
								Save Changes
							</Button>
						</>
					)}
				</AppHeader>
				<div className='campaign-details-content'>
					<Tabs
						defaultActiveKey='details'
						items={[
							{
								key: 'details',
								label: 'Details',
								children: (
									<SelectablePanel>
										<HeaderText>Campaign Details</HeaderText>
										<div className='field'>
											<label>Name:</label>
											<Input
												value={editedName}
												onChange={e => setEditedName(e.target.value)}
												disabled={!isGM}
											/>
										</div>
										<div className='field'>
											<label>Description:</label>
											<Input.TextArea
												value={editedDescription}
												onChange={e => setEditedDescription(e.target.value)}
												rows={4}
												disabled={!isGM}
											/>
										</div>
										<div className='field'>
											<label>Created By:</label>
											<div>{campaign.creator_display_name || campaign.creator_email}</div>
										</div>
										<div className='field'>
											<label>Your Role:</label>
											<div>
												{campaign.user_role === 'gm' ? 'Game Master' : campaign.user_role === 'player' ? 'Player' : 'Creator'}
												{userProfile?.is_admin && ' (Admin)'}
											</div>
										</div>
									</SelectablePanel>
								)
							},
							{
								key: 'members',
								label: `Members (${members.length})`,
								children: (
									<div>
										{isGM && (
											<div style={{ marginBottom: '20px' }}>
												<Button
													type='primary'
													icon={<UserAddOutlined />}
													onClick={openAddMemberModal}
												>
													Add Member
												</Button>
											</div>
										)}
										{members.length === 0 ? (
											<Empty text='No members in this campaign' />
										) : (
											<div className='members-grid'>
												{members.map(member => (
													<SelectablePanel key={member.id}>
														<Card
															title={member.display_name || member.email}
															extra={
																isGM && (
																	<Button
																		danger
																		size='small'
																		icon={<UserDeleteOutlined />}
																		onClick={() => handleRemoveMember(member.user_id, member.display_name ?? null)}
																	>
																		Remove
																	</Button>
																)
															}
														>
															<div><strong>Email:</strong> {member.email}</div>
															<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
																<strong>Role:</strong>
																{isGM ? (
																	<>
																		<Select
																			size='small'
																			value={getMemberRole(member)}
																			onChange={(newRole) => handleRoleChange(member.user_id, newRole)}
																			style={{ width: '140px' }}
																			options={[
																				{ value: 'player', label: 'Player' },
																				{ value: 'gm', label: 'Game Master' }
																			]}
																		/>
																		{pendingRoleChanges.has(member.user_id) && (
																			<span style={{ color: '#faad14', fontSize: '12px' }}>*</span>
																		)}
																	</>
																) : (
																	<span>{member.role === 'gm' ? 'Game Master' : 'Player'}</span>
																)}
															</div>
															<div><strong>Joined:</strong> {new Date(member.joined_at).toLocaleDateString()}</div>
														</Card>
													</SelectablePanel>
												))}
											</div>
										)}
									</div>
								)
							},
							{
								key: 'characters',
								label: `Characters (${characters.length})`,
								children: (
									<div>
										{isGM && (
											<div style={{ marginBottom: '20px' }}>
												<Button
													type='primary'
													icon={<PlusOutlined />}
													onClick={() => setAssignCharModalOpen(true)}
													disabled={unassignedCharacters.length === 0}
												>
													Assign Character
												</Button>
											</div>
										)}
										{characters.length === 0 ? (
											<Empty text='No characters in this campaign' />
										) : (
											<div className='characters-grid'>
												{characters.map(character => (
													<SelectablePanel
														key={character.id}
														onSelect={() => navigate(`/hero/view/${character.hero.id}`, { state: { returnToCampaign: id } })}
													>
														<Card
															title={character.name || 'Unnamed Character'}
															extra={
																isGM && (
																	<Button
																		danger
																		size='small'
																		icon={<DeleteOutlined />}
																		onClick={(e) => {
																			e.stopPropagation();
																			handleRemoveCharacter(character.id, character.name || 'character');
																		}}
																	>
																		Remove
																	</Button>
																)
															}
														>
															<div><strong>Owner:</strong> {character.owner_display_name || character.owner_email}</div>
															{character.hero && (
																<>
																	<div><strong>Level:</strong> {character.hero.class?.level ?? 1}</div>
																	<div><strong>Ancestry:</strong> {character.hero.ancestry?.name}</div>
																	<div><strong>Class:</strong> {character.hero.class?.name}</div>
																</>
															)}
														</Card>
													</SelectablePanel>
												))}
											</div>
										)}
									</div>
								)
							},
							{
								key: 'projects',
								label: `Projects (${projects.length})`,
								children: (
									<div>
										<ProjectList
											projects={projects}
											loading={loadingProjects}
											onSelectProject={(project) => setSelectedProject(project)}
											onCreateProject={handleCreateProject}
											showCompleted={showCompleted}
											onToggleShowCompleted={setShowCompleted}
											isGM={isGM}
										/>
										{selectedProject && !projectFormModalOpen && !progressModalOpen && (
											<div style={{ marginTop: '20px' }}>
												<ProjectCard
													project={selectedProject}
													onEdit={handleEditProject}
													onDelete={handleDeleteProject}
													onUpdateProgress={handleUpdateProgress}
													onToggleComplete={handleToggleComplete}
													onCreateSubProject={handleCreateSubProject}
													canEdit={isGM || selectedProject.createdBy.id === userProfile?.id}
													showActions={true}
												/>
											</div>
										)}
									</div>
								)
							},
							{
								key: 'encounters',
								label: `Encounters (${encounters.length})`,
								children: (
									<EncounterList
										encounters={encounters}
										sourcebooks={sourcebooks}
										loading={loadingEncounters}
										isGM={isGM}
										onRemove={handleRemoveEncounter}
										onRunInSession={handleRunEncounterInSession}
										onSyncEncounter={() => setSyncEncounterModalOpen(true)}
									/>
								)
							}
						]}
					/>
				</div>

				{/* Add Member Modal */}
				<Modal
					title='Add Member to Campaign'
					open={addMemberModalOpen}
					onCancel={() => {
						setAddMemberModalOpen(false);
						setSelectedUserId(null);
						setNewMemberRole('player');
					}}
					onOk={handleAddMember}
					confirmLoading={addingMember}
					okButtonProps={{ disabled: !selectedUserId }}
				>
					<div style={{ marginBottom: '15px' }}>
						<label>Select User:</label>
						<Select
							style={{ width: '100%' }}
							placeholder='Select a user to add...'
							value={selectedUserId}
							onChange={setSelectedUserId}
							showSearch
							loading={loadingUsers}
							filterOption={(input, option) => {
								const label = option?.label?.toString().toLowerCase() || '';
								return label.includes(input.toLowerCase());
							}}
							options={availableUsers.map(user => ({
								value: user.id,
								label: `${user.display_name || user.email} (${user.email})`
							}))}
						/>
						{availableUsers.length === 0 && !loadingUsers && (
							<div style={{ marginTop: '8px', color: '#888', fontSize: '12px' }}>
								All users are already members of this campaign
							</div>
						)}
					</div>
					<div>
						<label>Role:</label>
						<Select
							style={{ width: '100%' }}
							value={newMemberRole}
							onChange={setNewMemberRole}
							options={[
								{ value: 'player', label: 'Player' },
								{ value: 'gm', label: 'Game Master' }
							]}
						/>
					</div>
				</Modal>

				{/* Assign Character Modal */}
				<Modal
					title='Assign Character to Campaign'
					open={assignCharModalOpen}
					onCancel={() => {
						setAssignCharModalOpen(false);
						setSelectedCharacterId(null);
					}}
					onOk={handleAssignCharacter}
					confirmLoading={assigningChar}
				>
					<div>
						<label>Select Character:</label>
						<Select
							style={{ width: '100%' }}
							placeholder='Select a character'
							value={selectedCharacterId}
							onChange={setSelectedCharacterId}
							options={unassignedCharacters.map(char => ({
								value: char.id,
								label: `${char.name || 'Unnamed'} (${char.owner_display_name || char.owner_email})`
							}))}
						/>
					</div>
				</Modal>

				{/* Project Form Modal */}
				<Modal
					title={editingProject ? 'Edit Project' : 'Create New Project'}
					open={projectFormModalOpen}
					onCancel={() => {
						setProjectFormModalOpen(false);
						setEditingProject(undefined);
					}}
					footer={null}
					width={800}
				>
					<ProjectForm
						campaignId={campaign.id}
						characters={characters.map(char => ({
							id: char.id,
							name: char.name || 'Unnamed',
							owner_user_id: char.owner_user_id
						}))}
						currentUserId={userProfile?.id || 0}
						isGM={isGM}
						existingProject={editingProject}
						parentProjects={projects}
						onSubmit={handleProjectFormSubmit}
						onCancel={() => {
							setProjectFormModalOpen(false);
							setEditingProject(undefined);
						}}
					/>
				</Modal>

				{/* Progress Update Modal */}
				{selectedProject && (
					<ProgressUpdateModal
						project={selectedProject}
						visible={progressModalOpen}
						onSubmit={handleProgressSubmit}
						onCancel={() => {
							setProgressModalOpen(false);
							setSelectedProject(undefined);
						}}
					/>
				)}

				{/* Sync Encounter Modal */}
				<SyncEncounterModal
					open={syncEncounterModalOpen}
					campaignId={campaign.id}
					campaignName={campaign.name}
					onCancel={() => setSyncEncounterModalOpen(false)}
					onSynced={handleEncounterSynced}
				/>

				<AppFooter
					page='campaigns'
					highlightAbout={props.highlightAbout}
					showReference={props.showReference}
					showRoll={props.showRoll}
					showAbout={props.showAbout}
					showSettings={props.showSettings}
				/>
			</div>
		</ErrorBoundary>
	);
};