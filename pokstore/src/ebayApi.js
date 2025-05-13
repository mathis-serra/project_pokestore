const EBAY_APP_ID = 'mathisSe-pokestat-SBX-00e923dd1-a9a66440';

export const fetchEbayAveragePrice = async (query) => {
    const url = `https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsByKeywords&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=${EBAY_APP_ID}&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&paginationInput.entriesPerPage=5&keywords=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    const items = json.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item;

    if (!items) return null;

    const prices = items.map(item =>
      parseFloat(item.sellingStatus[0].currentPrice[0].__value__)
    );

    const average = prices.reduce((a, b) => a + b, 0) / prices.length;

    return parseFloat(average.toFixed(2));
  } catch (error) {
    console.error('Erreur eBay:', error);
    return null;
  }
};