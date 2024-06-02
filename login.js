// Encryption and decryption functions using Web Crypto API
async function getKeyMaterial(secret) {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
}

async function getKey(keyMaterial, salt) {
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

async function encryptData(data, secret) {
    const enc = new TextEncoder();
    const keyMaterial = await getKeyMaterial(secret);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await getKey(keyMaterial, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(data));
    return { encrypted: new Uint8Array(encrypted), iv: iv, salt: salt };
}

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();

    document.getElementById('loginButton').addEventListener('click', function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        fetch('http://127.0.0.1:8000/centralized_API_backend/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(async data => {
            if (data.token) {
                const { encrypted, iv, salt } = await encryptData(data.token, data.secret);
                chrome.storage.sync.set({ hanuelUserEmail: email, hanuelUserToken: Array.from(encrypted), secret: data.secret, iv: Array.from(iv), salt: Array.from(salt) }, function() {
                    console.log('Login successful. User email and token saved');
                    displayUserInfo(email);
                });
            } else {
                document.getElementById('status').textContent = 'Login failed: ' + data.message;
                document.getElementById('status').style.color = 'red';
            }
        })
        .catch(error => {
            document.getElementById('status').textContent = 'Error: ' + error.message;
            document.getElementById('status').style.color = 'red';
        });
    });

    document.getElementById('logoutButton').addEventListener('click', function() {
        chrome.storage.sync.remove(['hanuelUserEmail', 'hanuelUserToken', 'secret', 'iv', 'salt'], function() {
            console.log('User logged out');
            displayLoginForm();
        });
    });
});

function checkLoginStatus() {
    chrome.storage.sync.get(['hanuelUserEmail'], function(result) {
        if (result.hanuelUserEmail) {
            displayUserInfo(result.hanuelUserEmail);
        } else {
            displayLoginForm();
        }
    });
}

function displayUserInfo(email) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('userEmail').textContent = `Logged in as: ${email}`;
}

function displayLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('status').textContent = '';
}
