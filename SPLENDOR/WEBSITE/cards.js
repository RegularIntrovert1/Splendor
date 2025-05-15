// Use existing Appwrite client
const databases = new Appwrite.Databases(window.client);

// Database and collection IDs (DO NOT SHAR))
const DATABASE_ID = '6816dc7f00195dd533bf';
const COLLECTION_ID = '6816de0600052ed834e4';


const COLOR_PALETTE = {
  1: 'rgb(46, 213, 115)',
  2: 'rgb(52, 152, 219)',
  3: 'rgb(231, 76, 60)',
  4: 'rgb(241, 196, 15)', 
  5: 'rgb(155, 89, 182)',
  6: 'rgb(230, 126, 34)',
  7: 'rgb(26, 188, 156)',
  8: 'rgb(236, 240, 241)',
  9: 'rgb(149, 165, 166)',
  10: 'rgb(243, 156, 18)'
};


async function initializeCards() {
  console.log('Initializing cards...');
  try {

    const user = await window.account.get();
    console.log('User:', user);
    

    console.log('Loading cards...');
    await loadCards(user.$id);
  } catch (error) {
    console.error('Error initializing cards:', error);
    if (error.code === 401) {
      window.location.href = 'Login.html';
    }
  }
}


async function loadCards(userId) {
  try {
    console.log('Fetching cards for user:', userId);

    const userCards = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Appwrite.Query.equal('userId', userId)
    ], 100, 0, undefined, undefined, [
      'title', 'description', 'userId', 'visibility', 'last_modified', 'createdD', 'tag_Text', 'tag_Colors' // Only fetch these fields
    ]);

    console.log('User cards:', userCards);

    const cardsContainer = document.getElementById('cardsContainer');
    if (!cardsContainer) {
      console.error('Cards container not found!');
      return;
    }
    
    cardsContainer.innerHTML = '';


    const uniqueTags = new Map(); 
    userCards.documents.forEach(card => {
      const tagTexts = card.tag_Text ? card.tag_Text.split(',').filter(t => t.trim()) : [];
      const tagColors = card.tag_Colors ? card.tag_Colors.split(',').filter(c => c.trim()) : [];
      
      tagTexts.forEach((text, index) => {
        if (!uniqueTags.has(text)) {
          uniqueTags.set(text, tagColors[index] || '1');
        }
      });
    });

    
    const userTagsContainer = document.getElementById('userTags');
    if (userTagsContainer) {
      userTagsContainer.innerHTML = '';

      const allTagElement = document.createElement('span');
      allTagElement.className = 'sidebar-tag all-tag active';
      allTagElement.textContent = 'All';
      
      
      allTagElement.addEventListener('click', () => {
        
        document.querySelectorAll('.sidebar-tag').forEach(tag => {
          tag.classList.remove('active');
        });
        
        allTagElement.classList.add('active');
        
        document.querySelectorAll('.card').forEach(card => {
          if (card.style.display === 'none') {
            card.style.display = '';
            card.classList.add('showing');
            setTimeout(() => {
              card.classList.remove('showing');
            }, 300);
          }
        });
      });
      
      userTagsContainer.appendChild(allTagElement);

      
      uniqueTags.forEach((colorChoice, tagText) => {
        const color = COLOR_PALETTE[parseInt(colorChoice) || 1];
        const bgColor = color.replace('rgb', 'rgba').replace(')', ', 0.92)');
        
        const tagElement = document.createElement('span');
        tagElement.className = 'sidebar-tag';
        tagElement.textContent = tagText;
        tagElement.style.backgroundColor = bgColor;
        
        
        tagElement.addEventListener('click', () => {
          
          tagElement.classList.toggle('active');
          
          
          allTagElement.classList.remove('active');
          
         
          const activeTags = Array.from(document.querySelectorAll('.sidebar-tag.active'))
            .map(tag => tag.textContent)
            .filter(text => text !== 'All');
          
          
          if (activeTags.length === 0) {
            allTagElement.classList.add('active');
            document.querySelectorAll('.card').forEach(card => {
              if (card.style.display === 'none') {
                card.style.display = '';
                card.classList.add('showing');
                setTimeout(() => {
                  card.classList.remove('showing');
                }, 300);
              }
            });
            return;
          }
          
       
          document.querySelectorAll('.card').forEach(card => {
            const cardTags = Array.from(card.querySelectorAll('.tag'))
              .map(tag => tag.textContent.trim());
            
            const shouldShow = activeTags.some(tag => cardTags.includes(tag));
            
            if (shouldShow && card.style.display === 'none') {
            
              card.style.display = '';
              card.classList.add('showing');
              setTimeout(() => {
                card.classList.remove('showing');
              }, 300);
            } else if (!shouldShow && card.style.display !== 'none') {
              // Hide card with animation
              card.classList.add('hiding');
              setTimeout(() => {
                card.style.display = 'none';
                card.classList.remove('hiding');
              }, 300);
            }
          });
        });
        
        userTagsContainer.appendChild(tagElement);
      });
    }


    const createButton = document.createElement('button');
    createButton.className = 'create-card-button';
    createButton.innerHTML = `
      <span>+</span>
      <p>Create New Project</p>
    `;
    createButton.addEventListener('click', () => {
      window.location.href = 'create_project.html';
    });
    cardsContainer.appendChild(createButton);


    if (userCards.documents.length === 0) {
      console.log('No cards found, creating welcome card...');
      await createWelcomeCard(userId);
      return;
    }

    // Display user's cards
    userCards.documents.forEach(doc => {
      createCardElement(doc, true);
    });
  } catch (error) {
    console.error('Error loading cards:', error);
    alert('Error loading cards. Please check your connection and try again.');
  }
}

// Creates a welcome card
async function createWelcomeCard(userId) {
  try {
    console.log('Creating welcome card for user:', userId);
    const welcomeCard = {
      title: 'Welcome to Splendor! 🎨',
      description: 'Create projects with +, add tags, click to open. Set projects public or private.',
      userId: userId,
      visibility: 'public',
      last_modified: new Date().toISOString(),
      createdD: new Date().toISOString(),
      tag_Text: ['welcome', 'tutorial', 'help'],
      tag_Colors: ['2', '3', '5'] 
    };

    await createCard(welcomeCard);
    console.log('Welcome card created successfully');
    await loadCards(userId);
  } catch (error) {
    console.error('Error creating welcome card:', error);
  }
}

// Creating a new card
async function createCard(cardData) {
  try {
    
    if (!cardData.title || cardData.title.length > 64) {
      throw new Error('Title must be a valid string and no longer than 64 characters');
    }
    if (!cardData.description || cardData.description.length > 100) {
      throw new Error('Description must be a valid string and no longer than 100 characters');
    }


    if (!Array.isArray(cardData.tag_Text) || !Array.isArray(cardData.tag_Colors)) {
      throw new Error('Tags must be provided as arrays before conversion');
    }


    const validatedTags = cardData.tag_Text.map(tag => {
      const tagStr = String(tag).trim();
      if (tagStr.length === 0 || tagStr.length > 20) {
        throw new Error('Each tag must be between 1 and 20 characters');
      }
      return tagStr;
    });


    const validatedColors = cardData.tag_Colors.map(color => String(color).trim());


    const tagTextString = validatedTags.join(',');
    const tagColorsString = validatedColors.join(',');

    console.log('Creating card with validated data:', {
      ...cardData,
      tag_Text: tagTextString,
      tag_Colors: tagColorsString
    });

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      'unique()',
      {
        title: cardData.title,
        description: cardData.description,
        userId: cardData.userId,
        visibility: cardData.visibility,
        last_modified: cardData.last_modified,
        createdD: cardData.createdD,
        tag_Text: tagTextString,
        tag_Colors: tagColorsString
      }
    );
    console.log('Card created:', response);
    return response;
  } catch (error) {
    console.error('Error creating card:', error);
    throw error;
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function createCardElement(cardData, isOwner) {
  console.log('Creating card element:', cardData);
  const card = document.createElement('div');
  card.className = 'card';
  

  const lastModified = new Date(cardData.last_modified);
  const now = new Date();
  const isOld = (now - lastModified) > (7 * 24 * 60 * 60 * 1000);
  
  const formattedDate = lastModified.toLocaleDateString();
  const formattedTime = lastModified.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


  const tagTexts = cardData.tag_Text ? cardData.tag_Text.split(',') : [];
  const tagColors = cardData.tag_Colors ? cardData.tag_Colors.split(',') : [];

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title" data-text="${escapeHtml(cardData.title)}">${escapeHtml(cardData.title)}</div>
      <div class="card-meta">
        <span class="card-visibility ${cardData.visibility === 'public' ? 'public' : cardData.visibility === 'unlisted' ? 'unlisted' : 'private'}">
          ${cardData.visibility === 'public' ? 'Public' : cardData.visibility === 'unlisted' ? 'Unlisted' : 'Private'}
        </span>
        <span class="last-modified ${isOld ? 'old-project' : ''}">
          <div class="modified-date">${formattedDate}</div>
          <div class="modified-time">${formattedTime}</div>
        </span>
      </div>
    </div>
    <div class="card-content">${escapeHtml(cardData.description)}</div>
    <div class="card-preview">Preview Coming Soon</div>
    <div class="card-tags">
      ${tagTexts.map((text, index) => {
        const colorChoice = parseInt(tagColors[index]) || 1;
        const color = COLOR_PALETTE[colorChoice];
        const bgColor = color.replace('rgb', 'rgba').replace(')', ', 0.92)');
        
        return `
          <span class="tag" style="
            background-color: ${escapeHtml(bgColor)};
            color: white;
          ">
            ${escapeHtml(text)}
          </span>
        `;
      }).join('')}
    </div>
    ${isOwner ? `
    <div class="card-actions">
      <button class="rename-button" onclick="renameCard('${escapeHtml(cardData.$id)}')">Rename</button>
      <button class="delete-button" onclick="deleteCard('${escapeHtml(cardData.$id)}')">Delete</button>
    </div>
    ` : ''}
  `;


  const titleElement = card.querySelector('.card-title');
  const updateTitleSize = () => {
    const width = titleElement.scrollWidth;
    titleElement.style.setProperty('--content-width', width);
  };
  

  setTimeout(updateTitleSize, 0);
  

  card.addEventListener('click', (e) => {

    if (e.target.tagName === 'BUTTON') return;
    if (!isOwner) return; 
    window.location.href = `editor.html?projectId=${encodeURIComponent(cardData.$id)}`;
  });

  document.getElementById('cardsContainer').appendChild(card);
}

// Additional input validation for XSS prevention
function validateInput(input, fieldName) {
  const suspiciousPatterns = [
    { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, message: 'contains script tags' },
    { pattern: /javascript:/gi, message: 'contains javascript code' },
    { pattern: /onerror=/gi, message: 'contains invalid attributes' },
    { pattern: /onload=/gi, message: 'contains invalid attributes' },
    { pattern: /onclick=/gi, message: 'contains invalid attributes' }
  ];

  for (const { pattern, message } of suspiciousPatterns) {
    if (pattern.test(input)) {
      throw new Error(`${fieldName} ${message} which are not allowed`);
    }
  }


  if (!input.trim()) {
    throw new Error(`${fieldName} cannot be empty`);
  }

  return input;
}


async function promptWithValidation(message, defaultValue = '', maxLength = null, fieldName = '') {
  while (true) {
    const value = prompt(message, defaultValue);
    if (value === null) return null; 
    
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      alert(`${fieldName || 'This field'} cannot be empty. Please try again.`);
      continue;
    }

    try {
      // Validate for malicious content
      validateInput(trimmedValue, fieldName);


      if (fieldName === 'Title' && trimmedValue.length > 64) {
        alert('Title must be less than 64 characters. Please try again.');
        continue;
      }












      if (maxLength && trimmedValue.length > maxLength) {
        alert(`${fieldName || 'Input'} too long. Maximum ${maxLength} characters allowed. Please try again.`);
        continue;
      }

      return trimmedValue;












    } catch (error) {
      alert(error.message);
      continue;
    }
  }
}



async function promptForVisibility(defaultValue = false) {
  while (true) {
    const choice = prompt('Make this card public? (y/n):', defaultValue ? 'y' : 'n').toLowerCase();
    if (choice === null) return null;
    if (choice === 'y' || choice === 'n') {
      return choice === 'y';
    }
    alert('Please enter y or n');
  }
}


async function promptForTags(defaultValue = '') {
  while (true) { 
    const tagsInput = prompt('Enter tags (comma-separated, max 10 tags) - at least one tag is required:', defaultValue);
    if (tagsInput === null) return null; 
    
    // Don't allow empty input
    if (!tagsInput.trim()) {
      alert('At least one tag is required. Please try again.');
      continue;
    }


    const rawTags = tagsInput.split(',');
    const tagTexts = [];
    const invalidTags = [];


    if (rawTags.filter(tag => tag.trim()).length > 10) {
      alert('Maximum 10 tags allowed. Please reduce the number of tags.');
      continue;
    }


    for (const tag of rawTags) {
      const trimmedTag = tag.trim();
      if (!trimmedTag) continue; 

      try {
        if (trimmedTag.length > 20) { 
          invalidTags.push(`"${trimmedTag}" is too long (maximum 20 characters)`);
          continue;
        }




        const validationResult = validateTagContent(trimmedTag);
        if (validationResult.isValid) {
          tagTexts.push(trimmedTag);
        } else {
          invalidTags.push(`"${trimmedTag}" ${validationResult.message}`);
        }
      } catch (error) {
        invalidTags.push(`"${trimmedTag}": ${error.message}`);
      }
    }


















    if (tagTexts.length === 0) {





      let errorMessage = 'At least one valid tag is required.';
      if (invalidTags.length > 0) {
        errorMessage += '\n\nInvalid tags found:\n' + invalidTags.join('\n');
      }



      alert(errorMessage);
      continue; 
    }

    const tagColors = [];

    // Get colors for valid tags using number selection
    for (const tagText of tagTexts) {
      while (true) { 
        const colorPrompt = 'Choose a color number for tag "' + tagText + '":\n\n' +
          '1: Green\n2: Blue\n3: Red\n4: Yellow\n5: Purple\n' +
          '6: Orange\n7: Turquoise\n8: Light Gray\n9: Dark Gray\n10: Gold';
        
        const colorChoice = prompt(colorPrompt, '1');
        
        if (colorChoice === null) {
          return null; 
        }

        const colorNumber = parseInt(colorChoice);
        if (isNaN(colorNumber) || colorNumber < 1 || colorNumber > 10) {
          alert('Please enter a number between 1 and 10.');
          continue;
        }

        tagColors.push(colorNumber.toString()); 
        break;
      }
    }

    return {
      tag_Text: tagTexts.map(tag => String(tag).trim()), // Ensure tags are strings
      tag_Colors: tagColors  
    };
  }
}


function validateTagContent(tag) {

  const suspiciousPatterns = [
    { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, message: 'contains script tags' },
    { pattern: /javascript:/gi, message: 'contains javascript code' },
    { pattern: /onerror=/gi, message: 'contains invalid attributes' },
    { pattern: /onload=/gi, message: 'contains invalid attributes' },
    { pattern: /onclick=/gi, message: 'contains invalid attributes' }
  ];

  for (const { pattern, message } of suspiciousPatterns) {
    if (pattern.test(tag)) {
      return {
        isValid: false,
        message: message
      };
    }
  }

  return {
    isValid: true,
    message: ''
  };
}


function isValidColor(color) {

  const testDiv = document.createElement('div');
  testDiv.style.color = color;
  return testDiv.style.color !== '';
}

// Rename card (previously edit)
async function renameCard(cardId) {
  try {
    const card = await databases.getDocument(DATABASE_ID, COLLECTION_ID, cardId);
    
    const title = await promptWithValidation('Enter new title:', card.title, 64, 'Title');
    if (!title) return;

    const updatedCard = {
      title: title,
      description: card.description,
      userId: card.userId,
      visibility: card.visibility,
      last_modified: new Date().toISOString(),
      tag_Text: card.tag_Text,
      tag_Colors: card.tag_Colors
    };

    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, cardId, updatedCard);
    const user = await window.account.get();
    await loadCards(user.$id);
  } catch (error) {
    console.error('Error renaming card:', error);
    if (error.code === 401) {
      alert('You do not have permission to rename this card.');
    } else {
      const errorMessage = error.message.includes('title has invalid type')
        ? 'Title must be less than 64 characters and cannot be empty.'
        : 'Failed to rename card. Please try again.';
      alert(errorMessage);
    }
  }
}


async function deleteCard(cardId) {
  if (!confirm('Are you sure you want to delete this card?')) return;
  
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, cardId);
    const user = await window.account.get();
    await loadCards(user.$id);
  } catch (error) {
    console.error('Error deleting card:', error);
    if (error.code === 401) {
      alert('You do not have permission to delete this card.');
    } else {
      alert('Failed to delete card. Please try again.');
    }
  }
}


function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <h3>${project.title}</h3>
        <p>${project.description}</p>
    `;
    

    card.addEventListener('click', () => {
        window.location.href = `editor.html?projectId=${project.$id}`;
    });
    
    return card;
} 
