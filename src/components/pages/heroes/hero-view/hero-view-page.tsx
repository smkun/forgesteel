import { Alert, Button, Divider, Empty, Popover } from 'antd';
import { CloseOutlined, CopyOutlined, DownOutlined, EditOutlined, TeamOutlined, ToolOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { Ability } from '@/models/ability';
import { Ancestry } from '@/models/ancestry';
import { AppFooter } from '@/components/panels/app-footer/app-footer';
import { AppHeader } from '@/components/panels/app-header/app-header';
import { AssignCampaignModal } from '@/components/modals/assign-campaign/assign-campaign-modal';
import { Career } from '@/models/career';
import { Characteristic } from '@/enums/characteristic';
import { Complication } from '@/models/complication';
import { Culture } from '@/models/culture';
import { DangerButton } from '@/components/controls/danger-button/danger-button';
import { Domain } from '@/models/domain';
import { ErrorBoundary } from '@/components/controls/error-boundary/error-boundary';
import { Feature } from '@/models/feature';
import { Follower } from '@/models/follower';
import { Hero } from '@/models/hero';
import { HeroClass } from '@/models/class';
import { HeroPanel } from '@/components/panels/hero/hero-panel';
import { HeroSheetPage } from '@/components/pages/heroes/hero-sheet/hero-sheet-page';
import { HeroStatePage } from '@/enums/hero-state-page';
import { Kit } from '@/models/kit';
import { Monster } from '@/models/monster';
import { MultiLine } from '@/components/controls/multi-line/multi-line';
import { Options } from '@/models/options';
import { PanelMode } from '@/enums/panel-mode';
import { RulesPage } from '@/enums/rules-page';
import { Sourcebook } from '@/models/sourcebook';
import { StandardAbilitiesPage } from '@/components/pages/heroes/hero-sheet/standard-abilities-page';
import { SummoningInfo } from '@/models/summon';
import { Title } from '@/models/title';
import { ViewSelector } from '@/components/panels/view-selector/view-selector';
import { StorageMode, getCharacterRecord, getStorageMode } from '@/services/character-storage';
import { useIsSmall } from '@/hooks/use-is-small';
import { useNavigation } from '@/hooks/use-navigation';
import { useParams, useLocation, useNavigate } from 'react-router';
import { useTitle } from '@/hooks/use-title';
import * as api from '@/services/api';

import './hero-view-page.scss';

interface Props {
	heroes: Hero[];
	sourcebooks: Sourcebook[];
	options: Options;
	highlightAbout: boolean;
	showReference: (hero: Hero, page?: RulesPage) => void;
	showRoll: (hero: Hero) => void;
	showAbout: () => void;
	showSettings: () => void;
	exportHero: (hero: Hero, format: 'image' | 'json') => void;
	exportPdf: (hero: Hero, resolution: 'standard' | 'high') => void;
	exportStandardAbilities: () => void;
	copyHero: (hero: Hero) => void;
	deleteHero: (hero: Hero) => void;
	showAncestry: (ancestry: Ancestry) => void;
	showCulture: (culture: Culture) => void;
	showCareer: (career: Career) => void;
	showClass: (heroClass: HeroClass) => void;
	showComplication: (complication: Complication) => void;
	showDomain: (domain: Domain) => void;
	showKit: (kit: Kit) => void;
	showTitle: (title: Title) => void;
	showMonster: (monster: Monster, summon?: SummoningInfo) => void;
	showFollower: (follower: Follower) => void;
	showCharacteristic: (characteristic: Characteristic, hero: Hero) => void;
	showFeature: (feature: Feature, hero: Hero) => void;
	showAbility: (ability: Ability, hero: Hero) => void;
	showHeroState: (hero: Hero, page: HeroStatePage) => void;
	setNotes: (hero: Hero, value: string) => void;
}

export const HeroViewPage = (props: Props) => {
	const isSmall = useIsSmall();
	const navigation = useNavigation();
	const location = useLocation();
	const navigate = useNavigate();
	const { heroID } = useParams<{ heroID: string }>();
	const [ view, setView ] = useState<string>('modern');
	const [ showCampaignModal, setShowCampaignModal ] = useState<boolean>(false);
	const [ campaignInfo, setCampaignInfo ] = useState<{ id: number; name: string } | null>(null);
	const [ gmInfo, setGmInfo ] = useState<{ email: string | null; display_name: string | null } | null>(null);
	const [ ownerInfo, setOwnerInfo ] = useState<{ email: string | null; display_name: string | null } | null>(null);
	const [ isOnline, setIsOnline ] = useState<boolean>(false);
	const [ fetchedHero, setFetchedHero ] = useState<Hero | null>(null);
	const hero = useMemo(
		() => props.heroes.find(h => h.id === heroID) || fetchedHero,
		[ heroID, props.heroes, fetchedHero ]
	);
	useTitle(hero?.name || 'Unnamed Hero');

	useEffect(() => {
		// If hero not found in local heroes, try to fetch from API
		const fetchHeroFromAPI = async () => {
			console.log('[HERO VIEW DEBUG] useEffect triggered', { heroID, propsHeroesCount: props.heroes.length });

			if (!heroID) {
				console.log('[HERO VIEW DEBUG] No heroID, returning');
				return;
			}

			const foundInProps = props.heroes.find(h => h.id === heroID);
			if (foundInProps) {
				console.log('[HERO VIEW DEBUG] Hero found in props.heroes, returning');
				return;
			}

			console.log('[HERO VIEW DEBUG] Hero not in props.heroes, checking storage mode');

			const storageMode = getStorageMode();
			console.log('[HERO VIEW DEBUG] Storage mode:', storageMode);
			if (storageMode !== StorageMode.API) {
				console.log('[HERO VIEW DEBUG] Not in API mode, returning');
				return;
			}

			try {
				console.log('[HERO VIEW DEBUG] Calling getCharacterByHeroId for heroID:', heroID);
				const record = await api.getCharacterByHeroId(heroID);
				console.log('[HERO VIEW DEBUG] getCharacterByHeroId result:', record ? 'found' : 'null', record);
				if (record && record.hero) {
					console.log('[HERO VIEW DEBUG] Setting fetchedHero with hero:', record.hero.name || record.hero.id);
					setFetchedHero(record.hero);
				} else {
					console.log('[HERO VIEW DEBUG] No hero in record');
				}
			} catch (error) {
				console.error('[HERO VIEW] Failed to fetch hero from API:', error);
			}
		};

		fetchHeroFromAPI();
	}, [ heroID, props.heroes ]);

	useEffect(() => {
		if (!hero) return;

		const loadCharacterInfo = async () => {
			console.log('[INITIAL LOAD] Loading character info for hero:', hero.id);
			const storageMode = getStorageMode();
			setIsOnline(storageMode === StorageMode.API);

			if (storageMode === StorageMode.API) {
				try {
					console.log('[INITIAL LOAD] Calling getCharacterRecord (may use cache)...');
					const record = await getCharacterRecord(hero.id);
					console.log('[INITIAL LOAD] Got record:', record);
					console.log('[INITIAL LOAD] Campaign data:', {
						campaign_id: record?.campaign_id,
						campaign_name: record?.campaign_name
					});

					if (record) {
						// Set owner info
						setOwnerInfo({
							email: record.owner_email,
							display_name: record.owner_display_name
						});

						// Set campaign info
						if (record.campaign_id && record.campaign_name) {
							console.log('[INITIAL LOAD] Setting campaignInfo to:', record.campaign_name);
							setCampaignInfo({
								id: record.campaign_id,
								name: record.campaign_name
							});
						} else {
							console.log('[INITIAL LOAD] No campaign data, clearing campaignInfo');
							setCampaignInfo(null);
						}

						// Set GM info (legacy)
						if (record.gm_email) {
							setGmInfo({
								email: record.gm_email,
								display_name: record.gm_display_name
							});
						} else {
							setGmInfo(null);
						}
					}
				} catch (error) {
					console.error('[INITIAL LOAD] Failed to load character info:', error);
					setGmInfo(null);
					setOwnerInfo(null);
				}
			}
		};

		loadCharacterInfo();
	}, [ hero?.id ]);

	const handleCampaignAssignComplete = async () => {
		console.log('[CAMPAIGN ASSIGN] handleCampaignAssignComplete called for hero:', hero.id, hero.name);
		setShowCampaignModal(false);
		// Reload character info - use API call to get fresh data
		try {
			console.log('[CAMPAIGN ASSIGN] Calling getCharacterByHeroId...');
			const record = await api.getCharacterByHeroId(hero.id);
			console.log('[CAMPAIGN ASSIGN] Received record:', record);
			console.log('[CAMPAIGN ASSIGN] Campaign data in record:', {
				campaign_id: record?.campaign_id,
				campaign_name: record?.campaign_name
			});

			if (record) {
				setOwnerInfo({
					email: record.owner_email,
					display_name: record.owner_display_name
				});

				// Set campaign info
				if (record.campaign_id && record.campaign_name) {
					console.log('[CAMPAIGN ASSIGN] Setting campaignInfo to:', {
						id: record.campaign_id,
						name: record.campaign_name
					});
					setCampaignInfo({
						id: record.campaign_id,
						name: record.campaign_name
					});
				} else {
					console.log('[CAMPAIGN ASSIGN] Clearing campaignInfo (no campaign data)');
					setCampaignInfo(null);
				}

				// Set GM info (legacy)
				if (record.gm_email) {
					setGmInfo({
						email: record.gm_email,
						display_name: record.gm_display_name
					});
				} else {
					setGmInfo(null);
				}
			} else {
				console.log('[CAMPAIGN ASSIGN] No record returned from API');
			}
		} catch (error) {
			console.error('[CAMPAIGN ASSIGN] Failed to reload character info:', error);
		}
	};

	const getGMSelector = () => {
		if (!isOnline) {
			return null;
		}

		return (
			<div style={{
				padding: '10px 20px',
				background: 'rgba(0, 0, 0, 0.2)',
				borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: '20px'
			}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<span style={{ fontWeight: 500 }}>Campaign:</span>
					<Button
						size='small'
						type={campaignInfo ? 'default' : 'primary'}
						onClick={() => setShowCampaignModal(true)}
					>
						{campaignInfo ? campaignInfo.name : 'Assign to Campaign'}
					</Button>
				</div>
				{ownerInfo && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
						<span style={{ fontWeight: 500 }}>Owner:</span>
						<span>{ownerInfo.display_name || ownerInfo.email}</span>
					</div>
				)}
			</div>
		);
	};

	const getContent = () => {
		switch (view) {
			case 'modern':
				return (
					<>
						{getGMSelector()}
						<HeroPanel
							hero={hero}
							sourcebooks={props.sourcebooks}
							options={props.options}
							mode={PanelMode.Full}
							onSelectAncestry={props.showAncestry}
							onSelectCulture={props.showCulture}
							onSelectCareer={props.showCareer}
							onSelectClass={props.showClass}
							onSelectComplication={props.showComplication}
							onSelectDomain={props.showDomain}
							onSelectKit={props.showKit}
							onSelectTitle={props.showTitle}
							onSelectMonster={props.showMonster}
							onSelectFollower={props.showFollower}
							onSelectCharacteristic={characteristic => props.showCharacteristic(characteristic, hero)}
							onSelectFeature={feature => props.showFeature(feature, hero)}
							onSelectAbility={ability => props.showAbility(ability, hero)}
							onShowState={page => props.showHeroState(hero, page)}
							onshowReference={page => props.showReference(hero, page)}
						/>
					</>
				);
			case 'classic':
				return (
					<HeroSheetPage
						hero={hero}
						sourcebooks={props.sourcebooks}
						options={props.options}
					/>
				);
			case 'abilities':
				return (
					<StandardAbilitiesPage options={props.options} hero={hero} />
				);
			case 'notes':
				return (
					<MultiLine
						style={{ height: '100%', flex: '1 1 0' }}
						inputStyle={{ flex: '1 1 0', resize: 'none' }}
						value={hero.state.notes}
						showMarkdownPrompt={false}
						onChange={value => props.setNotes(hero, value)}
					/>
				);
		}
	};

	if (!hero) {
		return (
			<ErrorBoundary>
				<div className='hero-view-page'>
					<Empty description='Hero not found' />
				</div>
			</ErrorBoundary>
		);
	}

	const handleClose = () => {
		const state = location.state as { returnToCampaign?: string } | null;
		if (state?.returnToCampaign) {
			// Navigate back to campaign if we came from one (using React Router for proper base URL handling)
			navigate(`/campaigns/${state.returnToCampaign}`);
		} else {
			// Otherwise go to hero list
			navigation.goToHeroList(hero.folder);
		}
	};

	return (
		<ErrorBoundary>
			<div className='hero-view-page'>
				<AppHeader subheader='Hero'>
					<Button icon={<CloseOutlined />} onClick={handleClose}>
						Close
					</Button>
					<div className='divider' />
					<Button icon={<EditOutlined />} onClick={() => navigation.goToHeroEdit(heroID!, 'details')}>
						Edit
					</Button>
					<Button icon={<CopyOutlined />} onClick={() => props.copyHero(hero)}>
						Copy
					</Button>
					<Popover
						trigger='click'
						content={(
							<div style={{ width: '315px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
								{
									![ 'classic', 'abilities' ].includes(view) ?
										<Alert
											type='info'
											showIcon={true}
											message='If you want to export your hero as a PDF, switch to Classic view.'
											action={<Button onClick={() => setView('classic')}>Classic</Button>}
										/>
										: null
								}
								{
									view === 'classic' ?
										<>
											<Button onClick={() => props.exportPdf(hero, 'standard')}>Export as PDF</Button>
											<Button onClick={() => props.exportPdf(hero, 'high')}>Export as PDF (high res)</Button>
										</>
										: null
								}
								{
									view === 'abilities' ?
										<Button onClick={props.exportStandardAbilities}>Export as PDF</Button>
										: null
								}
								<Divider />
								<Button onClick={() => props.exportHero(hero, 'json')}>Export as Data</Button>
							</div>
						)}
					>
						<Button icon={<UploadOutlined />}>
							Export
							<DownOutlined />
						</Button>
					</Popover>
					<DangerButton
						mode='block'
						onConfirm={() => props.deleteHero(hero)}
					/>
					<div className='divider' />
					<Button
						icon={<ToolOutlined />}
						onClick={() => props.showHeroState ? props.showHeroState(hero, HeroStatePage.Hero) : null}
					>
						Manage
					</Button>
					<div className='divider' />
					<ViewSelector value={view} showHeroOptions={true} onChange={setView} />
				</AppHeader>
				<ErrorBoundary>
					<div className={isSmall ? 'hero-view-page-content compact' : 'hero-view-page-content'}>
						{getContent()}
					</div>
				</ErrorBoundary>
				<AppFooter
					page='heroes'
					highlightAbout={props.highlightAbout}
					showReference={() => props.showReference(hero)}
					showRoll={() => props.showRoll(hero)}
					showAbout={props.showAbout}
					showSettings={props.showSettings}
				/>
			</div>
			{showCampaignModal && (
				<AssignCampaignModal
					hero={hero}
					currentCampaign={campaignInfo}
					onAssignComplete={handleCampaignAssignComplete}
					onClose={() => setShowCampaignModal(false)}
				/>
			)}
		</ErrorBoundary>
	);
};
