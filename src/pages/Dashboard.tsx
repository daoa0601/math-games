import { useTranslation } from 'react-i18next';
import { GameCard } from '../shared/components';
import { LanguageSwitcher } from '../shared/components';

type GameId = 'magicGraph' | 'sequenceRace' | 'shapeArchitect';

const gameConfigs: Array<{ id: GameId; icon: string; to: string }> = [
    { id: 'magicGraph', icon: '🔮', to: '/magic-graph' },
    { id: 'sequenceRace', icon: '🏃', to: '/sequence-race' },
    { id: 'shapeArchitect', icon: '🧱', to: '/shape-architect' },
];

export function Dashboard() {
    const { t } = useTranslation();

    const games = gameConfigs.map((config) => ({
        id: config.id,
        title: t(`games.${config.id}.title`),
        description: t(`games.${config.id}.description`),
        icon: config.icon,
        tags: t(`games.${config.id}.tags`, { returnObjects: true }) as string[],
        to: config.to,
        disabled: false,
    }));

    return (
        <div className="dashboard">
            <header className="dashboard__header">
                <div className="dashboard__header-top">
                    <LanguageSwitcher />
                </div>
                <h1 className="dashboard__title">{t('appTitle')}</h1>
                <p className="dashboard__subtitle">{t('appSubtitle')}</p>
            </header>
            <div className="game-grid">
                {games.map((game) => (
                    <GameCard key={game.id} {...game} />
                ))}
            </div>
        </div>
    );
}
