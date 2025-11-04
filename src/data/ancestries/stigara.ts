import { AbilityDistanceType } from '@/enums/abiity-distance-type';
import { AbilityKeyword } from '@/enums/ability-keyword';
import { Ancestry } from '@/models/ancestry';
import { Characteristic } from '@/enums/characteristic';
import { FactoryLogic } from '@/logic/factory-logic';
import { FeatureField } from '@/enums/feature-field';

export const strigara: Ancestry = {
	id: 'ancestry-strigara',
	name: 'Strigara',
	description:
		'Broad-winged high fliers, keepers of sky-ossuaries and storm-ledgers. Durable and imposing Plumari who ride the bone-cold rivers of air.',
	features: [
		// Shared signature + Large size
		FactoryLogic.feature.createMultiple({
			id: 'strigara-signature',
			name: 'Plumari Heritage',
			features: [
				FactoryLogic.feature.create({
					id: 'strigara-signature-1',
					name: 'Sky-Sight (High Senses)',
					description:
						'Ignore penalties from dim light. Gain edge on tests to spot distant or fast-moving targets outdoors.'
				}),
				FactoryLogic.feature.create({
					id: 'strigara-signature-2',
					name: 'Large',
					description: 'Your size is 1L (large).'
				})
			]
		}),

		// Purchasable options
		FactoryLogic.feature.createChoice({
			id: 'strigara-options',
			name: 'Strigara Options',
			options: [
				// Shared 1-point options
				{
					feature: FactoryLogic.feature.create({
						id: 'strigara-option-1',
						name: 'Thermal Reader (Weather-Wise)',
						description:
							'Gain edge on tests to predict weather, locate updrafts, and gauge storm distance; you always know wind direction.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'strigara-option-2',
						name: 'Stooping Dash',
						description:
							'Gain +1 speed. If you move 4+ squares toward a target this turn, your next strike gains +2 damage (1/round).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'strigara-option-3',
						name: 'Tight Turn',
						description: 'Your nimble movement enhances your ability to escape.',
						field: FeatureField.Disengage,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'strigara-option-4',
						name: 'Air Brakes',
						description:
							'When you would be pushed or slid, reduce that forced movement by 1 (minimum 0).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'strigara-option-5',
						name: 'Thermal Glide (Glide)',
						description:
							'During your movement, you may move through the air up to your speed, but must end on a surface; you can\'t glide in medium+ armor or while grabbed/restrained.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'strigara-option-6',
							name: 'Keen Cry',
							description: 'Emit a piercing call to aid your allies.',
							type: FactoryLogic.type.createManeuver(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'One ally you can see',
							sections: [
								FactoryLogic.createAbilitySectionText('One ally you can see gains +1 disengage and +1 speed until the start of your next turn.')
							]
						})
					}),
					value: 1
				},

				// Strigara-specific 1-point options
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'strigara-option-7',
						name: 'Carrion-Bred Stamina',
						description: 'Your hardy constitution grants you enhanced resilience.',
						field: FeatureField.Stamina,
						valuePerEchelon: 3
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'strigara-option-8',
						name: 'Storm Shoulders',
						description:
							'If you descend 2+ squares this turn, your next strike gains +2 damage.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'strigara-option-9',
						name: 'Thermal Lofting',
						description:
							'Gain +1 speed; ignore difficult terrain caused by wind, sand, scree, and thin air effects.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'strigara-option-10',
							name: 'Sky-Ward',
							description: 'You protect your allies with fierce dedication.',
							type: FactoryLogic.type.createTrigger('You or an adjacent ally takes damage from a strike'),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'The triggering creature',
							sections: [
								FactoryLogic.createAbilitySectionText('You reduce the damage from the strike by an amount equal to your level.')
							]
						})
					}),
					value: 1
				},

				// Shared 2-point options
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'strigara-option-11',
							name: 'Wings',
							description: 'You can fly with your powerful wings.',
							type: FactoryLogic.type.createMain(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('Fly for rounds equal to your Might (minimum 1) before you fall; at levels 1–3, you have damage weakness 5 while flying.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'strigara-option-12',
							name: 'Gale Feint',
							description: 'You use the wind to enhance your strike.',
							type: FactoryLogic.type.createManeuver(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('Move up to your speed. Your next strike this turn gains +5 damage; on a tier 2+ result, push 1 (tier 3: push 2).')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'strigara-option-13',
							name: 'Crosswind Roll',
							description: 'You twist away from incoming attacks.',
							type: FactoryLogic.type.createTrigger('You are targeted by a ranged strike you can see'),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('Halve the damage after the roll (1/round).')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'strigara-option-14',
							name: 'Defy the Downdraft',
							description: 'You help an ally break free from restraints.',
							type: FactoryLogic.type.createMain(),
							distance: [ FactoryLogic.distance.createMelee() ],
							target: 'You or an adjacent ally',
							sections: [
								FactoryLogic.createAbilitySectionText('You or an adjacent ally immediately end one of the following: slowed, prone, grabbed, or restrained.')
							]
						})
					}),
					value: 2
				},

				// Strigara-specific 2-point options
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'strigara-option-15',
							name: 'Downblast',
							description: 'You create a powerful blast of wind with your wings.',
							type: FactoryLogic.type.createMain(),
							keywords: [ AbilityKeyword.Area ],
							distance: [ FactoryLogic.distance.create({ type: AbilityDistanceType.Burst, value: 1 }) ],
							target: 'Each enemy in the area',
							cost: 'signature',
							sections: [
								FactoryLogic.createAbilitySectionRoll(
									FactoryLogic.createPowerRoll({
										characteristic: [ Characteristic.Might, Characteristic.Presence ],
										tier1: '2 damage',
										tier2: '5 damage; push 1',
										tier3: '7 damage; push 2'
									})
								),
								FactoryLogic.createAbilitySectionText('Targets that are prone suffer a bane on this defense.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'strigara-option-16',
							name: 'Crushing Talons',
							description: 'You drive your talons into your foe with overwhelming force.',
							type: FactoryLogic.type.createMain(),
							keywords: [ AbilityKeyword.Weapon ],
							distance: [ FactoryLogic.distance.createMelee() ],
							target: 'One creature',
							cost: 'signature',
							sections: [
								FactoryLogic.createAbilitySectionRoll(
									FactoryLogic.createPowerRoll({
										characteristic: [ Characteristic.Might ],
										tier1: '+2 damage',
										tier2: '+4 damage; knock prone',
										tier3: '+6 damage; knock prone, and the target cannot stand until end of its next turn unless it succeeds a save'
									})
								)
							]
						})
					}),
					value: 2
				}
			],
			count: 'ancestry'
		})
	],
	ancestryPoints: 2
};

export default strigara;
