figma.showUI(__html__, { width: 350, height: 488 });

async function fetchData(url) {
  console.log(`Fetching data from ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log('Fetched data:', data);
  return data;
}

function extractContinentsAndCountries(data) {
  console.log('Extracting continents and countries from:', data);
  const result = {};

  data.data.forEach(item => {
    if (!result[item.continent]) {
      result[item.continent] = [];
    }
    result[item.continent].push(item.country);
  });

  console.log('Extracted data:', result);
  return result;
}

async function loadContinents() {
  try {
    const data = await fetchData('https://api.jsonsilo.com/public/b5eacb57-3598-47af-972f-f82c774bcbf3');
    const continentsAndCountries = extractContinentsAndCountries(data);
    const continents = Object.keys(continentsAndCountries);
    console.log('Extracted continents:', continents);
    figma.ui.postMessage({ type: 'populate-continents', continents });
  } catch (error) {
    console.error('Error fetching continents:', error);
    figma.notify(`Error: ${error.message}`);
  }
}

// Load continents when the plugin starts
loadContinents();

figma.ui.onmessage = async (msg) => {
  console.log('Received message:', msg);

  if (msg.type === 'load-countries') {
    console.log('Loading countries for continent:', msg.continent);
    try {
      const data = await fetchData('https://api.jsonsilo.com/public/b5eacb57-3598-47af-972f-f82c774bcbf3');
      const continentsAndCountries = extractContinentsAndCountries(data);
      const countries = continentsAndCountries[msg.continent] || [];
      console.log('Extracted countries:', countries);
      figma.ui.postMessage({ type: 'populate-countries', countries });
    } catch (error) {
      console.error('Error fetching countries:', error);
      figma.notify(`Error: ${error.message}`);
    }
  }

  if (msg.type === 'generate-data') {
    console.log('Generating data for:', msg.dataType, msg.continent, msg.country, msg.nameType);
    const selection = figma.currentPage.selection;
    const textNodes = selection.filter(node => node.type === 'TEXT');
    console.log('Selected text nodes:', textNodes.length);

    if (textNodes.length === 0) {
      figma.notify('Please select at least one text layer.');
      return;
    }

    try {
      let data;
      let dataType = msg.dataType;

      if (dataType === 'names') {
        data = await fetchData('https://api.jsonsilo.com/public/b5eacb57-3598-47af-972f-f82c774bcbf3');
        console.log('Complete data for names:', data);

        let countryData;

        if (msg.continent === "" || msg.country === "") {
          // Random selection
          countryData = data.data[Math.floor(Math.random() * data.data.length)];
        } else {
          countryData = data.data.find(item => item.continent === msg.continent && item.country === msg.country);
        }

        if (!countryData) {
          throw new Error(`Country data not found for ${msg.continent}, ${msg.country}`);
        }

        console.log('Country data:', countryData);

        const firstNames = countryData.first_names;
        const lastNames = countryData.last_names;
        if (!firstNames || !lastNames) {
          throw new Error(`No names found for ${countryData.country}`);
        }

        console.log('First names:', firstNames);
        console.log('Last names:', lastNames);

        function getRandomName(names) {
          return names[Math.floor(Math.random() * names.length)];
        }

        for (const node of textNodes) {
          try {
            await figma.loadFontAsync(node.fontName);
            let name;
            switch (msg.nameType) {
              case 'first':
                name = getRandomName(firstNames);
                break;
              case 'last':
                name = getRandomName(lastNames);
                break;
              case 'full':
                name = `${getRandomName(firstNames)} ${getRandomName(lastNames)}`;
                break;
            }
            console.log(`Setting name "${name}" for node:`, node.id);
            node.characters = name;
          } catch (error) {
            console.error(`Error setting name for node ${node.id}:`, error);
          }
        }
      } else if (dataType === 'phoneNumbers') {
        data = await fetchData('https://api.jsonsilo.com/public/9336dbc3-d397-404b-8b2c-e0b55bcae392');
        console.log('Complete data for phone numbers:', data);

        let countryData;

        if (msg.continent === "" || msg.country === "") {
          // Random selection
          const randomContinent = data.data[Math.floor(Math.random() * data.data.length)];
          countryData = randomContinent.countries[Math.floor(Math.random() * randomContinent.countries.length)];
        } else {
          const continentData = data.data.find(item => item.continent === msg.continent);
          console.log('Extracted continentData:', continentData);
          if (continentData) {
            countryData = continentData.countries.find(country => country.country === msg.country);
            console.log('Extracted countryData:', countryData);
          }
        }

        if (!countryData) {
          throw new Error(`Country data not found for ${msg.continent}, ${msg.country}`);
        }

        console.log('Country data:', countryData);

        const phoneNumbers = countryData.numbers;
        if (!phoneNumbers) {
          throw new Error(`No phone numbers found for ${countryData.country}`);
        }

        console.log('Phone numbers:', phoneNumbers);

        function getRandomPhoneNumber(phoneNumbers) {
          const randomPhoneNumber = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
          return msg.includeExtension ? `+${countryData.extension} ${randomPhoneNumber}` : randomPhoneNumber;
        }

        for (const node of textNodes) {
          try {
            await figma.loadFontAsync(node.fontName);
            const phoneNumber = getRandomPhoneNumber(phoneNumbers);
            console.log(`Setting phone number "${phoneNumber}" for node:`, node.id);
            node.characters = phoneNumber;
          } catch (error) {
            console.error(`Error setting phone number for node ${node.id}:`, error);
          }
        }
      }

      figma.notify(`Generated data for ${textNodes.length} text layer(s)`);
    } catch (error) {
      console.error('Error generating data:', error);
      figma.notify(`Error: ${error.message}`);
    }
  }
};

console.log('Plugin code loaded and running');