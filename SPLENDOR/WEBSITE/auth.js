// Appwrite client setp
window.client = new Appwrite.Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('680364d1000477ec420b');

window.account = new Appwrite.Account(window.client);


async function checkSession() {
  try {
    
    const session = await window.account.getSession('current');
    if (!session) {
      throw new Error('No active session');
    }

    
    const user = await window.account.get();
    if (!user) {
      throw new Error('No user found');
    }
    
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
      userDisplay.innerHTML = `
        <div class="welcome-message">
          Welcome, ${user.name}
        </div>
        <div class="user-email">
          ${user.email}
        </div>
      `;
    }
    
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.style.display = 'block';
    }


    if (typeof window.initializeCards === 'function') {
      window.initializeCards();
    }
    
    return user;
  } catch (error) {
    console.error('Session check failed:', error);
    // Only redirect if we're not already on the login page
    if (window.location.pathname.indexOf('Login.html') === -1) {
      window.location.href = 'Login.html';
    }
    throw error;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.indexOf('Login.html') === -1 && 
      window.location.pathname.indexOf('Register.html') === -1) {
    checkSession().catch(error => {
      console.error('Failed to check session:', error);
    });
  }
});

// Logout functionality
document.getElementById('logoutButton')?.addEventListener('click', function(e) {
  e.preventDefault();
  window.account.deleteSession('current')
    .then(() => {
      window.location.href = 'Login.html';
    })
    .catch(err => {
      console.error('Error logging out:', err);
    });
}); 