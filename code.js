figma.showUI(__html__, { width: 350, height: 450 });

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

async function fetchContinentsAndCountries() {
  try {
    const data = await fetchData('https://api.jsonsilo.com/public/b5eacb57-3598-47af-972f-f82c774bcbf3');
    const continentsAndCountries = extractContinentsAndCountries(data);
    return continentsAndCountries;
  } catch (error) {
    console.error('Error fetching continents and countries:', error);
    figma.notify(`Error: ${error.message}`);
    return {};
  }
}

function extractContinentsAndCountries(data) {
  console.log('Extracting continents and countries from:', data);
  const result = {
    continents: [],
    countries: []
  };

  data.data.forEach(item => {
    if (!result.continents.includes(item.continent)) {
      result.continents.push(item.continent);
    }
    result.countries.push({
      name: item.country,
      continent: item.continent
    });
  });

  console.log('Extracted data:', result);
  return result;
}

figma.ui.onmessage = async (msg) => {
  console.log('Received message:', msg);

  if (msg.type === 'load-data') {
    try {
      const data = await fetchContinentsAndCountries();
      figma.ui.postMessage({ type: 'populate-dropdowns', data });
    } catch (error) {
      console.error('Error loading data:', error);
      figma.notify(`Error: ${error.message}`);
    }
  }
  
  if (msg.type === 'openExternalUrl') {
    figma.notify('Opening external link...');
    figma.openExternal(msg.url);
  }

  if (msg.type === 'generate-names') {
    console.log('Generating names:', msg.options);
    const selection = figma.currentPage.selection;
    const textNodes = selection.filter(node => node.type === 'TEXT');
    console.log('Selected text nodes:', textNodes.length);

    if (textNodes.length === 0) {
      figma.notify('Please select at least one text layer.');
      return;
    }

    try {
      const data = await fetchData('https://api.jsonsilo.com/public/b5eacb57-3598-47af-972f-f82c774bcbf3');
      console.log('Complete data for names:', data);

      let filteredData = data.data;
      if (msg.options.continent !== 'random') {
        filteredData = filteredData.filter(item => item.continent === msg.options.continent);
      }
      if (msg.options.country !== 'random') {
        filteredData = filteredData.filter(item => item.country === msg.options.country);
      }

      if (filteredData.length === 0) {
        throw new Error('No data found for the selected options');
      }

      for (const node of textNodes) {
        try {
          await figma.loadFontAsync(node.fontName);
          const randomItem = filteredData[Math.floor(Math.random() * filteredData.length)];
          let name;
          switch (msg.options.nameType) {
            case 'first':
              name = randomItem.first_names[Math.floor(Math.random() * randomItem.first_names.length)];
              break;
            case 'last':
              name = randomItem.last_names[Math.floor(Math.random() * randomItem.last_names.length)];
              break;
            case 'full':
            default:
              const firstName = randomItem.first_names[Math.floor(Math.random() * randomItem.first_names.length)];
              const lastName = randomItem.last_names[Math.floor(Math.random() * randomItem.last_names.length)];
              name = `${firstName} ${lastName}`;
              break;
          }
          console.log(`Setting name "${name}" for node:`, node.id);
          node.characters = name;
        } catch (error) {
          console.error(`Error setting name for node ${node.id}:`, error);
        }
      }

      figma.notify(`Generated names for ${textNodes.length} text layer(s)`);
    } catch (error) {
      console.error('Error generating names:', error);
      figma.notify(`Error: ${error.message}`);
    }
  }

  if (msg.type === 'generate-phones') {
    console.log('Generating phone numbers:', msg.options);
    const selection = figma.currentPage.selection;
    const textNodes = selection.filter(node => node.type === 'TEXT');
    console.log('Selected text nodes:', textNodes.length);

    if (textNodes.length === 0) {
      figma.notify('Please select at least one text layer.');
      return;
    }

    try {
      const data = await fetchData('https://api.jsonsilo.com/public/9336dbc3-d397-404b-8b2c-e0b55bcae392');
      console.log('Complete data for phone numbers:', data);

      let filteredData = data.data.flatMap(continent => continent.countries);
      if (msg.options.continent !== 'random') {
        const continentData = data.data.find(item => item.continent === msg.options.continent);
        filteredData = continentData ? continentData.countries : [];
      }
      if (msg.options.country !== 'random') {
        filteredData = filteredData.filter(item => item.country === msg.options.country);
      }

      if (filteredData.length === 0) {
        throw new Error('No data found for the selected options');
      }

      for (const node of textNodes) {
        try {
          await figma.loadFontAsync(node.fontName);
          const randomItem = filteredData[Math.floor(Math.random() * filteredData.length)];
          const randomNumber = randomItem.numbers[Math.floor(Math.random() * randomItem.numbers.length)];
          let phoneNumber = randomNumber;
          if (msg.options.includeExtension) {
            phoneNumber = `+${randomItem.extension} ${phoneNumber}`;
          }
          console.log(`Setting phone number "${phoneNumber}" for node:`, node.id);
          node.characters = phoneNumber;
        } catch (error) {
          console.error(`Error setting phone number for node ${node.id}:`, error);
        }
      }

      figma.notify(`Generated phone numbers for ${textNodes.length} text layer(s)`);
    } catch (error) {
      console.error('Error generating phone numbers:', error);
      figma.notify(`Error: ${error.message}`);
    }
  }

  if (msg.type === 'generate-emails') {
    console.log('Generating emails');
    const selection = figma.currentPage.selection;
    const textNodes = selection.filter(node => node.type === 'TEXT');
    console.log('Selected text nodes:', textNodes.length);

    if (textNodes.length === 0) {
      figma.notify('Please select at least one text layer.');
      return;
    }

    try {
      for (const node of textNodes) {
        try {
          await figma.loadFontAsync(node.fontName);
          const randomEmail = msg.data[Math.floor(Math.random() * msg.data.length)];
          console.log(`Setting email "${randomEmail}" for node:`, node.id);
          node.characters = randomEmail;
        } catch (error) {
          console.error(`Error setting email for node ${node.id}:`, error);
        }
      }

      figma.notify(`Generated emails for ${textNodes.length} text layer(s)`);
    } catch (error) {
      console.error('Error generating emails:', error);
      figma.notify(`Error: ${error.message}`);
    }
  }

  if (msg.type === 'generate-usernames') {
    console.log('Generating usernames');
    const selection = figma.currentPage.selection;
    const textNodes = selection.filter(node => node.type === 'TEXT');
    console.log('Selected text nodes:', textNodes.length);

    if (textNodes.length === 0) {
      figma.notify('Please select at least one text layer.');
      return;
    }

    try {
      for (const node of textNodes) {
        try {
          await figma.loadFontAsync(node.fontName);
          const randomUsername = msg.data[Math.floor(Math.random() * msg.data.length)];
          console.log(`Setting username "${randomUsername}" for node:`, node.id);
          node.characters = randomUsername;
        } catch (error) {
          console.error(`Error setting username for node ${node.id}:`, error);
        }
      }

      figma.notify(`Generated usernames for ${textNodes.length} text layer(s)`);
    } catch (error) {
      console.error('Error generating usernames:', error);
      figma.notify(`Error: ${error.message}`);
    }
  }

  if (msg.type === 'generate-numbers') {
    console.log('Generating random numbers:', msg.options);
    const selection = figma.currentPage.selection;
    const textNodes = selection.filter(node => node.type === 'TEXT');
    console.log('Selected text nodes:', textNodes.length);

    if (textNodes.length === 0) {
      figma.notify('Please select at least one text layer.');
      return;
    }

    try {
      const digits = msg.options.digits;
      const replaceNumericOnly = msg.options.replaceNumericOnly;

      for (const node of textNodes) {
        try {
          await figma.loadFontAsync(node.fontName);
          const min = Math.pow(10, digits - 1);
          const max = Math.pow(10, digits) - 1;
          const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
          console.log(`Generated random number: ${randomNumber}`);

          if (replaceNumericOnly) {
            const newText = node.characters.replace(/\d+/g, match => {
              return randomNumber.toString().padStart(match.length, '0');
            });
            node.characters = newText;
          } else {
            node.characters = randomNumber.toString();
          }

          console.log(`Set text for node ${node.id}: ${node.characters}`);
        } catch (error) {
          console.error(`Error setting number for node ${node.id}:`, error);
        }
      }

      figma.notify(`Generated random numbers for ${textNodes.length} text layer(s)`);
    } catch (error) {
      console.error('Error generating random numbers:', error);
      figma.notify(`Error: ${error.message}`);
    }
  }
};

console.log('Plugin code loaded and running');