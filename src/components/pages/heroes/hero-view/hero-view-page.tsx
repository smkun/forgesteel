import { Alert, Button, Divider, Empty, Popover } from 'antd';
import { CloseOutlined, CopyOutlined, DownOutlined, EditOutlined, TeamOutlined, ToolOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { Ability } from '@/models/ability';
import { Ancestry } from '@/models/ancestry';
import { AppFooter } from '@/components/panels/app-footer/app-footer';
import { AppHeader } from '@/components/panels/app-header/app-header';
import { AssignGMModal } from '@/components/modals/assign-gm/assign-gm-modal';
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
import { getCharacterRecord, getStorageMode, StorageMode } from '@/services/character-storage';
import { useIsSmall } from '@/hooks/use-is-small';
import { useNavigation } from '@/hooks/use-navigation';
import { useParams } from 'react-router';
import { useTitle } from '@/hooks/use-title';

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
	const { heroID } = useParams<{ heroID: string }>();
	const [ view, setView ] = useState<string>('modern');
	const [ showGMModal, setShowGMModal ] = useState<boolean>(false);
	const [ gmInfo, setGmInfo ] = useState<{ email: string | null; display_name: string | null } | null>(null);
	const [ ownerInfo, setOwnerInfo ] = useState<{ email: string | null; display_name: string | null } | null>(null);
	const [ isOnline, setIsOnline ] = useState<boolean>(false);
	const hero = useMemo(
		() => props.heroes.find(h => h.id === heroID),
		[ heroID, props.heroes ]
	);
	useTitle(hero?.name || 'Unnamed Hero');

	useEffect(() => {
		if (!hero) return;

		const loadCharacterInfo = async () => {
			const storageMode = getStorageMode();
			setIsOnline(storageMode === StorageMode.API);

			if (storageMode === StorageMode.API) {
				try {
					const record = await getCharacterRecord(hero.id);
					if (record) {
						// Set owner info
						setOwnerInfo({
							email: record.owner_email,
							display_name: record.owner_display_name
						});

						// Set GM info
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
					console.error('[GM] Failed to load character info:', error);
					setGmInfo(null);
					setOwnerInfo(null);
				}
			}
		};

		loadCharacterInfo();
	}, [ hero?.id ]);

	const handleGMAssignComplete = async () => {
		setShowGMModal(false);
		// Reload character info
		try {
			const record = await getCharacterRecord(hero.id);
			if (record) {
				setOwnerInfo({
					email: record.owner_email,
					display_name: record.owner_display_name
				});

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
			console.error('[GM] Failed to reload character info:', error);
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
			}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<span style={{ fontWeight: 500 }}>GM:</span>
					<Button
						size="small"
						type={gmInfo ? 'default' : 'primary'}
						onClick={() => setShowGMModal(true)}
					>
						{gmInfo ? `${gmInfo.display_name || gmInfo.email}` : 'Assign GM'}
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

	return (
		<ErrorBoundary>
			<div className='hero-view-page'>
				<AppHeader subheader='Hero'>
					<Button icon={<CloseOutlined />} onClick={() => navigation.goToHeroList(hero.folder)}>
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
			{showGMModal && (
				<AssignGMModal
					hero={hero}
					currentGM={gmInfo}
					onAssignComplete={handleGMAssignComplete}
					onClose={() => setShowGMModal(false)}
				/>
			)}
		</ErrorBoundary>
	);
};
