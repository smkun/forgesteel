import { Button, Card, Empty, Spin, Tag, Space, Popconfirm } from 'antd';
import { CloudSyncOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { CampaignEncounterResponse } from '@/services/api';
import { Sourcebook } from '@/models/sourcebook';
import { EncounterLogic } from '@/logic/encounter-logic';
import './EncounterList.scss';

interface EncounterListProps {
	encounters: CampaignEncounterResponse[];
	sourcebooks: Sourcebook[];
	loading?: boolean;
	isGM?: boolean;
	onRemove?: (encounterId: number) => void;
	onRunInSession?: (encounter: CampaignEncounterResponse) => void;
	onSyncEncounter?: () => void;
}

/**
 * EncounterList Component
 *
 * Displays campaign encounters in a grid layout with action buttons.
 * GMs can sync new encounters, run them in session, or remove them.
 *
 * Features:
 * - Grid display of encounter cards
 * - Monster/creature count badges
 * - Creator attribution
 * - Date information
 * - GM actions: Run in Session, Remove
 */
export const EncounterList = ({
	encounters,
	sourcebooks,
	loading = false,
	isGM = false,
	onRemove,
	onRunInSession,
	onSyncEncounter
}: EncounterListProps) => {
	if (loading) {
		return (
			<div className="encounter-list-loading">
				<Spin size="large" tip="Loading encounters..." />
			</div>
		);
	}

	if (!encounters || encounters.length === 0) {
		return (
			<div className="encounter-list-empty">
				<Empty
					description="No encounters synced to this campaign"
					image={Empty.PRESENTED_IMAGE_SIMPLE}
				>
					{isGM && onSyncEncounter && (
						<Button type="primary" icon={<CloudSyncOutlined />} onClick={onSyncEncounter}>
							Add Encounter
						</Button>
					)}
				</Empty>
			</div>
		);
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getMonsterCount = (encounter: CampaignEncounterResponse): number => {
		if (!encounter.encounter) return 0;
		// Use the same logic as the Library - EncounterLogic.getMonsterCount
		return EncounterLogic.getMonsterCount(encounter.encounter, sourcebooks);
	};

	return (
		<div className="encounter-list">
			{isGM && onSyncEncounter && (
				<div className="encounter-list-header">
					<Button type="primary" icon={<CloudSyncOutlined />} onClick={onSyncEncounter}>
						Add Encounter
					</Button>
				</div>
			)}
			<div className="encounter-grid">
				{encounters.map(encounter => (
					<Card
						key={encounter.id}
						className="encounter-card"
						title={
							<div className="encounter-card-title">
								<span className="encounter-name">{encounter.name || 'Unnamed Encounter'}</span>
								<Tag color="blue">{getMonsterCount(encounter)} Monsters</Tag>
							</div>
						}
						extra={
							<Space>
								{onRunInSession && (
									<Button
										type="primary"
										size="small"
										icon={<PlayCircleOutlined />}
										onClick={() => onRunInSession(encounter)}
									>
										Run
									</Button>
								)}
								{isGM && onRemove && (
									<Popconfirm
										title="Remove encounter?"
										description="This will remove the encounter from this campaign. The original encounter in your Library will not be affected."
										onConfirm={() => onRemove(encounter.id)}
										okText="Remove"
										cancelText="Cancel"
									>
										<Button
											danger
											size="small"
											icon={<DeleteOutlined />}
										/>
									</Popconfirm>
								)}
							</Space>
						}
					>
						<div className="encounter-card-body">
							<div className="encounter-meta">
								<span className="encounter-creator">
									Created by: {encounter.creator_display_name || encounter.creator_email || 'Unknown'}
								</span>
								<span className="encounter-date">
									Updated: {formatDate(encounter.updated_at)}
								</span>
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
};
