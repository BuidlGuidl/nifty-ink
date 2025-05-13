type TokenAmountInputProps = {
  value: string;
  onChange: (value: string) => void;
  tokenSymbol?: string;
  balance: string;
};

export const TokenAmountInput = ({ value, onChange, tokenSymbol = "ETH", balance }: TokenAmountInputProps) => {
  // Handle preset amount clicks by adding to the current amount
  const handlePresetAmountClick = (amountToAdd: string) => {
    const currentAmount = parseFloat(value) || 0;
    const addAmount = parseFloat(amountToAdd);
    const newAmount = currentAmount + addAmount;
    const roundedAmount = parseFloat(newAmount.toFixed(10));
    onChange(roundedAmount.toString());
  };

  // Handle max click by setting to max balance minus a small buffer
  const handleMaxClick = () => {
    if (balance) {
      const maxBuffer = 0.0000015;

      const maxAmount = parseFloat(balance);
      // Subtract buffer amount to avoid "insufficient funds" errors
      const bufferAmount = maxAmount * maxBuffer;
      const safeMaxAmount = maxAmount - bufferAmount;
      // Ensure we don't go below zero
      const finalAmount = Math.max(0, safeMaxAmount);
      onChange(finalAmount.toFixed(10));
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full mb-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-base-200 w-full px-4 py-4 text-3xl font-bold text-left rounded-xl focus:outline-none"
          placeholder="0.0"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="flex items-center gap-2 bg-base-100 border border-gray-200 rounded-lg px-3 py-1.5 z-10">
            <span className="font-semibold">{tokenSymbol}</span>
          </div>
        </div>
      </div>

      <div className="flex w-full gap-2 mb-2">
        <button
          onClick={() => handlePresetAmountClick("0.001")}
          className="btn btn-sm flex-1 rounded-lg border-gray-200"
        >
          0.001 {tokenSymbol}
        </button>
        <button
          onClick={() => handlePresetAmountClick("0.01")}
          className="btn btn-sm flex-1 rounded-lg border-gray-200"
        >
          0.01 {tokenSymbol}
        </button>
        <button onClick={() => handlePresetAmountClick("0.1")} className="btn btn-sm flex-1 rounded-lg border-gray-200">
          0.1 {tokenSymbol}
        </button>
        <button onClick={handleMaxClick} className="btn btn-sm flex-1 rounded-lg border-gray-200">
          Max
        </button>
      </div>
    </div>
  );
};
