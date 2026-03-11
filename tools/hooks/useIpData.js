import { useEffect, useState } from 'react';

const IP2_LOCATION_API_KEY = process.env.GATSBY_IP2_LOCATION_API_KEY;

const useIpData = props => {
  const { disabled = false } = props || {};
  const [ipData, setIpData] = useState();

  const getIp = async () => {
    try {
      const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${IP2_LOCATION_API_KEY}`, {
        method: 'GET'
      });

      const data = await response.json();

      setIpData(data);
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (!disabled) getIp();
  }, [disabled]);

  return ipData;
};

export default useIpData;
