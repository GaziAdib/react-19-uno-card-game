import { useState, useMemo } from "react";
import { Zap, RotateCcw, Swords, Trophy } from 'lucide-react';

// --- Card Component - Memoized ---
const Card = ({ cardId, number, hidden, type, onClick, selected, disabled }) => {
    const baseStyle = `
        w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 
        rounded-xl sm:rounded-2xl border-2 border-white/50 
        shadow-2xl text-white font-extrabold text-xl sm:text-2xl 
        flex items-center justify-center 
        transition-all duration-300 transform-gpu 
        cursor-pointer 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `;

    let cardFaceStyle = '';
    if (hidden) {
        cardFaceStyle = type === "bot"
            ? 'bg-red-800/70 rotate-y-6 shadow-red-900/50'
            : 'bg-indigo-800/70 shadow-indigo-900/50';
    } else {
        cardFaceStyle = type === "bot"
            ? 'bg-gradient-to-br from-red-600/90 to-pink-500/90 hover:scale-105'
            : 'bg-gradient-to-br from-blue-500/90 to-purple-600/90 hover:scale-105';
    }

    const selectionEffect = selected
        ? 'ring-4 ring-yellow-400 scale-110 -translate-y-4 z-10'
        : 'hover:rotate-1 hover:scale-[1.03] active:scale-95';

    const cardContent = hidden ? (
        <span className="text-3xl sm:text-4xl text-white/80 opacity-90">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
        </span>
    ) : (
        <div className="flex flex-col items-center justify-center">
            <span className="text-sm opacity-80">Value</span>
            <span className="text-4xl sm:text-5xl">{number}</span>
        </div>
    );

    return (
        <div
            className={`${baseStyle} ${cardFaceStyle} ${selected ? selectionEffect : ''}`}
            onClick={!disabled && onClick ? onClick : undefined}
            style={{ perspective: '1000px', transform: selected ? 'rotateY(0deg) scale(1.1) translateY(-1rem)' : 'rotateY(0deg) scale(1)' }}
        >
            <div className="w-full h-full p-2 backdrop-blur-sm rounded-xl">
                {cardContent}
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    // Create initial deck once - use useMemo to ensure it's stable
    const initialDeck = useMemo(() => 
        Array.from({ length: 2 }, (_, i) =>
            Array.from({ length: 10 }, (_, j) => ({ 
                id: `card-${i}-${j}`, 
                value: j + 1 
            }))
        ).flat()
    , []);

    const [gameState, setGameState] = useState(() => {
        // Shuffle initial deck
        const shuffled = [...initialDeck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return {
            deck: shuffled,
            selectedCards: [],
            playerWinPile: [],
            botWinPile: [],
            roundLog: [],
            roundResult: "",
            gameOver: false,
            isRoundInPlay: false,
            lastRoundSelection: { player: [], bot: [] },
            playerScore: 0,
            botScore: 0
        };
    });

    const handleSelect = (cardId) => {
        if (gameState.isRoundInPlay || gameState.gameOver) return;

        setGameState(prev => {
            const card = prev.deck.find(c => c.id === cardId);
            if (!card) return prev;

            const isSelected = prev.selectedCards.find(c => c.id === cardId);

            if (isSelected) {
                // Deselect card - return to deck
                return {
                    ...prev,
                    selectedCards: prev.selectedCards.filter(c => c.id !== cardId),
                    deck: [...prev.deck, card]
                };
            } else if (prev.selectedCards.length < 2) {
                // Select card - remove from deck
                return {
                    ...prev,
                    selectedCards: [...prev.selectedCards, card],
                    deck: prev.deck.filter(c => c.id !== cardId)
                };
            }
            
            return prev;
        });
    };

    const playRound = () => {
        if (gameState.selectedCards.length !== 2 || gameState.isRoundInPlay || gameState.gameOver) return;
        if (gameState.deck.length < 2) {
            setGameState(prev => ({
                ...prev,
                roundResult: "Cannot play, not enough cards left for the bot's draw!",
                gameOver: true
            }));
            return;
        }

        setGameState(prev => ({
            ...prev,
            isRoundInPlay: true,
            roundResult: "... Battle in Progress ..."
        }));

        setTimeout(() => {
            setGameState(prev => {
                // Bot picks 2 cards
                const tempDeck = [...prev.deck];
                const botSelection = [];
                for (let i = 0; i < 2; i++) {
                    const idx = Math.floor(Math.random() * tempDeck.length);
                    botSelection.push(tempDeck[idx]);
                    tempDeck.splice(idx, 1);
                }

                const playerSum = prev.selectedCards.reduce((a, b) => a + b.value, 0);
                const botSum = botSelection.reduce((a, b) => a + b.value, 0);

                let result = "";
                let newPlayerWinPile = [...prev.playerWinPile];
                let newBotWinPile = [...prev.botWinPile];
                let newPlayerScore = prev.playerScore;
                let newBotScore = prev.botScore;
                const wonCards = [...prev.selectedCards, ...botSelection];

                if (playerSum > botSum) {
                    result = `Player 1 wins: ${playerSum} vs ${botSum} (Diff: ${playerSum - botSum})`;
                    newPlayerWinPile.push(...wonCards);
                    newPlayerScore++;
                } else if (botSum > playerSum) {
                    result = `Bot wins: ${botSum} vs ${playerSum} (Diff: ${botSum - playerSum})`;
                    newBotWinPile.push(...wonCards);
                    newBotScore++;
                } else {
                    result = `It's a tie: ${playerSum} vs ${botSum}`;
                    newPlayerWinPile.push(...prev.selectedCards);
                    newBotWinPile.push(...botSelection);
                }

                const newRoundLog = [`Round ${prev.roundLog.length + 1}: ${result}`, ...prev.roundLog];

                // Check if game is over
                const isGameOver = tempDeck.length < 2;

                return {
                    ...prev,
                    deck: tempDeck,
                    selectedCards: [],
                    playerWinPile: newPlayerWinPile,
                    botWinPile: newBotWinPile,
                    roundLog: newRoundLog,
                    roundResult: result,
                    lastRoundSelection: { 
                        player: prev.selectedCards, 
                        bot: botSelection 
                    },
                    playerScore: newPlayerScore,
                    botScore: newBotScore,
                    isRoundInPlay: false,
                    gameOver: isGameOver
                };
            });
        }, 1200);
    };

    const resetGame = () => {
        const shuffled = [...initialDeck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        setGameState({
            deck: shuffled,
            selectedCards: [],
            playerWinPile: [],
            botWinPile: [],
            roundLog: [],
            roundResult: "",
            gameOver: false,
            isRoundInPlay: false,
            lastRoundSelection: { player: [], bot: [] },
            playerScore: 0,
            botScore: 0
        });
    };

    const currentSelectionSum = gameState.selectedCards.reduce((sum, c) => sum + c.value, 0);

    return (
        <div className="min-h-screen w-full bg-gray-900 font-sans p-4 sm:p-8 flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-gray-200 mb-2 mt-4 text-center tracking-tight">
                🔥 SUMMON UNO
            </h1>
            <p className="text-sm text-gray-400 mb-6 text-center">Select 2 cards, higher sum wins the pot!</p>

            {/* Scoreboard */}
            <div className="w-full max-w-4xl grid grid-cols-3 gap-4 mb-8 text-white">
                <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
                    <h3 className="text-sm sm:text-base font-semibold text-blue-300">Player 1</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{gameState.playerWinPile.length}</p>
                    <p className="text-xs text-gray-500">Cards Won</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
                    <h3 className="text-sm sm:text-base font-semibold text-yellow-300">Rounds Won</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{gameState.playerScore} - {gameState.botScore}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
                    <h3 className="text-sm sm:text-base font-semibold text-red-300">Bot</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{gameState.botWinPile.length}</p>
                    <p className="text-xs text-gray-500">Cards Won</p>
                </div>
            </div>

            {/* Battle Arena */}
            <div className="w-full max-w-4xl mb-8 bg-gray-800/50 p-4 rounded-2xl border border-gray-700 shadow-inner">
                <h2 className="text-xl font-bold text-center mb-4 text-gray-200 flex items-center justify-center gap-2">
                    <Swords className="w-5 h-5 text-red-400" />
                    BATTLE ARENA
                </h2>

                <div className="flex flex-col lg:flex-row justify-between items-center gap-6 w-full">
                    <div className="flex flex-col items-center flex-1 min-h-[180px]">
                        <p className="text-red-300 font-semibold mb-2">Bot's Play</p>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 items-center min-h-[140px]">
                            {gameState.lastRoundSelection.bot.length > 0 ? (
                                gameState.lastRoundSelection.bot.map((card) => (
                                    <Card key={`bot-${card.id}`} cardId={card.id} number={card.value} type="bot" disabled />
                                ))
                            ) : (
                                <p className="text-gray-500 italic">Bot's Cards Here</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center text-center sm:mx-4 w-full sm:w-auto">
                        <div className={`text-base sm:text-lg font-bold p-2 px-4 rounded-full transition-all duration-300
                            ${gameState.roundResult.includes('Player 1 wins') 
                                ? 'bg-green-600 text-white shadow-lg' 
                                : gameState.roundResult.includes('Bot wins') 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : gameState.roundResult.includes('tie') 
                                ? 'bg-yellow-600 text-gray-900 shadow-lg'
                                : 'bg-gray-700/50 text-gray-300'}
                        `}>
                            {gameState.roundResult || 'Waiting for Cards...'}
                        </div>
                    </div>

                    <div className="flex flex-col items-center flex-1 min-h-[180px]">
                        <p className="text-blue-300 font-semibold mb-2">Your Play</p>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 items-center min-h-[140px]">
                            {gameState.lastRoundSelection.player.length > 0 ? (
                                gameState.lastRoundSelection.player.map((card) => (
                                    <Card key={`player-${card.id}`} cardId={card.id} number={card.value} type="player" disabled />
                                ))
                            ) : (
                                <p className="text-gray-500 italic">Your Cards Here</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Selection & Play Button */}
            <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center mb-8 p-4 bg-gray-700/50 rounded-xl border border-gray-600 shadow-xl">
                <div className="flex flex-col items-center mb-4 sm:mb-0 min-h-[160px]">
                    <p className="text-lg font-bold text-yellow-300 mb-1">Your Selection ({gameState.selectedCards.length}/2)</p>
                    <div className="flex gap-2 items-center min-h-[120px]">
                        {gameState.selectedCards.length > 0 ? (
                            gameState.selectedCards.map(c => (
                                <Card key={`sel-${c.id}`} cardId={c.id} number={c.value} type="player" selected disabled={gameState.isRoundInPlay} />
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-sm">Click cards below to select</p>
                        )}
                    </div>
                    {gameState.selectedCards.length > 0 && (
                        <p className="text-sm text-gray-300 mt-2">Total Sum: <span className="text-xl font-bold text-yellow-300">{currentSelectionSum}</span></p>
                    )}
                </div>

                <button
                    onClick={playRound}
                    disabled={gameState.selectedCards.length !== 2 || gameState.isRoundInPlay || gameState.gameOver}
                    className={`px-8 py-3 rounded-full font-extrabold text-lg transition-all duration-200 shadow-2xl
                        ${gameState.selectedCards.length === 2 && !gameState.isRoundInPlay && !gameState.gameOver
                            ? 'bg-green-500 hover:bg-green-400 text-white transform hover:scale-105 active:scale-95'
                            : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        }
                    `}
                >
                    {gameState.isRoundInPlay ? 'BATTLE INITIATED...' : 'SUBMIT CARDS & BATTLE'}
                </button>
            </div>

            {/* Player Hand */}
            {!gameState.gameOver && (
                <div className="w-full max-w-4xl mb-10">
                    <h2 className="text-xl font-bold mb-3 text-white">
                        Your Hand ({gameState.deck.length} cards left) - Select {2 - gameState.selectedCards.length} more
                    </h2>
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-start p-3 bg-gray-800/70 rounded-xl border border-gray-700 shadow-inner max-h-90 overflow-y-auto">
                        {gameState.deck.map(card => (
                            <Card
                                key={card.id}
                                cardId={card.id}
                                number={card.value}
                                type="player"
                                onClick={() => handleSelect(card.id)}
                                disabled={gameState.selectedCards.length >= 2 && !gameState.selectedCards.find(c => c.id === card.id) || gameState.isRoundInPlay}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Game Over & Log */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {gameState.gameOver && (
                    <div className="p-6 rounded-2xl bg-yellow-900/40 border-4 border-yellow-500 shadow-2xl text-white text-center">
                        <h2 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-400" />
                            GAME OVER
                        </h2>
                        <p className="text-xl font-semibold mb-6">
                            {gameState.playerScore > gameState.botScore
                                ? "🎉 Player 1 is the Grand Champion!"
                                : gameState.playerScore < gameState.botScore
                                    ? "🤖 The Bot has bested you this time!"
                                    : "🤝 It's a Noble Draw!"}
                        </p>
                        <p className="text-lg">Final Score: {gameState.playerScore} (P1) vs {gameState.botScore} (Bot)</p>
                        <button
                            onClick={resetGame}
                            className="mt-6 px-6 py-3 bg-yellow-500 rounded-full hover:bg-yellow-600 text-gray-900 font-bold transition-transform transform hover:scale-[1.03] active:scale-95 shadow-lg flex items-center mx-auto gap-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            START NEW GAME
                        </button>
                    </div>
                )}

                <div className={`${gameState.gameOver ? 'md:col-span-1' : 'md:col-span-2'} p-4 rounded-xl bg-gray-700/70 border border-gray-600 shadow-inner h-64 overflow-y-auto`}>
                    <h2 className="text-xl font-bold mb-2 text-white">Round Log</h2>
                    <div className="space-y-1">
                        {gameState.roundLog.length > 0 ? (
                            gameState.roundLog.map((log, i) => (
                                <p key={`log-${i}`} className={`text-sm p-1 rounded ${log.includes('Player 1 wins') ? 'text-green-300' : log.includes('Bot wins') ? 'text-red-300' : 'text-gray-400'} border-b border-gray-600/50`}>
                                    {log}
                                </p>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center pt-8">The game history will appear here.</p>
                        )}
                    </div>
                </div>
            </div>

            {!gameState.gameOver && (
                <button
                    onClick={resetGame}
                    className="mt-8 px-6 py-3 bg-gray-500 rounded-full hover:bg-gray-400 text-white font-bold transition-transform transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
                >
                    <RotateCcw className="w-5 h-5" />
                    Reset Game
                </button>
            )}
        </div>
    );
}






// import { useState, useEffect, useCallback } from "react";
// import { Zap, RotateCcw, Swords, Trophy } from 'lucide-react';

// // --- Card Component ---
// const Card = ({ number, hidden, type, onClick, selected, disabled }) => {
//     const baseStyle = `
//         w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 
//         rounded-xl sm:rounded-2xl border-2 border-white/50 
//         shadow-2xl text-white font-extrabold text-xl sm:text-2xl 
//         flex items-center justify-center 
//         transition-all duration-300 transform-gpu 
//         cursor-pointer 
//         ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
//     `;

//     let cardFaceStyle = '';
//     if (hidden) {
//         cardFaceStyle = type === "bot"
//             ? 'bg-red-800/70 rotate-y-6 shadow-red-900/50'
//             : 'bg-indigo-800/70 shadow-indigo-900/50';
//     } else {
//         cardFaceStyle = type === "bot"
//             ? 'bg-gradient-to-br from-red-600/90 to-pink-500/90 hover:scale-105'
//             : 'bg-gradient-to-br from-blue-500/90 to-purple-600/90 hover:scale-105';
//     }

//     const selectionEffect = selected
//         ? 'ring-4 ring-yellow-400 scale-110 -translate-y-4 z-10'
//         : 'hover:rotate-1 hover:scale-[1.03] active:scale-95';

//     const cardContent = hidden ? (
//         <span className="text-3xl sm:text-4xl text-white/80 opacity-90">
//             <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
//         </span>
//     ) : (
//         <div className="flex flex-col items-center justify-center">
//             <span className="text-sm opacity-80">Value</span>
//             <span className="text-4xl sm:text-5xl">{number}</span>
//         </div>
//     );

//     return (
//         <div
//             className={`${baseStyle} ${cardFaceStyle} ${selected ? selectionEffect : ''}`}
//             onClick={!disabled && onClick ? onClick : null}
//             style={{ perspective: '1000px', transform: selected ? 'rotateY(0deg) scale(1.1) translateY(-1rem)' : 'rotateY(0deg) scale(1)' }}
//         >
//             <div className="w-full h-full p-2 backdrop-blur-sm rounded-xl">
//                 {cardContent}
//             </div>
//         </div>
//     );
// };

// // --- Main App Component ---
// export default function App() {
//     // Initialize deck with unique ids
//     const initialDeck = Array.from({ length: 2 }, (_, i) =>
//         Array.from({ length: 10 }, (_, j) => ({ id: `${i}-${j}`, value: j + 1 }))
//     ).flat();

//     const [deck, setDeck] = useState([]);
//     const [selectedCards, setSelectedCards] = useState([]);
//     const [botCards, setBotCards] = useState([]);
//     const [playerWinPile, setPlayerWinPile] = useState([]);
//     const [botWinPile, setBotWinPile] = useState([]);
//     const [roundLog, setRoundLog] = useState([]);
//     const [roundResult, setRoundResult] = useState("");
//     const [gameOver, setGameOver] = useState(false);
//     const [isRoundInPlay, setIsRoundInPlay] = useState(false);
//     const [lastRoundSelection, setLastRoundSelection] = useState({ player: [], bot: [] });
//     const [playerScore, setPlayerScore] = useState(0);
//     const [botScore, setBotScore] = useState(0);

//     const shuffleDeck = useCallback((array) => {
//         const shuffled = [...array];
//         for (let i = shuffled.length - 1; i > 0; i--) {
//             const j = Math.floor(Math.random() * (i + 1));
//             [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//         }
//         return shuffled;
//     }, []);

//     const resetGame = useCallback(() => {
//         const shuffled = shuffleDeck([...initialDeck]);
//         setDeck(shuffled);
//         setSelectedCards([]);
//         setBotCards([]);
//         setPlayerWinPile([]);
//         setBotWinPile([]);
//         setRoundLog([]);
//         setRoundResult("");
//         setGameOver(false);
//         setIsRoundInPlay(false);
//         setLastRoundSelection({ player: [], bot: [] });
//         setPlayerScore(0);
//         setBotScore(0);
//     }, [shuffleDeck]);

//     useEffect(() => {
//         resetGame();
//     }, [resetGame]);

//     useEffect(() => {
//         if (!gameOver && deck.length < 2 && selectedCards.length === 0) {
//             setGameOver(true);
//         }
//     }, [deck.length, selectedCards.length, gameOver]);

//     // Handle card selection
//     const handleSelect = (cardId) => {
//         if (isRoundInPlay || gameOver) return;

//         const card = deck.find(c => c.id === cardId);
//         if (!card) return;

//         const isSelected = selectedCards.find(c => c.id === cardId);

//         if (isSelected) {
//             setSelectedCards(prev => prev.filter(c => c.id !== cardId));
//             setDeck(prev => [...prev, card]); // return card to deck
//         } else if (selectedCards.length < 2) {
//             setSelectedCards(prev => [...prev, card]);
//             setDeck(prev => prev.filter(c => c.id !== cardId));
//         }
//     };

//     const playRound = () => {
//         if (selectedCards.length !== 2 || isRoundInPlay || gameOver) return;
//         if (deck.length < 2) {
//             setRoundResult("Cannot play, not enough cards left for the bot's draw!");
//             setGameOver(true);
//             return;
//         }

//         setIsRoundInPlay(true);
//         setRoundResult("... Battle in Progress ...");

//         // Bot picks 2 cards
//         const tempDeck = [...deck];
//         const botSelection = [];
//         for (let i = 0; i < 2; i++) {
//             const idx = Math.floor(Math.random() * tempDeck.length);
//             botSelection.push(tempDeck[idx]);
//             tempDeck.splice(idx, 1);
//         }
//         setBotCards(botSelection);
//         setDeck(tempDeck);

//         const playerValues = selectedCards.map(c => c.value);
//         const botValues = botSelection.map(c => c.value);
//         const playerSum = playerValues.reduce((a, b) => a + b, 0);
//         const botSum = botValues.reduce((a, b) => a + b, 0);

//         setTimeout(() => {
//             let result = "";
//             let newPlayerWinPile = [...playerWinPile];
//             let newBotWinPile = [...botWinPile];
//             const wonCards = [...selectedCards, ...botSelection];

//             if (playerSum > botSum) {
//                 result = `Player 1 wins: ${playerSum} vs ${botSum} (Diff: ${playerSum - botSum})`;
//                 newPlayerWinPile.push(...wonCards);
//                 setPlayerScore(s => s + 1);
//             } else if (botSum > playerSum) {
//                 result = `Bot wins: ${botSum} vs ${playerSum} (Diff: ${botSum - playerSum})`;
//                 newBotWinPile.push(...wonCards);
//                 setBotScore(s => s + 1);
//             } else {
//                 result = `It's a tie: ${playerSum} vs ${botSum}`;
//                 newPlayerWinPile.push(...selectedCards);
//                 newBotWinPile.push(...botSelection);
//             }

//             setLastRoundSelection({ player: selectedCards.map(c => c.value), bot: botValues });
//             setPlayerWinPile(newPlayerWinPile);
//             setBotWinPile(newBotWinPile);
//             setRoundResult(result);
//             setRoundLog(prevLog => [`Round ${prevLog.length + 1}: ${result}`, ...prevLog]);

//             setSelectedCards([]);
//             setBotCards([]);
//             setIsRoundInPlay(false);
//         }, 1200);
//     };

//     const currentSelectionSum = selectedCards.reduce((sum, c) => sum + c.value, 0);

//     return (
//         <div className="min-h-screen w-full bg-gray-900 font-sans p-4 sm:p-8 flex flex-col items-center">
//             <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-gray-200 mb-2 mt-4 text-center tracking-tight">
//                 🔥 SUMMON UNO
//             </h1>
//             <p className="text-sm text-gray-400 mb-6 text-center">Select 2 cards, higher sum wins the pot!</p>

//             {/* Scoreboard */}
//             <div className="w-full max-w-4xl grid grid-cols-3 gap-4 mb-8 text-white">
//                 <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
//                     <h3 className="text-sm sm:text-base font-semibold text-blue-300">Player 1</h3>
//                     <p className="text-2xl sm:text-3xl font-bold">{playerWinPile.length}</p>
//                     <p className="text-xs text-gray-500">Cards Won</p>
//                 </div>
//                 <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
//                     <h3 className="text-sm sm:text-base font-semibold text-yellow-300">Rounds Won</h3>
//                     <p className="text-2xl sm:text-3xl font-bold">{playerScore} - {botScore}</p>
//                 </div>
//                 <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
//                     <h3 className="text-sm sm:text-base font-semibold text-red-300">Bot</h3>
//                     <p className="text-2xl sm:text-3xl font-bold">{botWinPile.length}</p>
//                     <p className="text-xs text-gray-500">Cards Won</p>
//                 </div>
//             </div>

//             {/* Battle Arena */}
//             <div className="w-full max-w-4xl mb-8 bg-gray-800/50 p-4 rounded-2xl border border-gray-700 shadow-inner flex flex-col lg:flex-row">
//                 <h2 className="text-xl font-bold text-center mb-4 text-gray-200 flex items-center justify-center gap-2">
//                     <Swords className="w-5 h-5 text-red-400" />
//                     BATTLE ARENA
//                 </h2>

//                 <div className="flex flex-col lg:flex-row justify-between items-center gap-6 min-h-[150px] sm:min-h-[180px] w-full">
//                     <div className="flex flex-col items-center flex-1">
//                         <p className="text-red-300 font-semibold mb-2">Bot's Play</p>
//                         <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
//                             {lastRoundSelection.bot.map((c, i) => (
//                                 <Card key={'bot-last-' + i} number={c} type="bot" disabled />
//                             ))}
//                             {lastRoundSelection.bot.length === 0 && <p className="text-gray-500 italic">Bot's Cards Here</p>}
//                         </div>
//                     </div>

//                     <div className="flex flex-col items-center text-center sm:mx-4 order-first sm:order-none w-full sm:w-auto">
//                         <div className={`text-base sm:text-lg font-bold p-2 px-4 rounded-full transition-all duration-300
//                             ${roundResult.includes('Player 1 wins') 
//                                 ? 'bg-green-600 text-white shadow-lg' 
//                                 : roundResult.includes('Bot wins') 
//                                 ? 'bg-red-600 text-white shadow-lg' 
//                                 : roundResult.includes('tie') 
//                                 ? 'bg-yellow-600 text-gray-900 shadow-lg'
//                                 : 'bg-gray-700/50 text-gray-300'}
//                         `}>
//                             {roundResult || 'Waiting for Cards...'}
//                         </div>
//                     </div>

//                     <div className="flex flex-col items-center flex-1">
//                         <p className="text-blue-300 font-semibold mb-2">Your Play</p>
//                         <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
//                             {lastRoundSelection.player.map((c, i) => (
//                                 <Card key={'player-last-' + i} number={c} type="player" disabled />
//                             ))}
//                             {lastRoundSelection.player.length === 0 && <p className="text-gray-500 italic">Your Cards Here</p>}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Current Selection & Play Button */}
//             <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center mb-8 p-4 bg-gray-700/50 rounded-xl border border-gray-600 shadow-xl">
//                 <div className="flex flex-col items-center mb-4 sm:mb-0">
//                     <p className="text-lg font-bold text-yellow-300 mb-1">Your Selection ({selectedCards.length}/2)</p>
//                     <div className="flex gap-2">
//                         {selectedCards.map(c => (
//                             <Card key={c.id} number={c.value} type="player" selected disabled={isRoundInPlay} />
//                         ))}
//                     </div>
//                     {selectedCards.length > 0 && (
//                         <p className="text-sm text-gray-300 mt-2">Total Sum: <span className="text-xl font-bold text-yellow-300">{currentSelectionSum}</span></p>
//                     )}
//                 </div>

//                 <button
//                     onClick={playRound}
//                     disabled={selectedCards.length !== 2 || isRoundInPlay || gameOver}
//                     className={`px-8 py-3 rounded-full font-extrabold text-lg transition-all duration-200 shadow-2xl
//                         ${selectedCards.length === 2 && !isRoundInPlay && !gameOver
//                             ? 'bg-green-500 hover:bg-green-400 text-white transform hover:scale-105 active:scale-95'
//                             : 'bg-gray-500 text-gray-300 cursor-not-allowed'
//                         }
//                     `}
//                 >
//                     {isRoundInPlay ? 'BATTLE INITIATED...' : 'SUBMIT CARDS & BATTLE'}
//                 </button>
//             </div>

//             {/* Player Hand */}
//             {!gameOver && (
//                 <div className="w-full max-w-4xl mb-10">
//                     <h2 className="text-xl font-bold mb-3 text-white">
//                         Your Hand ({deck.length} cards left) - Select {2 - selectedCards.length} more
//                     </h2>
//                     <div className="flex flex-wrap gap-2 sm:gap-3 justify-start p-3 bg-gray-800/70 rounded-xl border border-gray-700 shadow-inner max-h-90 overflow-y-auto">
//                         {deck.map(card => (
//                             <Card
//                                 key={card.id}
//                                 number={card.value}
//                                 type="player"
//                                 onClick={() => handleSelect(card.id)}
//                                 disabled={selectedCards.length >= 2 || isRoundInPlay}
//                             />
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* Game Over & Log */}
//             <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {gameOver && (
//                     <div className="p-6 rounded-2xl bg-yellow-900/40 border-4 border-yellow-500 shadow-2xl text-white text-center">
//                         <h2 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
//                             <Trophy className="w-8 h-8 text-yellow-400" />
//                             GAME OVER
//                         </h2>
//                         <p className="text-xl font-semibold mb-6">
//                             {playerScore > botScore
//                                 ? "🎉 Player 1 is the Grand Champion!"
//                                 : playerScore < botScore
//                                     ? "🤖 The Bot has bested you this time!"
//                                     : "🤝 It's a Noble Draw!"}
//                         </p>
//                         <p className="text-lg">Final Score: {playerScore} (P1) vs {botScore} (Bot)</p>
//                         <button
//                             onClick={resetGame}
//                             className="mt-6 px-6 py-3 bg-yellow-500 rounded-full hover:bg-yellow-600 text-gray-900 font-bold transition-transform transform hover:scale-[1.03] active:scale-95 shadow-lg flex items-center mx-auto gap-2"
//                         >
//                             <RotateCcw className="w-5 h-5" />
//                             START NEW GAME
//                         </button>
//                     </div>
//                 )}

//                 <div className={`${gameOver ? 'md:col-span-1' : 'md:col-span-2'} p-4 rounded-xl bg-gray-700/70 border border-gray-600 shadow-inner h-64 overflow-y-auto`}>
//                     <h2 className="text-xl font-bold mb-2 text-white">Round Log</h2>
//                     <div className="space-y-1">
//                         {roundLog.map((log, i) => (
//                             <p key={i} className={`text-sm p-1 rounded ${log.includes('Player 1 wins') ? 'text-green-300' : log.includes('Bot wins') ? 'text-red-300' : 'text-gray-400'} border-b border-gray-600/50`}>
//                                 {log}
//                             </p>
//                         ))}
//                         {roundLog.length === 0 && <p className="text-gray-500 italic text-center pt-8">The game history will appear here.</p>}
//                     </div>
//                 </div>
//             </div>

//             {!gameOver && (
//                 <button
//                     onClick={resetGame}
//                     className="mt-8 px-6 py-3 bg-gray-500 rounded-full hover:bg-gray-400 text-white font-bold transition-transform transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
//                 >
//                     <RotateCcw className="w-5 h-5" />
//                     Reset Game
//                 </button>
//             )}
//         </div>
//     );
// }













// import { useState, useEffect, useCallback } from "react";
// import { Zap, RotateCcw, Swords, Trophy } from 'lucide-react';

// // --- Card Component ---
// // Renders a single card with 3D and glass-like effects.
// const Card = ({ number, hidden, type, onClick, selected, disabled }) => {
//     // Determine card styling based on player/bot type and state (hidden/selected)
//     const baseStyle = `
//         w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 
//         rounded-xl sm:rounded-2xl border-2 border-white/50 
//         shadow-2xl text-white font-extrabold text-xl sm:text-2xl 
//         flex items-center justify-center 
//         transition-all duration-300 transform-gpu 
//         cursor-pointer 
//         ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
//     `;

//     let cardFaceStyle = '';
//     if (hidden) {
//         // Back of the card (Bot Deck)
//         cardFaceStyle = type === "bot"
//             ? 'bg-red-800/70 rotate-y-6 shadow-red-900/50'
//             : 'bg-indigo-800/70 shadow-indigo-900/50';
//     } else {
//         // Front of the card (Player Hand, Selected)
//         cardFaceStyle = type === "bot"
//             ? 'bg-gradient-to-br from-red-600/90 to-pink-500/90 hover:scale-105'
//             : 'bg-gradient-to-br from-blue-500/90 to-purple-600/90 hover:scale-105';
//     }

//     const selectionEffect = selected
//         ? 'ring-4 ring-yellow-400 scale-110 -translate-y-4 z-10' // Highlight for selected cards
//         : 'hover:rotate-1 hover:scale-[1.03] active:scale-95';

//     const cardContent = hidden ? (
//         <span className="text-3xl sm:text-4xl text-white/80 opacity-90">
//             <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
//         </span>
//     ) : (
//         <div className="flex flex-col items-center justify-center">
//             <span className="text-sm opacity-80">Value</span>
//             <span className="text-4xl sm:text-5xl">{number}</span>
//         </div>
//     );

//     return (
//         <div
//             className={`${baseStyle} ${cardFaceStyle} ${selected ? selectionEffect : ''}`}
//             onClick={!disabled && onClick ? onClick : null}
//             style={{ perspective: '1000px', transform: selected ? 'rotateY(0deg) scale(1.1) translateY(-1rem)' : 'rotateY(0deg) scale(1)' }}
//         >
//             <div className="w-full h-full p-2 backdrop-blur-sm rounded-xl">
//                 {cardContent}
//             </div>
//         </div>
//     );
// };

// // --- Main App Component ---
// export default function App() {
//     // Game initialization state (2 decks of 1-10)
//     const initialDeck = Array.from({ length: 2 }, (_, i) =>
//         Array.from({ length: 10 }, (_, j) => j + 1)
//     ).flat();

//     const [deck, setDeck] = useState([]); // Player's current hand
//     const [selectedCards, setSelectedCards] = useState([]); // Player's 2 selected cards
//     const [botCards, setBotCards] = useState([]); // Bot's 2 selected cards
//     const [playerWinPile, setPlayerWinPile] = useState([]);
//     const [botWinPile, setBotWinPile] = useState([]);
//     const [roundLog, setRoundLog] = useState([]);
//     const [roundResult, setRoundResult] = useState("");
//     const [gameOver, setGameOver] = useState(false);
//     const [isRoundInPlay, setIsRoundInPlay] = useState(false); // To manage UI during round animation
//     const [lastRoundSelection, setLastRoundSelection] = useState({ player: [], bot: [] });
//     const [playerScore, setPlayerScore] = useState(0);
//     const [botScore, setBotScore] = useState(0);

//     // Utility function to shuffle the deck
//     const shuffleDeck = useCallback((array) => {
//         const shuffled = [...array];
//         for (let i = shuffled.length - 1; i > 0; i--) {
//             const j = Math.floor(Math.random() * (i + 1));
//             [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//         }
//         return shuffled;
//     }, []);

//     // Initial setup and reset logic
//     const resetGame = useCallback(() => {
//         const shuffled = shuffleDeck([...initialDeck]);
//         setDeck(shuffled);
//         setSelectedCards([]);
//         setBotCards([]);
//         setPlayerWinPile([]);
//         setBotWinPile([]);
//         setRoundLog([]);
//         setRoundResult("");
//         setGameOver(false);
//         setIsRoundInPlay(false);
//         setLastRoundSelection({ player: [], bot: [] });
//         setPlayerScore(0);
//         setBotScore(0);
//     }, [shuffleDeck, initialDeck]);

//     // Initial game load
//     useEffect(() => {
//         resetGame();
//     }, [resetGame]);

//     // Check for game over condition
//     useEffect(() => {
//         if (!gameOver && deck.length < 2 && selectedCards.length === 0) {
//             setGameOver(true);
//         }
//     }, [deck.length, selectedCards.length, gameOver]);

//     // Card selection handler (remains largely the same)
//     const handleSelect = (card, originalIndex) => {
//         if (isRoundInPlay || gameOver) return;

//         // Check if the card is already selected
//         const existingIndex = selectedCards.findIndex(c => c.value === card && c.originalIndex === originalIndex);

//         if (existingIndex !== -1) {
//             // Deselect card
//             const newSelected = selectedCards.filter((_, i) => i !== existingIndex);
//             setSelectedCards(newSelected);
//             // Put the card back into the deck at its original position to maintain game integrity
//             const newDeck = [...deck];
//             newDeck.splice(originalIndex, 0, card);
//             setDeck(newDeck);
//         } else if (selectedCards.length < 2) {
//             // Select new card
//             const newSelected = [...selectedCards, { value: card, originalIndex }];
//             setSelectedCards(newSelected);

//             // Remove card from the visible deck
//             const newDeck = [...deck];
//             newDeck.splice(originalIndex, 1);
//             setDeck(newDeck);
//         }
//     };


//     const playRound = () => {
//         if (selectedCards.length !== 2 || isRoundInPlay || gameOver) return;

//         // Check if there are enough cards for the bot's draw
//         if (deck.length < 2) {
//             setRoundResult("Cannot play, not enough cards left for the bot's draw!");
//             setGameOver(true);
//             return;
//         }

//         setIsRoundInPlay(true);
//         setRoundResult("... Battle in Progress ...");

//         // 1. Bot selects 2 cards randomly from the remaining deck
//         const tempDeck = [...deck];
//         const botSelection = [];
//         const botIndices = [];

//         // Randomly pick two distinct cards from the deck
//         for (let i = 0; i < 2; i++) {
//             const idx = Math.floor(Math.random() * tempDeck.length);
//             botSelection.push(tempDeck[idx]);
//             tempDeck.splice(idx, 1);
//         }

//         // 2. Update state for selections and new deck
//         setBotCards(botSelection);
//         setDeck(tempDeck);

//         // Extract player values
//         const playerValues = selectedCards.map(c => c.value);
//         const playerSum = playerValues.reduce((a, b) => a + b, 0);
//         const botSum = botSelection.reduce((a, b) => a + b, 0);

//         // 3. Determine winner and update piles/scores after a short delay for "reveal" effect
//         setTimeout(() => {
//             let result = "";
//             let newPlayerWinPile = [...playerWinPile];
//             let newBotWinPile = [...botWinPile];
//             let wonCards = [...playerValues, ...botSelection];

//             if (playerSum > botSum) {
//                 result = `Player 1 wins: ${playerSum} vs ${botSum} (Difference: ${playerSum - botSum})`;
//                 newPlayerWinPile = [...newPlayerWinPile, ...wonCards];
//                 setPlayerScore(s => s + 1);
//             } else if (botSum > playerSum) {
//                 result = `Bot wins: ${botSum} vs ${playerSum} (Difference: ${botSum - playerSum})`;
//                 newBotWinPile = [...newBotWinPile, ...wonCards];
//                 setBotScore(s => s + 1);
//             } else {
//                 result = `It's a tie: ${playerSum} vs ${botSum}. Cards returned to respective piles.`;
//                 newPlayerWinPile = [...newPlayerWinPile, ...playerValues];
//                 newBotWinPile = [...newBotWinPile, ...botSelection];
//             }

//             // 4. Update state for the next round
//             setLastRoundSelection({ player: playerValues, bot: botSelection });
//             setPlayerWinPile(newPlayerWinPile);
//             setBotWinPile(newBotWinPile);
//             setRoundResult(result);
//             setRoundLog(prevLog => [`Round ${prevLog.length + 1}: ${result}`, ...prevLog]);

//             // Reset selection for the next round
//             setSelectedCards([]);
//             setBotCards([]);
//             setIsRoundInPlay(false);
//         }, 1200); // 1.2 second delay for reveal/animation
//     };

//     // Calculate sum of currently selected cards for display
//     const currentSelectionSum = selectedCards.reduce((sum, c) => sum + c.value, 0);

//     // Find the original card objects for display in the current hand
//     const deckWithOriginalIndices = deck.map((card, index) => ({ value: card, originalIndex: index }));

//     return (
//         <div className="min-h-screen w-full bg-gray-900 font-sans p-4 sm:p-8 flex flex-col items-center">
//             <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-gray-200 mb-2 mt-4 text-center tracking-tight">
//                 🔥 SUMMON UNO
//             </h1>
//             <p className="text-sm text-gray-400 mb-6 text-center">Select 2 cards, higher sum wins the pot!</p>

//             {/* --- Scoreboard and Game Info (Top Area) --- */}
//             <div className="w-full max-w-4xl grid grid-cols-3 gap-4 mb-8 text-white">
//                 <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
//                     <h3 className="text-sm sm:text-base font-semibold text-blue-300">Player 1 (You)</h3>
//                     <p className="text-2xl sm:text-3xl font-bold">{playerWinPile.length}</p>
//                     <p className="text-xs text-gray-500">Total Cards Won</p>
//                 </div>
//                 <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
//                     <h3 className="text-sm sm:text-base font-semibold text-yellow-300">Rounds Won</h3>
//                     <p className="text-2xl sm:text-3xl font-bold">{playerScore} - {botScore}</p>
//                     <p className="text-xs text-gray-500">Score</p>
//                 </div>
//                 <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 shadow-lg text-center">
//                     <h3 className="text-sm sm:text-base font-semibold text-red-300">The Bot</h3>
//                     <p className="text-2xl sm:text-3xl font-bold">{botWinPile.length}</p>
//                     <p className="text-xs text-gray-500">Total Cards Won</p>
//                 </div>
//             </div>

//         {/* --- Battle Arena / Last Play Area --- */}
// <div className="w-full max-w-4xl mb-8 bg-gray-800/50 p-4 rounded-2xl border border-gray-700 shadow-inner flex flex-col lg:flex-row">
//   <h2 className="text-xl font-bold text-center mb-4 text-gray-200 flex items-center justify-center gap-2">
//     <Swords className="w-5 h-5 text-red-400" />
//     BATTLE ARENA
//   </h2>

//   <div className="flex flex-col lg:flex-row justify-between items-center gap-6 min-h-[150px] sm:min-h-[180px] w-full">
    
//     {/* Bot's last selection */}
//     <div className="flex flex-col items-center flex-1">
//       <p className="text-red-300 font-semibold mb-2">Bot's Play</p>
//       <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
//         {lastRoundSelection.bot.map((c, i) => (
//           <Card key={'bot-last-' + i} number={c} type="bot" disabled />
//         ))}
//         {lastRoundSelection.bot.length === 0 && (
//           <p className="text-gray-500 italic">Bot's Cards Here</p>
//         )}
//       </div>
//     </div>

//     {/* Round Result (Displayed first on mobile) */}
//                     <div className="flex flex-col items-center text-center sm:mx-4 order-first sm:order-none w-full sm:w-auto">
//                         <div className={`text-base sm:text-lg font-bold p-2 px-4 rounded-full transition-all duration-300
//                             ${roundResult.includes('Player 1 wins') 
//                                 ? 'bg-green-600 text-white shadow-lg' 
//                                 : roundResult.includes('Bot wins') 
//                                 ? 'bg-red-600 text-white shadow-lg' 
//                                 : roundResult.includes('tie') 
//                                 ? 'bg-yellow-600 text-gray-900 shadow-lg' // Fix: Using dark text for yellow background
//                                 : 'bg-gray-700/50 text-gray-300'}
//                         `}>
//                             {roundResult || 'Waiting for Cards...'}
//                         </div>
//                     </div>

//     {/* Player's last selection */}
//     <div className="flex flex-col items-center flex-1">
//       <p className="text-blue-300 font-semibold mb-2">Your Play</p>
//       <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
//         {lastRoundSelection.player.map((c, i) => (
//           <Card key={'player-last-' + i} number={c} type="player" disabled />
//         ))}
//         {lastRoundSelection.player.length === 0 && (
//           <p className="text-gray-500 italic">Your Cards Here</p>
//         )}
//       </div>
//     </div>

//   </div>
// </div>


//             {/* --- Control Panel and Current Selection --- */}
//             <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center mb-8 p-4 bg-gray-700/50 rounded-xl border border-gray-600 shadow-xl">
//                 <div className="flex flex-col items-center mb-4 sm:mb-0">
//                     <p className="text-lg font-bold text-yellow-300 mb-1">Your Selection ({selectedCards.length}/2)</p>
//                     <div className="flex gap-2">
//                         {selectedCards.map((c, i) => (
//                             <Card key={'selected-' + i} number={c.value} type="player" selected disabled={isRoundInPlay} />
//                         ))}
//                     </div>
//                     {selectedCards.length > 0 && (
//                         <p className="text-sm text-gray-300 mt-2">Total Sum: <span className="text-xl font-bold text-yellow-300">{currentSelectionSum}</span></p>
//                     )}
//                 </div>

//                 <button
//                     onClick={playRound}
//                     disabled={selectedCards.length !== 2 || isRoundInPlay || gameOver}
//                     className={`
//                         px-8 py-3 rounded-full font-extrabold text-lg transition-all duration-200 shadow-2xl
//                         ${selectedCards.length === 2 && !isRoundInPlay && !gameOver
//                             ? 'bg-green-500 hover:bg-green-400 text-white transform hover:scale-105 active:scale-95'
//                             : 'bg-gray-500 text-gray-300 cursor-not-allowed'
//                         }
//                     `}
//                 >
//                     {isRoundInPlay ? 'BATTLE INITIATED...' : 'SUBMIT CARDS & BATTLE'}
//                 </button>
//             </div>

//             {/* --- Player Deck (The Hand) --- */}
//             {!gameOver && (
//                 <div className="w-full max-w-4xl mb-10">
//                     <h2 className="text-xl font-bold mb-3 text-white">
//                         Your Hand ({deck.length} cards left) - Select {2 - selectedCards.length} more
//                     </h2>
//                     <div className="flex flex-wrap gap-2 sm:gap-3 justify-start p-3 bg-gray-800/70 rounded-xl border border-gray-700 shadow-inner max-h-90 overflow-y-auto">
//                         {deckWithOriginalIndices.map((card, idx) => (
//                             <Card
//                                 key={card.value + '-' + card.originalIndex}
//                                 number={card.value}
//                                 type="player"
//                                 onClick={() => handleSelect(card.value, idx)}
//                                 disabled={selectedCards.length >= 2 || isRoundInPlay}
//                             />
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* --- Game Over Modal & Log --- */}
//             <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {gameOver && (
//                     <div className="p-6 rounded-2xl bg-yellow-900/40 border-4 border-yellow-500 shadow-2xl text-white text-center">
//                         <h2 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
//                             <Trophy className="w-8 h-8 text-yellow-400" />
//                             GAME OVER
//                         </h2>
//                         <p className="text-xl font-semibold mb-6">
//                             {playerScore > botScore
//                                 ? "🎉 Player 1 is the Grand Champion!"
//                                 : playerScore < botScore
//                                     ? "🤖 The Bot has bested you this time!"
//                                     : "🤝 It's a Noble Draw!"}
//                         </p>
//                         <p className="text-lg">Final Score: {playerScore} (P1) vs {botScore} (Bot)</p>
//                         <button
//                             onClick={resetGame}
//                             className="mt-6 px-6 py-3 bg-yellow-500 rounded-full hover:bg-yellow-600 text-gray-900 font-bold transition-transform transform hover:scale-[1.03] active:scale-95 shadow-lg flex items-center mx-auto gap-2"
//                         >
//                             <RotateCcw className="w-5 h-5" />
//                             START NEW GAME
//                         </button>
//                     </div>
//                 )}

//                 <div className={`${gameOver ? 'md:col-span-1' : 'md:col-span-2'} p-4 rounded-xl bg-gray-700/70 border border-gray-600 shadow-inner h-64 overflow-y-auto`}>
//                     <h2 className="text-xl font-bold mb-2 text-white">Round Log</h2>
//                     <div className="space-y-1">
//                         {roundLog.map((log, i) => (
//                             <p key={i} className={`text-sm p-1 rounded ${log.includes('Player 1 wins') ? 'text-green-300' : log.includes('Bot wins') ? 'text-red-300' : 'text-gray-400'} border-b border-gray-600/50`}>
//                                 {log}
//                             </p>
//                         ))}
//                         {roundLog.length === 0 && <p className="text-gray-500 italic text-center pt-8">The game history will appear here.</p>}
//                     </div>
//                 </div>
//             </div>

//             {/* Global Reset Button (always visible) */}
//             {!gameOver && (
//                 <button
//                     onClick={resetGame}
//                     className="mt-8 px-6 py-3 bg-gray-500 rounded-full hover:bg-gray-400 text-white font-bold transition-transform transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
//                 >
//                     <RotateCcw className="w-5 h-5" />
//                     Reset Game
//                 </button>
//             )}
//         </div>
//     );
// }
















// import { useState } from "react";

// export default function App() {
//   const initialDeck = Array.from({ length: 2 }, (_, i) =>
//     Array.from({ length: 10 }, (_, j) => j + 1)
//   ).flat();

//   const [deck, setDeck] = useState([...initialDeck]);
//   const [selectedCards, setSelectedCards] = useState([]);
//   const [botCards, setBotCards] = useState([]);
//   const [playerWinPile, setPlayerWinPile] = useState([]);
//   const [botWinPile, setBotWinPile] = useState([]);
//   const [roundLog, setRoundLog] = useState([]);
//   const [roundResult, setRoundResult] = useState("");
//   const [gameOver, setGameOver] = useState(false);
//   const [revealBotCards, setRevealBotCards] = useState(false);
//   const [lastRoundSelection, setLastRoundSelection] = useState({player: [], bot: []});

//   const shuffleDeck = (array) => [...array].sort(() => Math.random() - 0.5);

//   const handleSelect = (card, index) => {
//     if (selectedCards.length >= 2) return;
//     setSelectedCards([...selectedCards, card]);
//     const newDeck = [...deck];
//     newDeck.splice(index, 1);
//     setDeck(newDeck);
//   };

//   const playRound = () => {
//     if (selectedCards.length !== 2) return;
//     if (deck.length < 2) {
//       alert("Not enough cards for bot to play!");
//       return;
//     }

//     // Bot selects 2 cards randomly
//     const botSelection = [];
//     const tempDeck = [...deck];
//     while (botSelection.length < 2) {
//       const idx = Math.floor(Math.random() * tempDeck.length);
//       botSelection.push(tempDeck[idx]);
//       tempDeck.splice(idx, 1);
//     }
//     setBotCards(botSelection);
//     setDeck(tempDeck);
//     setRevealBotCards(true);

//     const playerSum = selectedCards.reduce((a, b) => a + b, 0);
//     const botSum = botSelection.reduce((a, b) => a + b, 0);

//     let result = "";
//     if (playerSum > botSum) {
//       result = `Player wins this round! ${playerSum} vs ${botSum}`;
//       setPlayerWinPile([...playerWinPile, ...selectedCards, ...botSelection]);
//     } else if (botSum > playerSum) {
//       result = `Bot wins this round! ${botSum} vs ${playerSum}`;
//       setBotWinPile([...botWinPile, ...selectedCards, ...botSelection]);
//     } else {
//       result = `It's a tie! ${playerSum} vs ${botSum}`;
//       setPlayerWinPile([...playerWinPile, ...selectedCards]);
//       setBotWinPile([...botWinPile, ...botSelection]);
//     }

//     setLastRoundSelection({player: [...selectedCards], bot: [...botSelection]});

//     setRoundLog([...roundLog, result]);
//     setRoundResult(result);
//     setSelectedCards([]);
//   };

//   const resetGame = () => {
//     const shuffled = shuffleDeck([...initialDeck]);
//     setDeck(shuffled);
//     setSelectedCards([]);
//     setBotCards([]);
//     setPlayerWinPile([]);
//     setBotWinPile([]);
//     setRoundLog([]);
//     setRoundResult("");
//     setGameOver(false);
//     setRevealBotCards(false);
//    setLastRoundSelection({ player: [], bot: [] }); // <-- reset as object

//   };

//   if (!gameOver && deck.length < 2 && selectedCards.length < 2) {
//     setGameOver(true);
//   }

//   // Card component with type prop
//   const Card = ({ number, hidden, type }) => {
//     const bgColor = hidden
//       ? type === "bot"
//         ? "bg-red-900/40"
//         : "bg-blue-900/40"
//       : type === "bot"
//         ? "bg-gradient-to-tr from-red-500 via-red-600 to-pink-500"
//         : "bg-gradient-to-tr from-purple-500 via-blue-500 to-indigo-500";

//     return (
//       <div
//         className={`
//           w-20 h-28 rounded-2xl border border-white/30 backdrop-blur-md
//           flex items-center justify-center text-2xl font-bold cursor-pointer
//           text-white shadow-lg transition-transform transform hover:scale-105
//           ${bgColor}
//         `}
//       >
//         {!hidden ? number : "❓"}
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center py-10 px-4">
//       <h1 className="text-4xl font-bold mb-6 text-center text-white">
//         🔥 UNO Glass Card Battle
//       </h1>

//       {!gameOver && (
//         <div className="w-full max-w-4xl mb-6">
//           <h2 className="text-xl mb-2 text-white">Your Card Deck (Select 2)</h2>
//           <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
//             {deck.map((card, idx) => (
//               <div key={idx} onClick={() => handleSelect(card, idx)}>
//                 <Card number={card} type="player" />
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* <div className="flex gap-8 mb-6">
//         <div>
//           <h2 className="text-lg font-semibold mb-2 text-white">Your Selection:</h2>
//           <div className="flex gap-3">
//             {selectedCards.map((c, i) => (
//               <Card key={i} number={c} type="player" />
//             ))}
//           </div>
//         </div>

//         <div>
//           <h2 className="text-lg font-semibold mb-2 text-white">Bot Selection:</h2>
//           <div className="flex gap-3">
//             {revealBotCards
//               ? botCards.map((c, i) => <Card key={i} number={c} type="bot" />)
//               : Array(2)
//                   .fill(0)
//                   .map((_, i) => <Card key={i} hidden type="bot" />)}
//           </div>
//         </div>
//       </div> */}

//        {lastRoundSelection.player.length > 0 && lastRoundSelection.bot.length > 0 && (
//   <div className="flex gap-8 mb-6 justify-center">
//     <div>
//       <h2 className="text-lg font-semibold mb-2 text-white">Player 1 Last Round:</h2>
//       <div className="flex gap-3">
//         {lastRoundSelection.player.map((c, i) => (
//           <Card key={i} number={c} type="player" />
//         ))}
//       </div>
//     </div>

//     <div>
//       <h2 className="text-lg font-semibold mb-2 text-white">Bot Last Round:</h2>
//       <div className="flex gap-3">
//         {lastRoundSelection.bot.map((c, i) => (
//           <Card key={i} number={c} type="bot" />
//         ))}
//       </div>
//     </div>
//   </div>
// )}

     




//       {!gameOver && selectedCards.length === 2 && (
//         <button
//           onClick={playRound}
//           className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 mb-4 text-white font-bold"
//         >
//           Submit Cards
//         </button>
//       )}

//       {roundResult && <div className="mb-4 text-center text-lg font-semibold text-white">{roundResult}</div>}

//       <div className="w-full max-w-4xl bg-gray-800 p-4 rounded-lg mb-4 text-white">
//         <h2 className="text-xl font-semibold mb-2">Scoreboard</h2>
//         <p>Player Win Deck: {playerWinPile.length}</p>
//         <p>Bot Win Deck: {botWinPile.length}</p>
//         <p>Remaining Cards: {deck.length}</p>
//       </div>

//       <div className="w-full max-w-4xl bg-gray-700 p-4 rounded-lg h-48 overflow-y-auto mb-6 text-white">
//         <h2 className="text-xl font-semibold mb-2">Round Log</h2>
//         {roundLog.map((log, i) => (
//           <p key={i} className="text-sm border-b border-white/20 py-1">
//             {log}
//           </p>
//         ))}
//       </div>

//       {gameOver && (
//         <div className="text-center mb-6 text-white">
//           <h2 className="text-3xl font-bold mb-4">🏁 Game Over!</h2>
//           <p className="mb-2">
//             {playerWinPile.length > botWinPile.length
//               ? "🎉 Player Wins the Game!"
//               : playerWinPile.length < botWinPile.length
//               ? "🤖 Bot Wins the Game!"
//               : "🤝 It's a Draw!"}
//           </p>
//         </div>
//       )}

//       <button
//         onClick={resetGame}
//         className="px-6 py-3 bg-yellow-500 rounded-lg hover:bg-yellow-600 text-white font-bold"
//       >
//         Reset Game
//       </button>
//     </div>
//   );
// }








// import { useState } from "react";

// export default function App() {
//   const initialDeck = Array.from({ length: 2 }, (_, i) =>
//     Array.from({ length: 10 }, (_, j) => j + 1)
//   ).flat();

//   const [deck, setDeck] = useState([...initialDeck]);
//   const [selectedCards, setSelectedCards] = useState([]);
//   const [botCards, setBotCards] = useState([]);
//   const [playerWinPile, setPlayerWinPile] = useState([]);
//   const [botWinPile, setBotWinPile] = useState([]);
//   const [roundLog, setRoundLog] = useState([]);
//   const [roundResult, setRoundResult] = useState("");
//   const [gameOver, setGameOver] = useState(false);
//   const [revealBotCards, setRevealBotCards] = useState(false);

//   const shuffleDeck = (array) => [...array].sort(() => Math.random() - 0.5);

//   const handleSelect = (card, index) => {
//     if (selectedCards.length >= 2) return;
//     setSelectedCards([...selectedCards, card]);
//     const newDeck = [...deck];
//     newDeck.splice(index, 1);
//     setDeck(newDeck);
//   };

//   const playRound = () => {
//     if (selectedCards.length !== 2) return;
//     if (deck.length < 2) {
//       alert("Not enough cards for bot to play!");
//       return;
//     }

//     const botSelection = [];
//     const tempDeck = [...deck];
//     while (botSelection.length < 2) {
//       const idx = Math.floor(Math.random() * tempDeck.length);
//       botSelection.push(tempDeck[idx]);
//       tempDeck.splice(idx, 1);
//     }
//     setBotCards(botSelection);
//     setDeck(tempDeck);
//     setRevealBotCards(true);

//     const playerSum = selectedCards.reduce((a, b) => a + b, 0);
//     const botSum = botSelection.reduce((a, b) => a + b, 0);

//     let result = "";
//     if (playerSum > botSum) {
//       result = `Player wins this round! ${playerSum} vs ${botSum}`;
//       setPlayerWinPile([...playerWinPile, ...selectedCards, ...botSelection]);
//     } else if (botSum > playerSum) {
//       result = `Bot wins this round! ${botSum} vs ${playerSum}`;
//       setBotWinPile([...botWinPile, ...selectedCards, ...botSelection]);
//     } else {
//       result = `It's a tie! ${playerSum} vs ${botSum}`;
//       setPlayerWinPile([...playerWinPile, ...selectedCards]);
//       setBotWinPile([...botWinPile, ...botSelection]);
//     }

//     setRoundLog([...roundLog, result]);
//     setRoundResult(result);
//     setSelectedCards([]);
//   };

//   const resetGame = () => {
//     const shuffled = shuffleDeck([...initialDeck]);
//     setDeck(shuffled);
//     setSelectedCards([]);
//     setBotCards([]);
//     setPlayerWinPile([]);
//     setBotWinPile([]);
//     setRoundLog([]);
//     setRoundResult("");
//     setGameOver(false);
//     setRevealBotCards(false);
//   };

//   if (!gameOver && deck.length < 2 && selectedCards.length < 2) {
//     setGameOver(true);
//   }

//   // Card component
//   const Card = ({ number, hidden, type }) => {
//     // Determine background based on type
//     const bgColor = hidden
//       ? type === "bot"
//         ? "bg-red-900/40"
//         : "bg-blue-900/40"
//       : type === "bot"
//         ? "bg-gradient-to-tr from-red-500 via-red-600 to-pink-500"
//         : "bg-gradient-to-tr from-purple-500 via-blue-500 to-indigo-500";

//     return (
//       <div
//         className={`
//         w-20 h-28 rounded-2xl border border-white/30 backdrop-blur-md
//         flex items-center justify-center text-2xl font-bold cursor-pointer
//         text-white shadow-lg transition-transform transform hover:scale-105
//         ${bgColor}
//       `}
//       >
//         {!hidden ? number : "❓"}
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center py-10 px-4">
//       <h1 className="text-4xl font-bold mb-6 text-center text-white">
//         🔥 UNO Glass Card Battle
//       </h1>

//       {!gameOver && (
//         <div className="w-full max-w-4xl mb-6">
//           <h2 className="text-xl mb-2 text-white">Your Card Deck (Select 2)</h2>
//           <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
//             {deck.map((card, idx) => (
//               <div key={idx} onClick={() => handleSelect(card, idx)}>
//                 <Card number={card} />
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="flex gap-8 mb-6">
//         <div>
//           <h2 className="text-lg font-semibold mb-2 text-white">Your Selection:</h2>
//           <div className="flex gap-3">
//             {selectedCards.map((c, i) => (
//               <Card key={i} number={c} />
//             ))}
//           </div>
//         </div>

//         <div>
//           <h2 className="text-lg font-semibold mb-2 text-white">Bot Selection:</h2>
//           <div className="flex gap-3">
//             {revealBotCards
//               ? botCards.map((c, i) => <Card key={i} number={c} />)
//               : Array(2)
//                 .fill(0)
//                 .map((_, i) => <Card key={i} hidden />)}
//           </div>
//         </div>
//       </div>

//       {!gameOver && selectedCards.length === 2 && (
//         <button
//           onClick={playRound}
//           className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 mb-4 text-white font-bold"
//         >
//           Submit Cards
//         </button>
//       )}

//       {roundResult && <div className="mb-4 text-center text-lg font-semibold text-white">{roundResult}</div>}

//       <div className="w-full max-w-4xl bg-gray-800 p-4 rounded-lg mb-4 text-white">
//         <h2 className="text-xl font-semibold mb-2">Scoreboard</h2>
//         <p>Player Win Deck: {playerWinPile.length}</p>
//         <p>Bot Win Deck: {botWinPile.length}</p>
//         <p>Remaining Cards: {deck.length}</p>
//       </div>

//       <div className="w-full max-w-4xl bg-gray-700 p-4 rounded-lg h-48 overflow-y-auto mb-6 text-white">
//         <h2 className="text-xl font-semibold mb-2">Round Log</h2>
//         {roundLog.map((log, i) => (
//           <p key={i} className="text-sm border-b border-white/20 py-1">
//             {log}
//           </p>
//         ))}
//       </div>

//       {gameOver && (
//         <div className="text-center mb-6 text-white">
//           <h2 className="text-3xl font-bold mb-4">🏁 Game Over!</h2>
//           <p className="mb-2">
//             {playerWinPile.length > botWinPile.length
//               ? "🎉 Player Wins the Game!"
//               : playerWinPile.length < botWinPile.length
//                 ? "🤖 Bot Wins the Game!"
//                 : "🤝 It's a Draw!"}
//           </p>
//         </div>
//       )}

//       <button
//         onClick={resetGame}
//         className="px-6 py-3 bg-yellow-500 rounded-lg hover:bg-yellow-600 text-white font-bold"
//       >
//         Reset Game
//       </button>
//     </div>
//   );
// }










// import { useState } from "react";

// export default function App() {
//   // Initial deck of 20 cards (numbers 1–10, two of each)
//   const initialDeck = Array.from({ length: 2 }, (_, i) =>
//     Array.from({ length: 10 }, (_, j) => j + 1)
//   ).flat();

//   const [deck, setDeck] = useState([...initialDeck]);
//   const [selectedCards, setSelectedCards] = useState([]);
//   const [botCards, setBotCards] = useState([]);
//   const [playerWinPile, setPlayerWinPile] = useState([]);
//   const [botWinPile, setBotWinPile] = useState([]);
//   const [roundLog, setRoundLog] = useState([]);
//   const [roundResult, setRoundResult] = useState("");
//   const [gameOver, setGameOver] = useState(false);
//   const [revealBotCards, setRevealBotCards] = useState(false);

//   // Shuffle function
//   const shuffleDeck = (array) => [...array].sort(() => Math.random() - 0.5);

//   // Handle player card selection
//   const handleSelect = (card, index) => {
//     if (selectedCards.length >= 2) return; // limit 2 cards
//     setSelectedCards([...selectedCards, card]);
//     const newDeck = [...deck];
//     newDeck.splice(index, 1);
//     setDeck(newDeck);
//   };

//   // Play round
//   const playRound = () => {
//     if (selectedCards.length !== 2) return;
//     if (deck.length < 2) {
//       alert("Not enough cards for bot to play!");
//       return;
//     }

//     // Bot secretly selects 2 random cards
//     const botSelection = [];
//     const tempDeck = [...deck];
//     while (botSelection.length < 2) {
//       const idx = Math.floor(Math.random() * tempDeck.length);
//       botSelection.push(tempDeck[idx]);
//       tempDeck.splice(idx, 1);
//     }
//     setBotCards(botSelection);
//     setDeck(tempDeck);

//     // Reveal bot cards after submission
//     setRevealBotCards(true);

//     const playerSum = selectedCards.reduce((a, b) => a + b, 0);
//     const botSum = botSelection.reduce((a, b) => a + b, 0);

//     let result = "";
//     if (playerSum > botSum) {
//       result = `Player wins this round! ${playerSum} vs ${botSum}`;
//       setPlayerWinPile([...playerWinPile, ...selectedCards, ...botSelection]);
//     } else if (botSum > playerSum) {
//       result = `Bot wins this round! ${botSum} vs ${playerSum}`;
//       setBotWinPile([...botWinPile, ...selectedCards, ...botSelection]);
//     } else {
//       result = `It's a tie! ${playerSum} vs ${botSum}`;
//       setPlayerWinPile([...playerWinPile, ...selectedCards]);
//       setBotWinPile([...botWinPile, ...botSelection]);
//     }

//     setRoundLog([...roundLog, result]);
//     setRoundResult(result);
//     setSelectedCards([]);
//   };

//   // Reset game
//   const resetGame = () => {
//     const shuffled = shuffleDeck([...initialDeck]);
//     setDeck(shuffled);
//     setSelectedCards([]);
//     setBotCards([]);
//     setPlayerWinPile([]);
//     setBotWinPile([]);
//     setRoundLog([]);
//     setRoundResult("");
//     setGameOver(false);
//     setRevealBotCards(false);
//   };

//   // Check for game over
//   if (!gameOver && deck.length < 2 && selectedCards.length < 2) {
//     setGameOver(true);
//   }

//   return (
//     <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col items-center py-10 px-4">
//       <h1 className="text-4xl font-bold mb-6 text-center">
//         🔥 UNO Card Battle (Player vs Bot)
//       </h1>

//       {/* Card grid */}
//       {!gameOver && (
//         <div className="w-full max-w-3xl mb-6">
//           <h2 className="text-xl mb-2">Your Card Deck (Select 2)</h2>
//           <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
//             {deck.map((card, idx) => (
//               <button
//                 key={idx}
//                 onClick={() => handleSelect(card, idx)}
//                 className="w-full py-3 bg-blue-600 rounded-lg text-lg font-bold hover:bg-blue-500"
//               >
//                 {card}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Selected cards */}
//       <div className="flex gap-6 mb-4">
//         <div>
//           <h2 className="text-lg font-semibold mb-2">Your Selection:</h2>
//           <div className="flex gap-3">
//             {selectedCards.map((c, i) => (
//               <div
//                 key={i}
//                 className="w-16 h-24 bg-blue-500 flex items-center justify-center rounded-lg text-2xl font-bold"
//               >
//                 {c}
//               </div>
//             ))}
//           </div>
//         </div>

//         <div>
//           <h2 className="text-lg font-semibold mb-2">Bot Selection:</h2>
//           <div className="flex gap-3">
//             {revealBotCards
//               ? botCards.map((c, i) => (
//                   <div
//                     key={i}
//                     className="w-16 h-24 bg-red-500 flex items-center justify-center rounded-lg text-2xl font-bold"
//                   >
//                     {c}
//                   </div>
//                 ))
//               : Array(2)
//                   .fill(0)
//                   .map((_, i) => (
//                     <div
//                       key={i}
//                       className="w-16 h-24 bg-red-900 flex items-center justify-center rounded-lg text-2xl font-bold"
//                     >
//                       ❓
//                     </div>
//                   ))}
//           </div>
//         </div>
//       </div>

//       {/* Play round button */}
//       {!gameOver && selectedCards.length === 2 && (
//         <button
//           onClick={playRound}
//           className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 mb-4"
//         >
//           Submit Cards
//         </button>
//       )}

//       {/* Round result */}
//       {roundResult && (
//         <div className="mb-4 text-center text-lg font-semibold">{roundResult}</div>
//       )}

//       {/* Scoreboard */}
//       <div className="w-full max-w-3xl bg-gray-800 p-4 rounded-lg mb-4">
//         <h2 className="text-xl font-semibold mb-2">Scoreboard</h2>
//         <p>Player Win Deck: {playerWinPile.length}</p>
//         <p>Bot Win Deck: {botWinPile.length}</p>
//         <p>Remaining Cards: {deck.length}</p>
//       </div>

//       {/* Round Log */}
//       <div className="w-full max-w-3xl bg-gray-700 p-4 rounded-lg h-48 overflow-y-auto mb-6">
//         <h2 className="text-xl font-semibold mb-2">Round Log</h2>
//         {roundLog.map((log, i) => (
//           <p key={i} className="text-sm border-b border-gray-600 py-1">
//             {log}
//           </p>
//         ))}
//       </div>

//       {/* Game over */}
//       {gameOver && (
//         <div className="text-center mb-6">
//           <h2 className="text-3xl font-bold mb-4">🏁 Game Over!</h2>
//           <p className="mb-2">
//             {playerWinPile.length > botWinPile.length
//               ? "🎉 Player Wins the Game!"
//               : playerWinPile.length < botWinPile.length
//               ? "🤖 Bot Wins the Game!"
//               : "🤝 It's a Draw!"}
//           </p>
//         </div>
//       )}

//       {/* Reset button */}
//       <button
//         onClick={resetGame}
//         className="px-6 py-3 bg-yellow-500 rounded-lg hover:bg-yellow-600"
//       >
//         Reset Game
//       </button>
//     </div>
//   );
// }











// import { useState, useEffect } from "react";

// export default function App() {
//   // Generate random deck of 10 cards (1–9)
//   const generateDeck = () =>
//     Array.from({ length: 10 }, () => Math.floor(Math.random() * 9) + 1);

//   const [p1Deck, setP1Deck] = useState(generateDeck());
//   const [p2Deck, setP2Deck] = useState(generateDeck());

//   const [p1Selected, setP1Selected] = useState([]);
//   const [p2Selected, setP2Selected] = useState([]);

//   const [p1WinDeck, setP1WinDeck] = useState([]);
//   const [p2WinDeck, setP2WinDeck] = useState([]);

//   const [roundWinner, setRoundWinner] = useState("");
//   const [gameOver, setGameOver] = useState(false);

//   // Trigger bot to select 2 cards every time player selects 2
//   useEffect(() => {
//     if (p1Selected.length === 2) {
//       botSelectCards();
//     }
//   }, [p1Selected]);

//   const botSelectCards = () => {
//     // pick 2 random cards from bot's deck
//     if (p2Deck.length < 2) return;

//     const indexes = [];
//     while (indexes.length < 2) {
//       const idx = Math.floor(Math.random() * p2Deck.length);
//       if (!indexes.includes(idx)) indexes.push(idx);
//     }

//     setP2Selected([p2Deck[indexes[0]], p2Deck[indexes[1]]]);
//   };

//   const handleCardSelect = (card, index) => {
//     if (p1Selected.length === 2) return;

//     setP1Selected((prev) => [...prev, card]);

//     // remove card from deck after selecting it
//     setP1Deck((prev) => prev.filter((_, i) => i !== index));
//   };

//   const playRound = () => {
//     if (p1Selected.length < 2 || p2Selected.length < 2) return;

//     const p1Sum = p1Selected[0] + p1Selected[1];
//     const p2Sum = p2Selected[0] + p2Selected[1];

//     if (p1Sum > p2Sum) {
//       setRoundWinner("Player 1 Wins!");
//       setP1WinDeck((prev) => [...prev, ...p1Selected, ...p2Selected]);
//     } else if (p2Sum > p1Sum) {
//       setRoundWinner("Bot Wins!");
//       setP2WinDeck((prev) => [...prev, ...p1Selected, ...p2Selected]);
//     } else {
//       setRoundWinner("It's a Tie! No one gets the cards.");
//     }

//     // Reset
//     setP1Selected([]);
//     setP2Selected([]);

//     // Remove bot cards from its deck
//     setP2Deck((prev) => {
//       const deckCopy = [...prev];
//       p2Selected.forEach((card) => {
//         const index = deckCopy.indexOf(card);
//         if (index !== -1) deckCopy.splice(index, 1);
//       });
//       return deckCopy;
//     });
//   };

//   useEffect(() => {
//     if (p1Deck.length === 0 && p2Deck.length === 0) {
//       setGameOver(true);
//     }
//   }, [p1Deck, p2Deck]);

//   const resetGame = () => {
//     setP1Deck(generateDeck());
//     setP2Deck(generateDeck());
//     setP1Selected([]);
//     setP2Selected([]);
//     setP1WinDeck([]);
//     setP2WinDeck([]);
//     setRoundWinner("");
//     setGameOver(false);
//   };

//   return (
//   <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col">
//     <div className="w-full max-w-5xl mx-auto px-4 py-10">
//       <h1 className="text-4xl font-bold mb-6 text-center">
//         🔥 UNO Duel Game (Player vs Bot)
//       </h1>

//       {gameOver ? (
//         <div className="text-center w-full">
//           ...
//         </div>
//       ) : (
//         <>
//           <div className="text-2xl font-semibold mb-4 text-center">
//             {roundWinner}
//           </div>

//           <div className="w-full">
//             <h2 className="text-xl mb-2">Your Cards (Select 2)</h2>

//             <div className="grid grid-cols-3 md:grid-cols-5 gap-3 w-full">
//               {p1Deck.map((card, index) => (
//                 <button
//                   key={index}
//                   onClick={() => handleCardSelect(card, index)}
//                   className="w-full py-3 bg-blue-600 rounded-lg text-lg hover:bg-blue-500"
//                 >
//                   {card}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="mt-6 text-center">
//             <h2 className="text-xl">You Selected:</h2>
//             <div className="text-3xl">{p1Selected.join(" , ")}</div>

//             <h2 className="text-xl mt-4">Bot Selected:</h2>
//             <div className="text-3xl text-red-300">
//               {p2Selected.join(" , ")}
//             </div>
//           </div>

//           {p1Selected.length === 2 && p2Selected.length === 2 && (
//             <div className="text-center">
//               <button
//                 onClick={playRound}
//                 className="mt-6 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500"
//               >
//                 Play Round
//               </button>
//             </div>
//           )}

//           <div className="mt-10 text-center text-lg">
//             <p>Player 1 Win Deck: {p1WinDeck.length}</p>
//             <p>Bot Win Deck: {p2WinDeck.length}</p>
//           </div>
//         </>
//       )}
//     </div>
//   </div>
// );
// }







// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//     <div className='container mx-auto py-10 my-10'>
//       <h2 className='text-4xl mx-auto'>Hi Guys</h2>
//     </div>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
