import { AbilityDistanceType } from '@/enums/abiity-distance-type';
import { AbilityKeyword } from '@/enums/ability-keyword';
import { Ancestry } from '@/models/ancestry';
import { Characteristic } from '@/enums/characteristic';
import { FactoryLogic } from '@/logic/factory-logic';
import { FeatureField } from '@/enums/feature-field';

export const zefiri: Ancestry = {
	id: 'ancestry-zefiri',
	name: 'Zefiri',
	description:
		'Laughing slipstreams and rigging-dancers; masters of tight turns and sudden gusts. Small, agile Plumari who excel at infiltration and acrobatics.',
	features: [
		// Shared signature + Small size
		FactoryLogic.feature.createMultiple({
			id: 'zefiri-signature',
			name: 'Plumari Heritage',
			features: [
				FactoryLogic.feature.create({
					id: 'zefiri-signature-1',
					name: 'Sky-Sight (High Senses)',
					description:
						'Ignore penalties from dim light. Gain edge on tests to spot distant or fast-moving targets outdoors.'
				}),
				FactoryLogic.feature.createSize({
					id: 'zefiri-signature-2',
					name: 'Small Stature',
					description:
						'Your diminutive stature lets you easily get out of trouble and move through larger creatures\' spaces. You may move through the spaces of creatures larger than you (you can\'t end your movement in an occupied space).',
					sizeValue: 1,
					sizeMod: 'S'
				})
			]
		}),

		// Purchasable options
		FactoryLogic.feature.createChoice({
			id: 'zefiri-options',
			name: 'Zefiri Options',
			options: [
				// Shared 1-point options
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-1',
						name: 'Thermal Reader (Weather-Wise)',
						description:
							'Gain edge on tests to predict weather, locate updrafts, and gauge storm distance; you always know wind direction.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-2',
						name: 'Stooping Dash',
						description:
							'Gain +1 speed. If you move 4+ squares toward a target this turn, your next strike gains +2 damage (1/round).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'zefiri-option-3',
						name: 'Tight Turn',
						description: 'Your nimble movement enhances your ability to escape.',
						field: FeatureField.Disengage,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-4',
						name: 'Air Brakes',
						description:
							'When you would be pushed or slid, reduce that forced movement by 1 (minimum 0).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-5',
						name: 'Thermal Glide (Glide)',
						description:
							'During your movement, you may move through the air up to your speed, but must end on a surface; you can\'t glide in medium+ armor or while grabbed/restrained.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'zefiri-option-6',
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

				// Zefiri-specific 1-point options
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-7',
						name: 'Micro-Thermals (Swift)',
						description:
							'Gain +1 speed; ignore difficult terrain from foliage, ropes, rigging, and narrow ledges.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-8',
						name: 'Slipstream (Follow-Through)',
						description:
							'After you shift, you may shift 1 more (1/round).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-9',
						name: 'Needle Bones',
						description:
							'Gain edge on tests to escape grabbed or restrained.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-10',
						name: 'Gossamer Step (Soft-Step)',
						description:
							'Make no audible footfalls while moving 3 or fewer squares.'
					}),
					value: 1
				},

				// Shared 2-point options
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'zefiri-option-11',
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
							id: 'zefiri-option-12',
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
							id: 'zefiri-option-13',
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
							id: 'zefiri-option-14',
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

				// Zefiri-specific 2-point options
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'zefiri-option-15',
							name: 'Razor Draft',
							description: 'You create a slashing gust of wind.',
							type: FactoryLogic.type.createMain(),
							keywords: [ AbilityKeyword.Area ],
							distance: [ FactoryLogic.distance.create({ type: AbilityDistanceType.Burst, value: 3 }) ],
							target: 'Each creature in the burst',
							cost: 'signature',
							sections: [
								FactoryLogic.createAbilitySectionRoll(
									FactoryLogic.createPowerRoll({
										characteristic: [ Characteristic.Agility ],
										tier1: '2 damage',
										tier2: '5 damage; slide 1',
										tier3: '7 damage; slide 2'
									})
								),
								FactoryLogic.createAbilitySectionText('If you moved 4+ squares this turn, add +2 damage to the result.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'zefiri-option-16',
						name: 'Feather Fall (Catfall)',
						description:
							'When you fall, you land safely and shift 2.'
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'zefiri-option-17',
							name: 'Whip-Turn',
							description: 'You dart past enemies with supernatural agility.',
							type: FactoryLogic.type.createManeuver(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('Move up to your speed; choose one enemy you moved adjacent to during this movement—its opportunity attacks against you miss until end of turn.')
							]
						})
					}),
					value: 2
				}
			],
			count: 'ancestry'
		})
	],
	ancestryPoints: 4
};

export default zefiri;
