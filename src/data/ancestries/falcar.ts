import { Ancestry } from '@/models/ancestry';
import { FactoryLogic } from '@/logic/factory-logic';
import { FeatureField } from '@/enums/feature-field';

export const falcar: Ancestry = {
	id: 'ancestry-falcar',
	name: 'Falcar',
	description:
		'Courier-knights and horizon hunters—vector-perfect stoopers who rule the mid-sky. Swift Plumari built for pursuit and precision.',
	features: [
		// Shared signature + Medium size
		FactoryLogic.feature.createMultiple({
			id: 'falcar-signature',
			name: 'Plumari Heritage',
			features: [
				FactoryLogic.feature.create({
					id: 'falcar-signature-1',
					name: 'Sky-Sight (High Senses)',
					description:
						'Ignore penalties from dim light. Gain edge on tests to spot distant or fast-moving targets outdoors.'
				}),
				FactoryLogic.feature.create({
					id: 'falcar-signature-2',
					name: 'Medium Frame',
					description: 'Your size is 1M.'
				})
			]
		}),

		// Purchasable options
		FactoryLogic.feature.createChoice({
			id: 'falcar-options',
			name: 'Falcar Options',
			options: [
				// Shared 1-point options
				{
					feature: FactoryLogic.feature.create({
						id: 'falcar-option-1',
						name: 'Thermal Reader (Weather-Wise)',
						description:
							'Gain edge on tests to predict weather, locate updrafts, and gauge storm distance; you always know wind direction.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'falcar-option-2',
						name: 'Stooping Dash',
						description:
							'Gain +1 speed. If you move 4+ squares toward a target this turn, your next strike gains +2 damage (1/round).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'falcar-option-3',
						name: 'Tight Turn',
						description: 'Your nimble movement enhances your ability to escape.',
						field: FeatureField.Disengage,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'falcar-option-4',
						name: 'Air Brakes',
						description:
							'When you would be pushed or slid, reduce that forced movement by 1 (minimum 0).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'falcar-option-5',
						name: 'Thermal Glide (Glide)',
						description:
							'During your movement, you may move through the air up to your speed, but must end on a surface; you can\'t glide in medium+ armor or while grabbed/restrained.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'falcar-option-6',
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

				// Falcar-specific 1-point options
				{
					feature: FactoryLogic.feature.create({
						id: 'falcar-option-7',
						name: 'Kite Turn',
						description:
							'If you fly at least 3 squares, you may shift 1 at the end of that movement.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'falcar-option-8',
						name: 'Predator\'s Focus',
						description:
							'The first time each fight you target an enemy that began your turn 6+ squares away, your attack gains +2 damage.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'falcar-option-9',
						name: 'Haze-Cutter',
						description:
							'Ignore light rain, sea spray, and smoke haze as obscurement; gain edge on navigation checks in poor weather.'
					}),
					value: 1
				},

				// Shared 2-point options
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'falcar-option-10',
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
							id: 'falcar-option-11',
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
							id: 'falcar-option-12',
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
							id: 'falcar-option-13',
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

				// Falcar-specific 2-point options
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'falcar-option-14',
							name: 'Stooping Strike',
							description: 'You dive from above to strike with devastating force.',
							type: FactoryLogic.type.createManeuver(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('Move up to 2 in a straight line downward (any amount). Your next strike this turn gains +5 damage; on tier 2+ push 1 (tier 3: push 2).')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'falcar-option-15',
							name: 'Scout\'s Mark',
							description: 'You mark a target for your allies to focus on.',
							type: FactoryLogic.type.createMain(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'One creature you can see within 8 squares',
							sections: [
								FactoryLogic.createAbilitySectionText('Choose a creature you can see within 8 squares. Until the end of your next turn, allies gain edge on their first strike against that creature.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'falcar-option-16',
							name: 'Never Grounded',
							description: 'You refuse to be knocked down.',
							type: FactoryLogic.type.createTrigger('You would be knocked prone'),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('You instead remain standing (or aloft) and shift 1.')
							]
						})
					}),
					value: 2
				}
			],
			count: 'ancestry'
		})
	],
	ancestryPoints: 3
};

export default falcar;
