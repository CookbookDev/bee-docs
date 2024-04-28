import { useState } from 'react';

export default function DepthCalc() {
  const [depth, setDepth] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const [details, setDetails] = useState(null);




  const depthToVolume = {
    24: "44.21 GB",
    25: "102.78 GB",
    26: "225.86 GB",
    27: "480.43 GB",
    28: "1.00 TB",
    29: "2.06 TB",
    30: "4.20 TB",
    31: "8.52 TB",
    32: "17.20 TB",
    33: "34.63 TB",
    34: "69.58 TB",
    35: "139.63 TB",
    36: "279.91 TB",
    37: "560.73 TB",
    38: "1.12 PB",
    39: "2.25 PB",
    40: "4.50 PB",
    41: "9.00 PB",
  };

  const handleFetchPriceAndValidate = async () => {
    setDetails(null);
    setLoading(true);
    setResult("");
    setErrors({});
    try {
      const response = await fetch("https://api.swarmscan.io/v1/events/storage-price-oracle/price-update");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data.events && data.events.length > 0) {
        const newPrice = data.events[0].data.price;
        setPrice(newPrice);
        validateInputs(depth.trim(), amount.trim(), newPrice);
      } else {
        setResult("No price update available");
      }
    } catch (error) {
      setResult(`Error: ${error.message}`);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  }

  const validateInputs = (cleanedDepth, cleanedAmount, latestPrice) => {
    const depthValue = Number(cleanedDepth);
    const amountValue = Number(cleanedAmount);
    let localErrors = {};

    if (!Number.isInteger(depthValue) || !(depthValue >= 24)) {
      localErrors.depth = "Depth must be a whole number greater than or equal to 24.";
    }

    const minAmount = latestPrice * 17280;
    if (!Number.isInteger(amountValue) || amountValue < minAmount) {
      localErrors.amount = `Amount must be a positive whole number and at least ${minAmount} PLUR.`;
    }

    if (Object.keys(localErrors).length === 0) {
      const volume = depthToVolume[cleanedDepth] || "Unavailable volume";
      const storageTimeInSeconds = (amountValue / latestPrice) * 5;
      const formattedTime = formatDuration(storageTimeInSeconds);
      const costInPLUR = (2 ** depthValue) * amountValue;
      const costInxBZZ = costInPLUR / 1e16;
      setResult(`A depth of ${cleanedDepth} allows for storage of ${volume} of data. For an amount value of ${amountValue} it can be stored for ${formattedTime} at a cost of ${costInxBZZ.toFixed(2)} xBZZ.`);
      setDetails({
        Depth: cleanedDepth,
        Volume: volume,
        "Storage duration": formattedTime,
        Cost: `${costInxBZZ.toFixed(2)} xBZZ`
      });
    } else {
      setErrors(localErrors);
      setDetails(null);
    }
  }

  const formatDuration = (seconds) => {
    const secondsPerDay = 86400;
    const secondsPerHour = 3600;

    if (seconds > 365 * secondsPerDay) {
      return `${(seconds / (365 * secondsPerDay)).toFixed(2)} years`;
    } else if (seconds > 7 * secondsPerDay) {
      return `${(seconds / (7 * secondsPerDay)).toFixed(2)} weeks`;
    } else if (seconds > secondsPerDay) {
      return `${(seconds / secondsPerDay).toFixed(2)} days`;
    } else if (seconds > secondsPerHour) {
      return `${(seconds / secondsPerHour).toFixed(2)} hours`;
    } else {
      return `${seconds.toFixed(2)} seconds`;
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', width: '50%', margin: '0 auto',  boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '10px' }}>Depth & Amount to Time & Volume Calculator</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          placeholder="Input batch depth"
          value={depth}
          style={{ display: 'block', marginBottom: '5px', padding: '8px' }}
          onChange={e => setDepth(e.target.value)}
        />
        {errors.depth && <div style={{ color: 'red', marginBottom: '10px' }}>{errors.depth}</div>}
        <input
          placeholder="Input amount"
          value={amount}
          style={{ display: 'block', marginBottom: '5px', padding: '8px' }}
          onChange={e => setAmount(e.target.value)}
        />
        {errors.amount && <div style={{ color: 'red', marginBottom: '10px' }}>{errors.amount}</div>}
        <button onClick={handleFetchPriceAndValidate} disabled={loading} style={{ padding: '10px 15px', cursor: 'pointer' }}>
          {loading ? 'Loading...' : 'Calculate'}
        </button>
      </div>
      {result && <div style={{ color: errors.general ? 'red' : '', marginBottom: '20px', fontSize: '16px' }}>
        {result}
      </div>}
      {details && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', border: '1px solid' }}>Field</th>
              <th style={{ textAlign: 'left', padding: '8px', border: '1px solid' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(details).map(([key, value]) => (
              <tr key={key}>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid' }}>{key}</td>
                <td style={{ padding: '8px', border: '1px solid' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}