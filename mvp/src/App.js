import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Users, Plus, X, Check, Activity, Search } from 'lucide-react';

const CryptoPrizePicks = () => {
  const [activeTab, setActiveTab] = useState('picks');
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [betAmount, setBetAmount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [streamingPrices, setStreamingPrices] = useState({});
  const [priceFlashes, setPriceFlashes] = useState({});

  // Simulated top 500 crypto data (in production, fetch from CoinMarketCap API)
  // https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=500
  const initialCryptoData = [
    { id: 1, symbol: 'BTC', name: 'Bitcoin', rank: 1, basePrice: 63250.00, line: 63500.00, impliedMove: 3.2, iv: 45.5, volume24h: 28500000000 },
    { id: 2, symbol: 'ETH', name: 'Ethereum', rank: 2, basePrice: 3125.50, line: 3150.00, impliedMove: 4.1, iv: 52.3, volume24h: 15200000000 },
    { id: 3, symbol: 'BNB', name: 'BNB', rank: 3, basePrice: 585.25, line: 590.00, impliedMove: 3.8, iv: 48.2, volume24h: 1800000000 },
    { id: 4, symbol: 'SOL', name: 'Solana', rank: 4, basePrice: 142.80, line: 145.00, impliedMove: 6.5, iv: 68.5, volume24h: 3200000000 },
    { id: 5, symbol: 'XRP', name: 'Ripple', rank: 5, basePrice: 0.5234, line: 0.5250, impliedMove: 5.2, iv: 58.3, volume24h: 2100000000 },
    { id: 6, symbol: 'USDC', name: 'USD Coin', rank: 6, basePrice: 1.0000, line: 1.0001, impliedMove: 0.1, iv: 2.5, volume24h: 5800000000 },
    { id: 7, symbol: 'ADA', name: 'Cardano', rank: 7, basePrice: 0.4567, line: 0.4600, impliedMove: 5.8, iv: 62.1, volume24h: 580000000 },
    { id: 8, symbol: 'DOGE', name: 'Dogecoin', rank: 8, basePrice: 0.1234, line: 0.1250, impliedMove: 7.2, iv: 75.8, volume24h: 890000000 },
    { id: 9, symbol: 'TRX', name: 'TRON', rank: 9, basePrice: 0.0876, line: 0.0880, impliedMove: 4.5, iv: 55.2, volume24h: 420000000 },
    { id: 10, symbol: 'TON', name: 'Toncoin', rank: 10, basePrice: 5.67, line: 5.70, impliedMove: 5.5, iv: 60.5, volume24h: 320000000 },
    { id: 11, symbol: 'LINK', name: 'Chainlink', rank: 11, basePrice: 13.45, line: 13.50, impliedMove: 6.8, iv: 65.3, volume24h: 680000000 },
    { id: 12, symbol: 'AVAX', name: 'Avalanche', rank: 12, basePrice: 28.90, line: 29.00, impliedMove: 7.1, iv: 71.2, volume24h: 480000000 },
    { id: 13, symbol: 'MATIC', name: 'Polygon', rank: 13, basePrice: 0.7234, line: 0.7300, impliedMove: 6.2, iv: 63.8, volume24h: 390000000 },
    { id: 14, symbol: 'DOT', name: 'Polkadot', rank: 14, basePrice: 6.78, line: 6.80, impliedMove: 5.9, iv: 61.5, volume24h: 280000000 },
    { id: 15, symbol: 'UNI', name: 'Uniswap', rank: 15, basePrice: 7.89, line: 7.95, impliedMove: 6.5, iv: 67.2, volume24h: 250000000 },
    { id: 16, symbol: 'ATOM', name: 'Cosmos', rank: 16, basePrice: 9.12, line: 9.20, impliedMove: 6.0, iv: 62.8, volume24h: 180000000 },
    { id: 17, symbol: 'LTC', name: 'Litecoin', rank: 17, basePrice: 85.40, line: 86.00, impliedMove: 4.2, iv: 48.5, volume24h: 520000000 },
    { id: 18, symbol: 'BCH', name: 'Bitcoin Cash', rank: 18, basePrice: 425.60, line: 430.00, impliedMove: 5.5, iv: 58.9, volume24h: 340000000 },
    { id: 19, symbol: 'NEAR', name: 'NEAR Protocol', rank: 19, basePrice: 5.23, line: 5.30, impliedMove: 7.8, iv: 73.5, volume24h: 290000000 },
    { id: 20, symbol: 'APT', name: 'Aptos', rank: 20, basePrice: 8.45, line: 8.50, impliedMove: 8.2, iv: 76.8, volume24h: 210000000 },
  ];

  const [cryptoData, setCryptoData] = useState(initialCryptoData);

  // Simulate real-time price streaming (WebSocket simulation)
  useEffect(() => {
    const streamInterval = setInterval(() => {
      setCryptoData(prevData => {
        const newData = prevData.map(crypto => {
          // Simulate price changes based on volatility
          const volatilityFactor = crypto.iv / 100;
          const randomChange = (Math.random() - 0.5) * 2 * volatilityFactor * 0.01;
          const newPrice = crypto.basePrice * (1 + randomChange);
          
          // Track price changes for flash effect
          const priceChange = newPrice - (streamingPrices[crypto.symbol] || crypto.basePrice);
          
          if (priceChange !== 0) {
            setPriceFlashes(prev => ({
              ...prev,
              [crypto.symbol]: priceChange > 0 ? 'up' : 'down'
            }));
            
            // Clear flash after animation
            setTimeout(() => {
              setPriceFlashes(prev => {
                const updated = { ...prev };
                delete updated[crypto.symbol];
                return updated;
              });
            }, 500);
          }

          return {
            ...crypto,
            basePrice: newPrice
          };
        });

        // Update streaming prices state
        const pricesMap = {};
        newData.forEach(crypto => {
          pricesMap[crypto.symbol] = crypto.basePrice;
        });
        setStreamingPrices(pricesMap);

        return newData;
      });
    }, 1000); // Update every second (mimics WebSocket stream)

    return () => clearInterval(streamInterval);
  }, [streamingPrices]);

  const friendsBets = [
    { id: 1, user: 'CryptoWhale', avatar: '🐋', picks: [
      { symbol: 'BTC', prediction: 'Over', line: 63500.00 },
      { symbol: 'ETH', prediction: 'Over', line: 3150.00 }
    ], amount: 100, potential: 250, status: 'pending', time: '15m ago' },
    { id: 2, user: 'DeFiDegen', avatar: '🦍', picks: [
      { symbol: 'SOL', prediction: 'Over', line: 145.00 },
      { symbol: 'AVAX', prediction: 'Over', line: 29.00 },
      { symbol: 'LINK', prediction: 'Over', line: 13.50 }
    ], amount: 50, potential: 150, status: 'winning', time: '1h ago' },
    { id: 3, user: 'SatoshiFan', avatar: '💎', picks: [
      { symbol: 'BTC', prediction: 'Over', line: 63500.00 },
      { symbol: 'XRP', prediction: 'Under', line: 0.5250 }
    ], amount: 25, potential: 62.50, status: 'pending', time: '2h ago' },
    { id: 4, user: 'AltcoinAlpha', avatar: '🚀', picks: [
      { symbol: 'DOGE', prediction: 'Over', line: 0.1250 },
      { symbol: 'MATIC', prediction: 'Over', line: 0.7300 },
      { symbol: 'UNI', prediction: 'Under', line: 7.95 },
      { symbol: 'ATOM', prediction: 'Over', line: 9.20 }
    ], amount: 75, potential: 750, status: 'losing', time: '4h ago' },
  ];

  const addPick = (crypto, prediction) => {
    const existingPick = selectedPicks.find(p => p.id === crypto.id);
    if (existingPick) {
      if (existingPick.prediction === prediction) {
        setSelectedPicks(selectedPicks.filter(p => p.id !== crypto.id));
      } else {
        setSelectedPicks(selectedPicks.map(p => 
          p.id === crypto.id ? { ...crypto, prediction, currentPrice: crypto.basePrice } : p
        ));
      }
    } else {
      setSelectedPicks([...selectedPicks, { ...crypto, prediction, currentPrice: crypto.basePrice }]);
    }
  };

  const removePick = (id) => {
    setSelectedPicks(selectedPicks.filter(p => p.id !== id));
  };

  const calculatePayout = () => {
    return selectedPicks.reduce((totalMultiplier, pick) => {
      const multiplier = pick.prediction.includes('2x') ? 2 :
               pick.prediction.includes('4x') ? 4 :
               pick.prediction.includes('10x') ? 10 : 1;
      return totalMultiplier * multiplier;
    }, 1) * betAmount;
  };

  const getPrediction = (cryptoId) => {
    const pick = selectedPicks.find(p => p.id === cryptoId);
    return pick?.prediction;
  };

  const formatPrice = (price) => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${(volume / 1e3).toFixed(2)}K`;
  };

  const filteredCrypto = cryptoData.filter(crypto => 
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="text-purple-400" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-white">CryptoPicks</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">LIVE STREAMING</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 rounded-lg">
              <span className="text-white font-semibold">Balance: $2,500.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex space-x-2 bg-black/40 backdrop-blur-md rounded-lg p-1">
          <button
            onClick={() => setActiveTab('picks')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'picks'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Over Unders
          </button>
          <button
            onClick={() => setActiveTab('arena')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'arena'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            The Arena
          </button>
          <button
            onClick={() => setActiveTab('betslip')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all relative ${
              activeTab === 'betslip'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Live Bets
            {selectedPicks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedPicks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'social'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Social Feed
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Live Markets Tab */}
        {activeTab === 'picks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Top 500 Cryptocurrencies</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search crypto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            {filteredCrypto.map(crypto => {
              const prediction = getPrediction(crypto.id);
              const flash = priceFlashes[crypto.symbol];
              return (
                <div key={crypto.id} className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-400">#{crypto.rank}</span>
                        <span className="text-xl font-bold text-white">{crypto.symbol}</span>
                        <span className="text-sm text-gray-400">{crypto.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <div>
                          <span className="text-xs text-gray-400">Live Price: </span>
                          <span className={`text-sm font-mono font-bold transition-colors duration-300 ${
                            flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : 'text-white'
                          }`}>
                            {formatPrice(crypto.basePrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">24h Vol: </span>
                          <span className="text-sm text-purple-300">{formatVolume(crypto.volume24h)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-3 text-center text-white font-bold">Overs</div>
                        {['2x', '4x', '10x'].map(multiplier => (
                          <button
                            key={`over-${multiplier}`}
                            onClick={() => addPick(crypto, `Over ${multiplier}`)}
                            className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                              prediction === `Over ${multiplier}`
                                ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                                : 'bg-green-600/20 text-green-300 hover:bg-green-600/30'
                            }`}
                          >
                            <TrendingUp className="inline mr-1" size={16} />
                            Over ${(crypto.basePrice * (1 + (multiplier === '2x' ? 0.02 : multiplier === '4x' ? 0.05 : 0.06))).toFixed(2)}, {multiplier}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['2x', '4x', '10x'].map(multiplier => (
                          <button
                            key={`under-${multiplier}`}
                            onClick={() => addPick(crypto, `Under ${multiplier}`)}
                            className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                              prediction === `Under ${multiplier}`
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                                : 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                            }`}
                          >
                            <TrendingDown className="inline mr-1" size={16} />
                            Under ${(crypto.basePrice * (1 - (multiplier === '2x' ? 0.02 : multiplier === '4x' ? 0.05 : 0.06))).toFixed(2)}, {multiplier}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bet Slip Tab */}
        {activeTab === 'betslip' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Your Bet Slip</h2>
            
            {selectedPicks.length === 0 ? (
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-12 text-center border border-purple-500/20">
                <Plus className="mx-auto text-gray-500 mb-4" size={48} />
                <p className="text-gray-400 text-lg">No picks selected yet</p>
                <p className="text-gray-500 text-sm mt-2">Go to Live Markets to start building your entry</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {selectedPicks.map(pick => {
                    const currentPrice = streamingPrices[pick.symbol] || pick.basePrice;
                    const flash = priceFlashes[pick.symbol];
                    return (
                      <div key={pick.id} className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-white">{pick.symbol}</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                pick.prediction === 'Over'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-red-600 text-white'
                              }`}>
                                {pick.prediction === 'Over' ? <TrendingUp className="inline" size={14} /> : <TrendingDown className="inline" size={14} />}
                                {' '}{pick.prediction} {formatPrice(pick.line)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                              <div>
                                <span className="text-xs text-gray-400">Live: </span>
                                <span className={`text-sm font-mono font-bold transition-colors duration-300 ${
                                  flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : 'text-white'
                                }`}>
                                  {formatPrice(currentPrice)}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400">Entry: </span>
                                <span className="text-sm text-purple-300">{formatPrice(pick.currentPrice)}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removePick(pick.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-purple-500/20">
                  <div className="mb-4">
                    <label className="text-white font-semibold block mb-2">Entry Amount</label>
                    <div className="flex items-center space-x-2">
                      {[10, 25, 50, 100].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            betAmount === amount
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30'
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="w-full mt-3 px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white font-semibold"
                      placeholder="Custom amount"
                    />
                  </div>

                  <div className="border-t border-purple-500/20 pt-4 space-y-2">
                    <div className="flex justify-between text-gray-300">
                      <span>Number of Picks:</span>
                      <span className="font-semibold">{selectedPicks.length}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Entry Amount:</span>
                      <span className="font-semibold">${betAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-purple-500/20">
                      <span>Potential Payout:</span>
                      <span className="text-green-400">${calculatePayout()}</span>
                    </div>
                  </div>

                  <button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                    <Check className="inline mr-2" size={20} />
                    Submit Entry
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Social Feed Tab */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Community Picks</h2>
            {friendsBets.map(bet => (
              <div key={bet.id} className="bg-black/40 backdrop-blur-md rounded-lg p-5 border border-purple-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{bet.avatar}</div>
                    <div>
                      <p className="font-bold text-white">{bet.user}</p>
                      <p className="text-sm text-gray-400">{bet.time}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    bet.status === 'winning' ? 'bg-green-600 text-white' :
                    bet.status === 'losing' ? 'bg-red-600 text-white' :
                    'bg-yellow-600 text-white'
                  }`}>
                    {bet.status.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {bet.picks.map((pick, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="font-bold text-white">{pick.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        pick.prediction === 'Over'
                          ? 'bg-green-600/30 text-green-300'
                          : 'bg-red-600/30 text-red-300'
                      }`}>
                        {pick.prediction === 'Over' ? '↑' : '↓'} {pick.prediction} {formatPrice(pick.line)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                  <div>
                    <p className="text-sm text-gray-400">Entry</p>
                    <p className="font-bold text-white">${bet.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Potential Win</p>
                    <p className="font-bold text-green-400">${bet.potential}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoPrizePicks;