const apiKey = '19c8de731e0349f993c2a89619724467'; // https://newsapi.org
const defaultSource = 'the-washington-post';
const sourceSelector = document.querySelector('#sources');
const newsArticles = document.querySelector('main');
const pushButton = document.querySelector("#button");
const sendButton = document.querySelector("#sendPush");
//Generate public key for PUSH here: https://web-push-codelab.glitch.me/
const applicationServerPublicKey = 'BBMZz7o84XIlWlAq2lgxbTXr724sZlJxfcedC28W72oEWbhAOMC9t_W-AMKOtn8EsPlBNyGDjDnJjgdAkrivP7E';
const options = { // Push notification sample body
  body: 'Click to see our website',
  icon: 'images/icons/icon-192x192.png',
  badge: 'images/icons/icon-192x192.png', //!!!This is used only on Android!!!
  vibrate: [100, 50, 100]
  //there are mor possibilities. Some are platform-specific: https://docs.telerik.com/platform/backend-services/javascript/push-notifications/send-and-target/push-set-options.html
};

// This turns public API key to Array required for push messages
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

//Check if service worker and push messages are available
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('sw.js')
      // .then(registration  => console.log('Service Worker registered', registration))
      .then(registration => initializeUI(registration))
      .catch(err => 'SW registration failed'));
} else {
  console.warn('Push messages not supported');
  pushButton.textContent = "Push not supported";
}

//This part generates the website from the newsapi.org
window.addEventListener('load', e => {
  sourceSelector.addEventListener('change', evt => updateNews(evt.target.value));
  updateNewsSources().then(() => {
    sourceSelector.value = defaultSource;
    updateNews();
  });
});

window.addEventListener('online', () => updateNews(sourceSelector.value));

async function updateNewsSources() {
  const response = await fetch(`https://newsapi.org/v2/sources?apiKey=${apiKey}`);
  const json = await response.json();
  sourceSelector.innerHTML =
    json.sources
      .map(source => `<option value="${source.id}">${source.name}</option>`)
      .join('\n');
}

async function updateNews(source = defaultSource) {
  newsArticles.innerHTML = '';
  const response = await fetch(`https://newsapi.org/v2/top-headlines?sources=${source}&sortBy=top&apiKey=${apiKey}`);
  const json = await response.json();
  newsArticles.innerHTML =
    json.articles.map(createArticle).join('\n');
}

function createArticle(article) {
  return `
    <div class="article">
      <a href="${article.url}">
        <h2>${article.title}</h2>
        <amp-img
        src="${article.urlToImage}"
        alt="${article.title}"
        width="160"
        height="90"
        layout="responsive">
        </amp-img>
        <p>${article.description}</p>
      </a>
    </div>
  `;
}
//website created!


function initializeUI(registration) {
  // Set the initial subscription value
  // 'registration' stands for Service Worker object
  console.table(registration);

  //Show PUSH notification
  sendButton.addEventListener('click', function() {
    registration.showNotification('M4U Push Notification', options);
  });

  //listen to the push button
  pushButton.addEventListener('click', function() {
    pushButton.disabled = true; //disable second click and subscribe or unsubscribe PUSH notifications
    if (isSubscribed) {
      unsubscribeUser(registration);
    } else {
      subscribeUser(registration);
    }
  });
  // Check the state of subscription
  registration.pushManager.getSubscription()
    .then(function (subscription) {
      isSubscribed = !(subscription === null);
      if (isSubscribed) {
        console.log('User IS subscribed.');
      } else {
        console.log('User is NOT subscribed.');
      }
      updateBtn();
    });
}

function subscribeUser(registration) {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('User is subscribed.');
    updateSubscriptionOnServer(subscription);
    isSubscribed = true;
    updateBtn();
  })
  .catch(function(err) {
    console.log('Failed to subscribe the user: ', err);
    updateBtn();
  });
}

function unsubscribeUser(registration) {
  registration.pushManager.getSubscription()
  .then(function(subscription) {
    if (subscription) {
      return subscription.unsubscribe();
    }
  })
  .catch(function(error) {
    console.log('Error unsubscribing', error);
  })
  .then(function() {
    updateSubscriptionOnServer(null);
    console.log('User is unsubscribed.');
    sendButton.style.visibility = "hidden";
    isSubscribed = false;
    updateBtn();
  });
}

function updateSubscriptionOnServer(subscription) {
  if (subscription) {
    console.log('Now I can show PUSH notifications!');
  } else {
    console.log('I cannot PUSH anything up :(');
  }
}

function updateBtn() {
  if (Notification.permission === 'denied') {
    pushButton.textContent = 'Push Messaging Blocked.';
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging';
    sendButton.style.visibility = 'visible';
  } else {
    pushButton.textContent = 'Enable Push Messaging';
  }
  pushButton.disabled = false;
}
